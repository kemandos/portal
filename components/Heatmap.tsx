import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Resource, ViewState, ThemeSettings, CellCoordinate, SelectionRange } from '../types';
import { MONTHS } from '../constants';
import { Check, Folder, Briefcase, Users, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface HeatmapProps {
  data: Resource[];
  viewMode: ViewState['mode'];
  timeRange: ViewState['timeRange'];
  onItemClick: (id: string) => void;
  onSelectionChange: (ids: string[]) => void;
  selectedIds: string[];
  themeSettings?: ThemeSettings;
  density?: 'comfortable' | 'compact';
  selectionRange: SelectionRange | null;
  onSelectionRangeChange: (range: SelectionRange | null) => void;
  onCellClick: (resourceId: string, month: string) => void;
  expandedRows: Record<string, boolean>;
  setExpandedRows: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedMonthIndices?: number[];
  onMonthSelectionChange?: (indices: number[]) => void;
  onAddChild?: (resourceId: string) => void;
  onInlineSave?: (resourceId: string, month: string, value: number, isCapacity: boolean) => void;
}

interface RowItem {
  type: 'resource' | 'action';
  resource?: Resource;
  parentId?: string;
  depth: number;
  isGroupHeader: boolean;
  key: string;
}

export const Heatmap: React.FC<HeatmapProps> = ({ 
  data, 
  viewMode, 
  timeRange,
  onItemClick, 
  onSelectionChange, 
  selectedIds,
  themeSettings = { colorTheme: 'rose', cellStyle: 'modern' } as ThemeSettings,
  density = 'comfortable',
  selectionRange,
  onSelectionRangeChange,
  onCellClick,
  expandedRows,
  setExpandedRows,
  selectedMonthIndices = [],
  onMonthSelectionChange,
  onAddChild,
  onInlineSave
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<CellCoordinate | null>(null);
  const isHeaderDrag = useRef(false);
  const hasDragged = useRef(false);
  
  // Inline Edit State
  const [editingCell, setEditingCell] = useState<{resourceId: string, month: string, value: string} | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tooltip State
  const [tooltipState, setTooltipState] = useState<{
    content: React.ReactNode;
    position: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [editingCell]);

  const isCompact = density === 'compact';
  const visibleMonths = MONTHS.slice(0, timeRange === '3M' ? 3 : timeRange === '6M' ? 6 : 9);

  // Calculate all selectable IDs (excluding groups and secondary items) recursively
  const allSelectableIds = useMemo(() => {
      const ids: string[] = [];
      const traverse = (nodes: Resource[]) => {
          nodes.forEach(node => {
              const isSelectable = viewMode === 'People' 
                  ? node.type === 'employee' 
                  : node.type === 'project';

              if (isSelectable) {
                  ids.push(node.id);
              }
              if (node.children && node.children.length > 0) {
                  traverse(node.children);
              }
          });
      };
      traverse(data);
      return ids;
  }, [data, viewMode]);

  const flattenedRows = useMemo(() => {
    const rows: RowItem[] = [];
    const traverse = (nodes: Resource[], depth = 0) => {
        nodes.forEach(node => {
            const hasChildren = node.children && node.children.length > 0;
            const isGroupHeader = node.type === 'group'; 
            
            rows.push({ 
                type: 'resource',
                resource: node, 
                depth, 
                isGroupHeader,
                key: node.id
            });

            // For People view, we DO NOT expand employees anymore, effectively hiding the children
            const shouldHideChildren = viewMode === 'People' && node.type === 'employee';
            
            const isExpanded = shouldHideChildren ? false : (expandedRows[node.id] ?? node.isExpanded);

            if (isExpanded) {
                 if (hasChildren) {
                     let childrenToRender = node.children!;

                     // FILTER: In People view, if months are selected, only show children 
                     // that have active assignments (PT > 0) in the selected months.
                     if (viewMode === 'People' && selectedMonthIndices.length > 0) {
                         const selectedMonthKeys = selectedMonthIndices.map(i => visibleMonths[i]).filter(Boolean);
                         childrenToRender = childrenToRender.filter(child => {
                             return selectedMonthKeys.some(m => (child.allocations[m]?.pt || 0) > 0);
                         });
                     }

                     traverse(childrenToRender, depth + 1);
                 }
                 
                 // Add Action Row (Add Project) 
                 // Only for Projects view
                 const showActionRow = (viewMode === 'Projects' && node.type === 'project');

                 if (showActionRow) {
                     rows.push({
                         type: 'action',
                         parentId: node.id,
                         depth: depth + 1,
                         isGroupHeader: false,
                         key: `action-${node.id}`
                     });
                 }
            }
        });
    };
    traverse(data);
    return rows;
  }, [data, expandedRows, viewMode, selectedMonthIndices, visibleMonths]);

  const handleMouseDown = (resourceId: string, monthIndex: number, rowIndex: number) => {
      // If editing, don't start selection
      if (editingCell) return;
      
      const coord = { resourceId, monthIndex, rowIndex };
      dragStartRef.current = coord;
      setIsDragging(false);
      onSelectionRangeChange({ start: coord, end: coord });
  };

  const handleMouseEnter = (resourceId: string, monthIndex: number, rowIndex: number) => {
      if (dragStartRef.current && !editingCell) {
          setIsDragging(true);
          
          let endRowIndex = rowIndex;
          let endResourceId = resourceId;

          if (isHeaderDrag.current) {
             endRowIndex = flattenedRows.length - 1;
             const lastRow = flattenedRows[flattenedRows.length - 1];
             if (lastRow.type === 'resource') {
                 endResourceId = lastRow.resource!.id;
             }
          }

          onSelectionRangeChange({
              start: dragStartRef.current,
              end: { resourceId: endResourceId, monthIndex, rowIndex: endRowIndex }
          });
      }
  };

  const handleMouseUp = (resourceId: string, monthIndex: number, initialValue: string | number, isRootRow: boolean) => {
      if (!isDragging && dragStartRef.current && !editingCell) {
          // CONDITION: Inline Editing is only for Project View on the Root (Project) Row (Capacity Editing)
          if (viewMode === 'Projects' && isRootRow) {
              const month = visibleMonths[monthIndex];
              setEditingCell({
                  resourceId,
                  month,
                  value: initialValue.toString()
              });
          } else {
              // Otherwise open the standard Modal
              onCellClick(resourceId, visibleMonths[monthIndex]);
          }
      }
      dragStartRef.current = null;
      setIsDragging(false);
  };
  
  const handleInlineInputBlur = () => {
      if (editingCell && onInlineSave) {
          const val = parseFloat(editingCell.value);
          const isAssignment = editingCell.resourceId.includes('::');
          let isCapacity = false;
          
          if (!isAssignment) {
              isCapacity = true;
          }
          
          if (!isNaN(val)) {
              onInlineSave(editingCell.resourceId, editingCell.month, val, isCapacity);
          }
      }
      setEditingCell(null);
  };
  
  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleInlineInputBlur();
      } else if (e.key === 'Escape') {
          setEditingCell(null);
      }
  };

  const handleHeaderMouseDown = (e: React.MouseEvent, index: number) => {
      if (flattenedRows.length === 0) return;
      if (e.shiftKey || e.metaKey || e.ctrlKey) return; 

      isHeaderDrag.current = true;
      setIsDragging(true);
      hasDragged.current = false;

      const firstRow = flattenedRows.find(r => r.type === 'resource');
      if (!firstRow || !firstRow.resource) return;

      const startCoord = { 
          resourceId: firstRow.resource.id, 
          rowIndex: 0, 
          monthIndex: index 
      };
      dragStartRef.current = startCoord;
      
      const reversedRows = [...flattenedRows].reverse();
      const lastRow = reversedRows.find(r => r.type === 'resource');
      if (!lastRow || !lastRow.resource) return;

      const endCoord = {
          resourceId: lastRow.resource.id,
          rowIndex: flattenedRows.indexOf(lastRow),
          monthIndex: index
      };
      
      onSelectionRangeChange({ start: startCoord, end: endCoord });
  };

  const handleHeaderMouseEnter = (index: number) => {
      if (!isDragging || !dragStartRef.current) return;
      
      if (isHeaderDrag.current) {
          hasDragged.current = true;
          const start = dragStartRef.current;
          const reversedRows = [...flattenedRows].reverse();
          const lastRow = reversedRows.find(r => r.type === 'resource');
          if (!lastRow || !lastRow.resource) return;

          const end = {
              resourceId: lastRow.resource.id,
              rowIndex: flattenedRows.indexOf(lastRow),
              monthIndex: index
          };
          onSelectionRangeChange({ start, end });
      }
  };

  const handleMonthHeaderClick = (e: React.MouseEvent, monthIndex: number) => {
      if (!onMonthSelectionChange) return;
      if (flattenedRows.length === 0) return;
      if (hasDragged.current) return;

      const isSelected = selectedMonthIndices.includes(monthIndex);
      let newIndices: number[];

      if (isSelected) {
          newIndices = selectedMonthIndices.filter(i => i !== monthIndex);
      } else {
          newIndices = [...selectedMonthIndices, monthIndex];
      }
      onMonthSelectionChange(newIndices);
      onSelectionRangeChange(null);
  };

  const bounds = useMemo(() => {
      if (!selectionRange) return null;
      return {
          minRow: Math.min(selectionRange.start.rowIndex, selectionRange.end.rowIndex),
          maxRow: Math.max(selectionRange.start.rowIndex, selectionRange.end.rowIndex),
          minCol: Math.min(selectionRange.start.monthIndex, selectionRange.end.monthIndex),
          maxCol: Math.max(selectionRange.start.monthIndex, selectionRange.end.monthIndex)
      };
  }, [selectionRange]);

  const getStatusStyle = (percentage: number, isTransparent: boolean = false) => {
    const opacity = themeSettings.heatmapOpacity !== undefined ? themeSettings.heatmapOpacity : 1;
    const colors = themeSettings.thresholdColors || {
        under: '#cbd5e1', 
        balanced: '#ee3a5e', 
        optimal: '#ee3a5e', 
        over: '#be123c'
    };
    const thresholds = themeSettings.thresholds || { under: 50, balanced: 90, over: 110 };

    const applyOpacity = (hex: string) => {
        if (!hex) return '#ee3a5e';
        if (opacity === 1) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    if (percentage === 0) return { backgroundColor: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(0, 0, 0, 0.05)', color: '#94a3b8' };

    if (isTransparent) {
        return { 
            backgroundColor: 'transparent',
            color: '#1e293b', 
            fontWeight: 700
        };
    }
    
    if (percentage > thresholds.over) return { backgroundColor: applyOpacity(colors.over), color: '#ffffff', boxShadow: '0 4px 14px rgba(190, 18, 60, 0.25)' }; 
    if (percentage > thresholds.balanced) return { backgroundColor: applyOpacity(colors.optimal), color: '#ffffff', boxShadow: '0 4px 14px rgba(238, 58, 94, 0.25)' }; 
    if (percentage > thresholds.under) return { backgroundColor: applyOpacity(colors.balanced), color: '#ffffff', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)' }; 
    if (percentage > 0) return { backgroundColor: applyOpacity(colors.under), color: '#475569' }; 
    
    return { backgroundColor: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(0, 0, 0, 0.05)', color: '#94a3b8' };
  };

  const rowMinHeight = isCompact ? 'min-h-[40px]' : 'min-h-[68px]';
  const cellHeight = isCompact ? 'h-[32px]' : 'h-[48px]';
  const paddingClass = isCompact ? 'px-2 py-1.5' : 'px-4 py-2';
  const headerPaddingClass = isCompact ? 'px-2 py-2.5' : 'px-4 py-3';
  
  const LiquidCheckbox = ({ checked, onChange }: { checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className={`relative inline-flex items-center justify-center ${isCompact ? 'size-4' : 'size-5'} group cursor-pointer`}>
        <input 
            type="checkbox" 
            checked={checked} 
            onChange={onChange}
            className={`peer appearance-none ${isCompact ? 'size-4' : 'size-5'} rounded-full border border-gray-300 bg-white/60 backdrop-blur-sm cursor-pointer transition-all duration-300 ease-spring checked:bg-primary checked:border-primary checked:scale-110 hover:scale-110 active:scale-90`}
        />
        <Check 
            size={isCompact ? 10 : 12} 
            className="absolute text-white opacity-0 peer-checked:opacity-100 transition-all duration-200 pointer-events-none stroke-[3]" 
        />
    </div>
  );

  const renderIcon = (resource: Resource) => {
      const hasChildren = resource.children && resource.children.length > 0;
      const sizeClass = isCompact ? "w-8 h-8" : "w-10 h-10";
      const iconSizeClass = isCompact ? "size-8" : "size-10";
      const statusIndicatorClass = isCompact ? "w-2.5 h-2.5" : "w-3 h-3";
      
      if (resource.type === 'project' && resource.avatar) {
          return (
            <div className={`relative ${sizeClass} rounded-lg bg-white flex-shrink-0 border border-gray-100 shadow-sm transition-transform duration-300 ease-spring hover:scale-110 hover:shadow-glow overflow-hidden p-1`}>
                <div className="w-full h-full flex items-center justify-center">
                    <img src={resource.avatar} alt={resource.name} className="max-w-full max-h-full object-contain" />
                </div>
                {resource.status && <div className={`absolute bottom-0 right-0 ${statusIndicatorClass} ${resource.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'} border-2 border-white rounded-full z-10 shadow-sm transform translate-x-1/3 translate-y-1/3`}></div>}
            </div>
          );
      }
      if (resource.type === 'employee') {
          // Heatmap Ring Logic
          const radius = 22; 
          const circumference = 2 * Math.PI * radius;
          const segmentLength = circumference / visibleMonths.length;
          const strokeWidth = 3;
          
          return (
            <div className={`relative ${sizeClass} rounded-full bg-gray-100 flex-shrink-0 border-2 border-white shadow-sm transition-transform duration-300 ease-spring hover:scale-110 hover:shadow-glow group/avatar`}>
                <div className="w-full h-full rounded-full overflow-hidden relative z-10">
                    <img src={resource.avatar || `https://i.pravatar.cc/150?u=${resource.id}`} alt={resource.name} className="w-full h-full object-cover" />
                </div>
                
                {/* SVG Heatmap Ring */}
                <svg className="absolute -inset-[6px] w-[calc(100%+12px)] h-[calc(100%+12px)] z-0 rotate-[-90deg]" viewBox="0 0 52 52">
                   {visibleMonths.map((month, index) => {
                       const alloc = resource.allocations[month];
                       const pt = alloc ? alloc.pt : 0;
                       const cap = alloc ? alloc.capacity : 20;
                       const pct = cap > 0 ? (pt / cap) * 100 : 0;
                       
                       let color = '#e2e8f0'; // slate-200 (empty/default)
                       const thresholds = themeSettings.thresholds || { under: 50, balanced: 90, over: 110 };
                       
                       if (pt > 0) {
                           if (pct > thresholds.over) color = '#be123c'; // red
                           else if (pct > thresholds.under) color = '#ee3a5e'; // primary
                           else color = '#cbd5e1'; // gray/blue
                       }
                       
                       // Calculate stroke-dasharray to create segments
                       // dash length = segmentLength - gap
                       const gap = 3;
                       const effectiveLength = (circumference / visibleMonths.length) - gap;
                       const offset = -index * (circumference / visibleMonths.length);

                       return (
                           <circle 
                               key={month}
                               cx="26" cy="26" r={radius}
                               fill="none"
                               stroke={color}
                               strokeWidth={strokeWidth}
                               strokeDasharray={`${effectiveLength} ${circumference - effectiveLength}`}
                               strokeDashoffset={offset}
                               strokeLinecap="round"
                               className="transition-all duration-500"
                           />
                       );
                   })}
                </svg>
            </div>
          );
      }
      let Icon = Folder;
      if (resource.type === 'project') Icon = Briefcase;
      if (resource.type === 'group') Icon = Users;
      const ringClass = hasChildren ? "ring-2 ring-primary ring-offset-2 ring-offset-white/80" : "";
      return (
        <div className={`${iconSizeClass} rounded-full ${resource.color ? 'bg-white text-primary' : 'bg-white/80 text-primary'} flex items-center justify-center shadow-sm border border-white/50 backdrop-blur-sm ${ringClass} transition-transform duration-300 ease-spring hover:scale-110 hover:bg-white hover:shadow-glow`}>
            <Icon size={isCompact ? 14 : 18} strokeWidth={2.5} />
        </div>
      );
  };

  const handleResourceClick = (e: React.MouseEvent, resource: Resource) => {
      e.stopPropagation();
      // If forced expand (People View Employees), do not allow collapse
      if (viewMode === 'People' && resource.type === 'employee') {
          onItemClick(resource.id); // Just select it
          return;
      }

      // Allow expansion if it has children OR if it is a project in Projects view (to show Add Employee)
      const canExpand = (resource.children && resource.children.length > 0) || 
                        (viewMode === 'Projects' && resource.type === 'project');

      if (canExpand) {
          setExpandedRows(prev => ({ ...prev, [resource.id]: !prev[resource.id] }));
      } else {
          onItemClick(resource.id);
      }
  };

  const handleCellMouseEnter = (e: React.MouseEvent, resource: Resource, month: string, monthIndex: number, rowIndex: number) => {
    // 1. Handle Selection Dragging
    handleMouseEnter(resource.id, monthIndex, rowIndex);

    // 2. Handle Tooltip
    if (!isDragging) {
        const alloc = resource.allocations[month];
        if (alloc && (alloc.pt > 0 || alloc.capacity > 0)) {
            const pct = alloc.capacity > 0 ? Math.round((alloc.pt / alloc.capacity) * 100) : 0;
            
            // Breakdown for People View Employee Tooltip
            let breakdown = null;
            if (viewMode === 'People' && resource.type === 'employee' && resource.children) {
                const activeAssignments = resource.children.filter(c => (c.allocations[month]?.pt || 0) > 0);
                if (activeAssignments.length > 0) {
                     breakdown = (
                        <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
                            {activeAssignments.map(c => (
                                <div key={c.id} className="flex justify-between gap-4 text-[10px]">
                                    <span className="opacity-80 truncate max-w-[120px]">{c.name}</span>
                                    <span className="font-mono">{c.allocations[month].pt} PT</span>
                                </div>
                            ))}
                        </div>
                     );
                }
            }

            const content = (
                <div className="flex flex-col gap-1">
                    <div className="font-bold text-sm">{month}</div>
                    <div className="text-xs opacity-90">{resource.name}</div>
                    <div className="mt-1 flex items-center justify-between gap-4">
                        <span>Allocation:</span>
                        <span className="font-mono">{alloc.pt.toFixed(1)} / {alloc.capacity.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span>Utilization:</span>
                        <span className={`font-bold ${pct > 100 ? 'text-red-300' : 'text-emerald-300'}`}>{pct}%</span>
                    </div>
                    {breakdown}
                </div>
            );
            setTooltipState({
                content,
                position: { x: e.clientX, y: e.clientY }
            });
        }
    }
  };

  const handleCellMouseLeave = () => {
    setTooltipState(null);
  };

  return (
    <div className="bg-[#FDFBF7]/60 backdrop-blur-2xl rounded-3xl shadow-glass border border-white/50 overflow-hidden flex flex-col h-full w-full select-none"
         onMouseUp={() => { 
             dragStartRef.current = null; 
             setIsDragging(false); 
             isHeaderDrag.current = false;
         }}>
        
        <Tooltip content={tooltipState?.content} position={tooltipState?.position || null} />

        <div className="flex-1 relative w-full overflow-auto hide-scrollbar">
            <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                    <col className="w-[48px]" />
                    <col className="w-[180px] md:w-[240px]" />
                    {visibleMonths.map(m => <col key={m} />)}
                </colgroup>
                <thead className="sticky top-0 z-30 bg-white/50 backdrop-blur-xl">
                    <tr className="border-b border-slate-200">
                        <th className={`sticky left-0 z-40 bg-white/60 backdrop-blur-xl ${headerPaddingClass} text-center`}>
                            <LiquidCheckbox 
                                checked={allSelectableIds.length > 0 && allSelectableIds.every(id => selectedIds.includes(id))}
                                onChange={(e) => onSelectionChange(e.target.checked ? allSelectableIds : [])}
                            />
                        </th>
                        <th className={`sticky left-[48px] z-40 bg-white/60 backdrop-blur-xl ${headerPaddingClass} text-sm font-bold text-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] align-middle border-r border-slate-200`}>
                            <div className="flex items-center h-full">
                                {viewMode === 'People' ? 'Employee' : 'Project'}
                            </div>
                        </th>
                        {visibleMonths.map((month, index) => {
                            const isColumnSelected = 
                                (bounds && index >= bounds.minCol && index <= bounds.maxCol && bounds.minRow === 0 && bounds.maxRow === flattenedRows.length - 1) ||
                                selectedMonthIndices.includes(index);
                            return (
                                <th 
                                    key={month} 
                                    className={`
                                        ${headerPaddingClass} text-sm font-bold text-center uppercase tracking-wider align-middle cursor-pointer transition-all duration-300
                                        border-t-[4px] hover:bg-white/40 border-l border-slate-200/50
                                        ${isColumnSelected ? 'border-t-primary bg-primary/5 text-primary' : 'border-t-transparent text-slate-500'}
                                    `}
                                    onMouseDown={(e) => handleHeaderMouseDown(e, index)}
                                    onMouseEnter={() => handleHeaderMouseEnter(index)}
                                    onClick={(e) => handleMonthHeaderClick(e, index)}
                                >
                                    <div className={`transition-transform duration-300 ease-spring ${isColumnSelected ? 'scale-110' : 'hover:scale-105'}`}>
                                        {month}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {flattenedRows.map((row, rowIndex) => {
                        if (row.type === 'action') {
                            const isPeopleViewAction = viewMode === 'People';
                            const label = isPeopleViewAction ? 'Add Assignment' : 'Add Employee';
                            
                            return (
                                <tr key={row.key} className={`${rowMinHeight} group`}>
                                    <td className={`sticky left-0 z-20 bg-slate-50/50 backdrop-blur-md ${paddingClass}`}>
                                         <div className="w-full h-full flex items-center justify-center">
                                             <div className="w-5 h-5 rounded border border-gray-300"></div>
                                         </div>
                                    </td>
                                    <td 
                                        className={`sticky left-[48px] z-20 bg-slate-50/50 backdrop-blur-md ${paddingClass} border-r border-slate-200 cursor-pointer relative ring-2 ring-blue-400/0 z-30`}
                                    >
                                        <div className="flex items-center h-full">
                                            <div style={{ width: row.depth * 24 }} className="shrink-0" />
                                            <button 
                                                type="button"
                                                className="flex items-center gap-3 text-sm font-semibold text-slate-600 hover:text-primary transition-colors group w-full px-2 py-1 rounded-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onAddChild && row.parentId) onAddChild(row.parentId);
                                                }}
                                            >
                                                <div className="flex items-center justify-center size-8 rounded-full border border-slate-300 bg-white group-hover:border-primary group-hover:bg-primary/5 transition-all shadow-sm">
                                                    <Plus size={16} />
                                                </div>
                                                <span>{label}</span>
                                            </button>
                                        </div>
                                    </td>
                                    {visibleMonths.map(month => (
                                        <td key={month} className="border-l border-slate-200/50 bg-slate-50/30"></td>
                                    ))}
                                </tr>
                            );
                        }

                        // Resource Row
                        const resource = row.resource!;
                        const isRowSelectable = viewMode === 'People' 
                            ? resource.type === 'employee' 
                            : resource.type === 'project';
                        
                        const isRowInRange = bounds && rowIndex >= bounds.minRow && rowIndex <= bounds.maxRow;
                        const isSelectedRow = selectedIds.includes(resource.id) || isRowInRange;
                        
                        // Check if this row is a top-level Project row (depth 0, viewMode Projects)
                        const isProjectRoot = viewMode === 'Projects' && row.depth === 0 && resource.type === 'project';
                        
                        // Check if this is a child row (employee) in Project View
                        const isProjectChild = viewMode === 'Projects' && !isProjectRoot;
                        
                        return (
                            <tr key={row.key} className={`${rowMinHeight} group transition-all duration-300 hover:bg-white/30`}>
                                {/* Checkbox */}
                                <td className={`sticky left-0 z-20 ${isSelectedRow ? 'bg-primary/5' : (selectedIds.includes(resource.id) ? 'bg-primary/5' : 'bg-white/20')} backdrop-blur-md ${paddingClass} text-center transition-colors align-middle`}>
                                    {!row.isGroupHeader && isRowSelectable && (
                                        <LiquidCheckbox 
                                            checked={selectedIds.includes(resource.id)}
                                            onChange={(e) => {
                                                onSelectionChange(e.target.checked ? [...selectedIds, resource.id] : selectedIds.filter(id => id !== resource.id));
                                            }}
                                        />
                                    )}
                                </td>
                                
                                {row.isGroupHeader ? (
                                    <td 
                                        colSpan={visibleMonths.length + 1}
                                        className={`sticky left-[48px] z-20 ${selectedIds.includes(resource.id) ? 'bg-primary/5' : 'bg-white/20'} backdrop-blur-md group-hover:bg-white/40 ${paddingClass} transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] cursor-pointer align-middle border-r border-slate-200`}
                                        onClick={(e) => handleResourceClick(e, resource)}
                                    >
                                        <div className="flex items-center">
                                            <div style={{ width: row.depth * 24 }} className="shrink-0 transition-all" />
                                            <div className="flex items-center gap-3 min-w-0 flex-1 group/item">
                                                {/* Add collapse/expand icon if it's a group or expandable project, but NOT for employees in People view */}
                                                {(resource.type === 'group' || (resource.type === 'project' && viewMode === 'Projects')) && (
                                                    <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                                                        {(expandedRows[resource.id] ?? resource.isExpanded) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </div>
                                                )}
                                                
                                                <div className="min-w-0 flex-1 transition-transform duration-300 ease-spring group-hover/item:translate-x-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`${row.depth > 0 ? 'text-xs font-semibold text-slate-700' : 'text-sm font-bold text-slate-900'} ${selectedIds.includes(resource.id) ? 'text-primary' : ''}`}>
                                                            {resource.name}
                                                        </span>
                                                    </div>
                                                    {row.depth === 0 && <div className="text-xs text-slate-500 font-medium truncate">{resource.subtext}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                ) : (
                                    <>
                                        {/* Resource Info */}
                                        <td 
                                            className={`sticky left-[48px] z-20 ${isSelectedRow ? 'bg-primary/5' : 'bg-white/20'} backdrop-blur-md group-hover:bg-white/40 ${paddingClass} transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] cursor-pointer align-middle border-r border-slate-200`}
                                            onClick={(e) => handleResourceClick(e, resource)}
                                        >
                                            <div className="flex items-center">
                                                <div style={{ width: row.depth * 24 }} className="shrink-0 transition-all" />
                                                <div className="flex items-center gap-3 min-w-0 flex-1 group/item">
                                                    {renderIcon(resource)}
                                                    <div className="min-w-0 flex-1 transition-transform duration-300 ease-spring group-hover/item:translate-x-1">
                                                        {resource.type === 'employee' ? (
                                                            <div className="flex flex-col justify-center">
                                                                <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-bold truncate text-slate-900 ${selectedIds.includes(resource.id) ? 'text-primary' : ''}`}>
                                                                    {resource.name}
                                                                </span>
                                                                {!isCompact && (
                                                                    <>
                                                                        <span className="text-[11px] text-slate-500 truncate leading-tight">
                                                                            {resource.subtext ? resource.subtext.split('•')[0].trim() : ''}
                                                                        </span>
                                                                        {resource.manager && (
                                                                            <span className="text-[10px] text-slate-400 truncate mt-0.5">MC: {resource.manager}</span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                 <div className="flex items-center gap-2">
                                                                    <span className={`${row.depth > 0 ? 'text-xs font-semibold text-slate-700' : 'text-sm font-bold truncate text-slate-900'} ${selectedIds.includes(resource.id) ? 'text-primary' : ''}`}>
                                                                        {resource.name}
                                                                    </span>
                                                                </div>
                                                                {row.depth === 0 && <div className="text-xs text-slate-500 font-medium truncate">{resource.subtext}</div>}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Months Cells */}
                                        {visibleMonths.map((month, monthIndex) => {
                                            const allocation = resource.allocations[month];
                                            const hasAllocation = allocation && (allocation.pt > 0 || allocation.capacity > 0);
                                            const percentage = (allocation && allocation.capacity > 0) 
                                                ? (allocation.pt / allocation.capacity) * 100 
                                                : (allocation && allocation.pt > 0 ? 999 : 0);
                                            
                                            const shouldRemoveBackground = viewMode === 'People' && resource.type === 'project';
                                            const style = getStatusStyle(percentage, shouldRemoveBackground);
                                            
                                            const isRangeSelected = bounds && 
                                                            rowIndex >= bounds.minRow && rowIndex <= bounds.maxRow && 
                                                            monthIndex >= bounds.minCol && monthIndex <= bounds.maxCol;
                                            const isColSelected = selectedMonthIndices.includes(monthIndex);
                                            const isSelected = isRangeSelected || isColSelected;
                                            
                                            const ptAllocated = allocation ? allocation.pt : 0;
                                            const ptCapacity = allocation && allocation.capacity > 0 ? allocation.capacity : 20.0;
                                            
                                            const isCompactMode = density === 'compact';
                                            
                                            const isEditing = editingCell?.resourceId === resource.id && editingCell?.month === month;
                                            // Value to show: For Project Root, show Capacity. For others, show Allocation.
                                            const editValue = isEditing ? editingCell.value : (isProjectRoot ? ptCapacity : ptAllocated);

                                            return (
                                                <td 
                                                    key={month} 
                                                    className={`p-1 relative cursor-pointer border-l border-slate-200/50 transition-all duration-300 align-middle ${isSelected ? 'bg-primary/5' : ''}`}
                                                    onMouseDown={() => handleMouseDown(resource.id, monthIndex, rowIndex)}
                                                    onMouseEnter={(e) => handleCellMouseEnter(e, resource, month, monthIndex, rowIndex)}
                                                    onMouseLeave={handleCellMouseLeave}
                                                    onMouseUp={() => handleMouseUp(resource.id, monthIndex, editValue, isProjectRoot)}
                                                >
                                                    <div className={`w-full ${cellHeight} rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 relative group/cell 
                                                        ${isSelected ? 'scale-100 ring-1 ring-primary/30' : 'hover:scale-105 hover:brightness-110 hover:shadow-liquid hover:-translate-y-0.5'}
                                                        ${isEditing ? 'bg-white ring-2 ring-primary shadow-lg z-50 scale-105' : ''}
                                                        active:scale-95 active:duration-100 ease-spring
                                                        `}
                                                        style={!isEditing ? style : {}}
                                                    >
                                                        {isEditing ? (
                                                            <input 
                                                                ref={inputRef}
                                                                type="number" 
                                                                className="w-full h-full text-center bg-transparent outline-none font-bold text-slate-900"
                                                                value={editingCell.value}
                                                                onChange={(e) => setEditingCell({...editingCell, value: e.target.value})}
                                                                onBlur={handleInlineInputBlur}
                                                                onKeyDown={handleInlineKeyDown}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        ) : (
                                                            hasAllocation || isProjectRoot ? (
                                                                <div className="flex flex-col items-center justify-center leading-none gap-0.5">
                                                                    {percentage >= 100 && !shouldRemoveBackground && (
                                                                        <Check size={9} className="absolute top-0.5 right-0.5 opacity-50 text-white" strokeWidth={3} />
                                                                    )}
                                                                    {isCompactMode ? (
                                                                        <span className="text-[10px] tracking-tighter">
                                                                            {Number.isInteger(ptAllocated) ? ptAllocated : ptAllocated.toFixed(1)}
                                                                            {!isProjectChild && `/${Number.isInteger(ptCapacity) ? ptCapacity : ptCapacity.toFixed(1)}`}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[11px]">
                                                                            {Number.isInteger(ptAllocated) ? ptAllocated : ptAllocated.toFixed(1)} 
                                                                            {!isProjectChild && ` / ${Number.isInteger(ptCapacity) ? ptCapacity : ptCapacity.toFixed(1)}`}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="opacity-0 group-hover/cell:opacity-100 text-slate-400 text-[10px] scale-150 font-light">+</span>
                                                            )
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );
};