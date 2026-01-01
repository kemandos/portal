import React, { useMemo, useRef, useState } from 'react';
import { Resource, ViewState, ThemeSettings, CellCoordinate, SelectionRange } from '../types';
import { MONTHS } from '../constants';
import { Check, Folder, Briefcase, Users } from 'lucide-react';
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
  onMonthSelectionChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<CellCoordinate | null>(null);
  const isHeaderDrag = useRef(false);
  const hasDragged = useRef(false);

  // Tooltip State
  const [tooltipState, setTooltipState] = useState<{
    content: React.ReactNode;
    position: { x: number; y: number };
  } | null>(null);

  const isCompact = density === 'compact';
  const visibleMonths = MONTHS.slice(0, timeRange === '3M' ? 3 : timeRange === '6M' ? 6 : 9);

  // Calculate all selectable IDs (excluding groups and secondary items) recursively
  const allSelectableIds = useMemo(() => {
      const ids: string[] = [];
      const traverse = (nodes: Resource[]) => {
          nodes.forEach(node => {
              // Only collect IDs for the primary entity type of the current view
              // People View -> Select Employees
              // Projects View -> Select Projects
              const isSelectable = viewMode === 'People' 
                  ? node.type === 'employee' 
                  : node.type === 'project';

              if (isSelectable) {
                  ids.push(node.id);
              }
              // Recursively check children
              if (node.children && node.children.length > 0) {
                  traverse(node.children);
              }
          });
      };
      traverse(data);
      return ids;
  }, [data, viewMode]);

  const flattenedRows = useMemo(() => {
    const rows: { resource: Resource; depth: number; isGroupHeader: boolean }[] = [];
    const traverse = (nodes: Resource[], depth = 0) => {
        nodes.forEach(node => {
            const hasChildren = node.children && node.children.length > 0;
            // Only 'group' type nodes (like Departments) are treated as section headers without cells
            const isGroupHeader = node.type === 'group'; 
            rows.push({ resource: node, depth, isGroupHeader });
            const isExpanded = expandedRows[node.id] ?? node.isExpanded;
            if (isExpanded && hasChildren) traverse(node.children!, depth + 1);
        });
    };
    traverse(data);
    return rows;
  }, [data, expandedRows]);

  const handleMouseDown = (resourceId: string, monthIndex: number, rowIndex: number) => {
      const coord = { resourceId, monthIndex, rowIndex };
      dragStartRef.current = coord;
      setIsDragging(false);
      onSelectionRangeChange({ start: coord, end: coord });
  };

  const handleMouseEnter = (resourceId: string, monthIndex: number, rowIndex: number) => {
      if (dragStartRef.current) {
          setIsDragging(true);
          
          let endRowIndex = rowIndex;
          let endResourceId = resourceId;

          if (isHeaderDrag.current) {
             endRowIndex = flattenedRows.length - 1;
             endResourceId = flattenedRows[flattenedRows.length - 1].resource.id;
          }

          onSelectionRangeChange({
              start: dragStartRef.current,
              end: { resourceId: endResourceId, monthIndex, rowIndex: endRowIndex }
          });
      }
  };

  const handleMouseUp = (resourceId: string, monthIndex: number) => {
      if (!isDragging && dragStartRef.current) {
          onCellClick(resourceId, visibleMonths[monthIndex]);
      }
      dragStartRef.current = null;
      setIsDragging(false);
  };

  const handleHeaderMouseDown = (e: React.MouseEvent, index: number) => {
      if (flattenedRows.length === 0) return;
      if (e.shiftKey || e.metaKey || e.ctrlKey) return; 

      isHeaderDrag.current = true;
      setIsDragging(true);
      hasDragged.current = false;

      const startCoord = { 
          resourceId: flattenedRows[0].resource.id, 
          rowIndex: 0, 
          monthIndex: index 
      };
      
      dragStartRef.current = startCoord;
      
      const endCoord = {
          resourceId: flattenedRows[flattenedRows.length - 1].resource.id,
          rowIndex: flattenedRows.length - 1,
          monthIndex: index
      };
      
      onSelectionRangeChange({ start: startCoord, end: endCoord });
  };

  const handleHeaderMouseEnter = (index: number) => {
      if (!isDragging || !dragStartRef.current) return;
      
      if (isHeaderDrag.current) {
          hasDragged.current = true;
          const start = dragStartRef.current;
          const end = {
              resourceId: flattenedRows[flattenedRows.length - 1].resource.id,
              rowIndex: flattenedRows.length - 1,
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

  const handleMonthHeaderDoubleClick = (monthIndex: number) => {
     if (!onMonthSelectionChange) return;
     onMonthSelectionChange([monthIndex]);
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

    const getColor = () => {
        if (percentage > thresholds.over) return colors.over;
        if (percentage > thresholds.balanced) return colors.optimal;
        if (percentage > thresholds.under) return colors.balanced;
        return colors.under;
    };

    const baseColor = getColor();

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
            backgroundColor: 'transparent', // No background for projects
            color: '#1e293b', // Black/Slate-800 font
            fontWeight: 700
        };
    }
    
    // Normal Filled Style
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
  
  // Custom Checkbox SVG to allow full Liquid styling
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
      
      if (resource.type === 'employee') {
          // Red ring if expandable (has children), otherwise grey ring
          const ringClass = hasChildren ? "ring-2 ring-red-500 ring-offset-1 ring-offset-white" : "ring-2 ring-gray-100";
          
          return (
            <div className={`relative ${sizeClass} rounded-full bg-gray-100 flex-shrink-0 border-2 border-white ${ringClass} shadow-sm transition-transform duration-300 ease-spring hover:scale-110 hover:shadow-glow`}>
                <div className="w-full h-full rounded-full overflow-hidden">
                    <img src={resource.avatar || `https://i.pravatar.cc/150?u=${resource.id}`} alt={resource.name} className="w-full h-full object-cover" />
                </div>
                {resource.status === 'Active' && <div className={`absolute bottom-0 right-0 ${statusIndicatorClass} bg-green-500 border-2 border-white rounded-full z-10 shadow-sm`}></div>}
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
      if (resource.children && resource.children.length > 0) {
          setExpandedRows(prev => ({ ...prev, [resource.id]: !prev[resource.id] }));
      } else {
          onItemClick(resource.id);
      }
  };

  const handleCellMouseEnter = (e: React.MouseEvent, resource: Resource, month: string, monthIndex: number, rowIndex: number) => {
    handleMouseEnter(resource.id, monthIndex, rowIndex);

    const allocation = resource.allocations[month];
    if (allocation && allocation.pt > 0) {
        const percentage = (allocation.capacity > 0) 
            ? (allocation.pt / allocation.capacity) * 100 
            : 999;
        
        // Find assigned projects (breakdown)
        const breakdown = resource.children?.filter(child => 
            child.type === 'project' && 
            child.allocations[month] && 
            child.allocations[month].pt > 0
        ).map(child => ({
            name: child.name,
            pt: child.allocations[month].pt
        }));

        const rect = (e.target as HTMLElement).getBoundingClientRect();
        
        setTooltipState({
            position: { x: rect.left + rect.width / 2, y: rect.bottom },
            content: (
                <div className="flex flex-col gap-2">
                    <div className="pb-2 border-b border-white/10">
                        <div className="font-bold text-sm text-white">{resource.name}</div>
                        <div className="flex items-center justify-between text-xs mt-1 gap-4">
                            <span className="text-white/60 font-medium">{month}</span>
                            <span className={`font-bold ${percentage > 110 ? 'text-red-400' : percentage < 50 ? 'text-blue-300' : 'text-emerald-400'}`}>
                                {percentage > 900 ? 'Over Capacity' : `${Math.round(percentage)}% Util`}
                            </span>
                        </div>
                    </div>
                    
                    {breakdown && breakdown.length > 0 ? (
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Assigned Projects</div>
                            {breakdown.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="size-1.5 rounded-full bg-primary/80 shrink-0"></div>
                                        <span className="text-white/90 truncate max-w-[140px]" title={item.name}>{item.name}</span>
                                    </div>
                                    <span className="font-mono text-white/60 shrink-0">{item.pt.toFixed(1)} PT</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-white/40 italic">No specific project details available</div>
                    )}
                </div>
            )
        });
    } else {
        setTooltipState(null);
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
                                    onDoubleClick={() => handleMonthHeaderDoubleClick(index)}
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
                        const isRowSelectable = viewMode === 'People' 
                            ? row.resource.type === 'employee' 
                            : row.resource.type === 'project';

                        return (
                            <tr key={row.resource.id} className={`${rowMinHeight} group transition-all duration-300 hover:bg-white/30`}>
                                {/* Checkbox */}
                                <td className={`sticky left-0 z-20 ${selectedIds.includes(row.resource.id) ? 'bg-primary/5 backdrop-blur-md' : 'bg-white/20 backdrop-blur-md group-hover:bg-white/40'} ${paddingClass} text-center transition-colors align-middle`}>
                                    {!row.isGroupHeader && isRowSelectable && (
                                        <LiquidCheckbox 
                                            checked={selectedIds.includes(row.resource.id)}
                                            onChange={(e) => {
                                                onSelectionChange(e.target.checked ? [...selectedIds, row.resource.id] : selectedIds.filter(id => id !== row.resource.id));
                                            }}
                                        />
                                    )}
                                </td>
                                
                                {row.isGroupHeader ? (
                                    <td 
                                        colSpan={visibleMonths.length + 1}
                                        className={`sticky left-[48px] z-20 ${selectedIds.includes(row.resource.id) ? 'bg-primary/5 backdrop-blur-md' : 'bg-white/20 backdrop-blur-md group-hover:bg-white/40'} ${paddingClass} transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] cursor-pointer align-middle border-r border-slate-200`}
                                        onClick={(e) => handleResourceClick(e, row.resource)}
                                    >
                                        <div className="flex items-center">
                                            <div style={{ width: row.depth * 24 }} className="shrink-0 transition-all" />
                                            
                                            <div className="flex items-center gap-3 min-w-0 flex-1 group/item">
                                                {/* No Icon for Group Headers */}

                                                <div className="min-w-0 flex-1 transition-transform duration-300 ease-spring group-hover/item:translate-x-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`${row.depth > 0 ? 'text-xs whitespace-normal leading-tight font-semibold text-slate-700' : 'text-sm font-bold truncate text-slate-900'} ${selectedIds.includes(row.resource.id) ? 'text-primary' : ''}`}>
                                                            {row.resource.name}
                                                        </span>
                                                    </div>
                                                    {row.depth === 0 && <div className="text-xs text-slate-500 font-medium truncate">{row.resource.subtext}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                ) : (
                                    <>
                                        {/* Resource Info */}
                                        <td 
                                            className={`sticky left-[48px] z-20 ${selectedIds.includes(row.resource.id) ? 'bg-primary/5 backdrop-blur-md' : 'bg-white/20 backdrop-blur-md group-hover:bg-white/40'} ${paddingClass} transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] cursor-pointer align-middle border-r border-slate-200`}
                                            onClick={(e) => handleResourceClick(e, row.resource)}
                                        >
                                            <div className="flex items-center">
                                                <div style={{ width: row.depth * 24 }} className="shrink-0 transition-all" />
                                                
                                                <div className="flex items-center gap-3 min-w-0 flex-1 group/item">
                                                    {renderIcon(row.resource)}

                                                    <div className="min-w-0 flex-1 transition-transform duration-300 ease-spring group-hover/item:translate-x-1">
                                                        {row.resource.type === 'employee' ? (
                                                            <div className="flex flex-col justify-center">
                                                                <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-bold truncate text-slate-900 ${selectedIds.includes(row.resource.id) ? 'text-primary' : ''}`}>
                                                                    {row.resource.name}
                                                                </span>
                                                                {!isCompact && (
                                                                    <>
                                                                        <span className="text-[11px] text-slate-500 truncate leading-tight">
                                                                            {row.resource.subtext ? row.resource.subtext.split('•')[0].trim() : ''}
                                                                        </span>
                                                                        {row.resource.manager && (
                                                                            <span className="text-[10px] text-slate-400 truncate mt-0.5">MC: {row.resource.manager}</span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                 <div className="flex items-center gap-2">
                                                                    <span className={`${row.depth > 0 ? 'text-xs whitespace-normal leading-tight font-semibold text-slate-700' : 'text-sm font-bold truncate text-slate-900'} ${selectedIds.includes(row.resource.id) ? 'text-primary' : ''}`}>
                                                                        {row.resource.name}
                                                                    </span>
                                                                </div>
                                                                {row.depth === 0 && <div className="text-xs text-slate-500 font-medium truncate">{row.resource.subtext}</div>}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Months Cells */}
                                        {visibleMonths.map((month, monthIndex) => {
                                            const allocation = row.resource.allocations[month];
                                            const hasAllocation = allocation && allocation.pt > 0;
                                            
                                            // Calculate Percentage Safe from Infinity
                                            const percentage = (allocation && allocation.capacity > 0) 
                                                ? (allocation.pt / allocation.capacity) * 100 
                                                : (allocation && allocation.pt > 0 ? 999 : 0);

                                            // Determine if this cell should have no background (for projects in People view)
                                            const shouldRemoveBackground = viewMode === 'People' && row.resource.type === 'project';
                                            const style = getStatusStyle(percentage, shouldRemoveBackground);
                                            
                                            const isRangeSelected = bounds && 
                                                            rowIndex >= bounds.minRow && rowIndex <= bounds.maxRow && 
                                                            monthIndex >= bounds.minCol && monthIndex <= bounds.maxCol;
                                            const isColSelected = selectedMonthIndices.includes(monthIndex);
                                            const isSelected = isRangeSelected || isColSelected;
                                            
                                            const ptAllocated = allocation ? allocation.pt : 0;
                                            const ptCapacity = allocation && allocation.capacity > 0 ? allocation.capacity : 20.0;
                                            
                                            const isCompactMode = density === 'compact';

                                            return (
                                                <td 
                                                    key={month} 
                                                    className={`p-1 relative cursor-pointer border-l border-slate-200/50 transition-all duration-300 align-middle ${isSelected ? 'bg-primary/5' : ''}`}
                                                    onMouseDown={() => handleMouseDown(row.resource.id, monthIndex, rowIndex)}
                                                    onMouseEnter={(e) => handleCellMouseEnter(e, row.resource, month, monthIndex, rowIndex)}
                                                    onMouseLeave={handleCellMouseLeave}
                                                    onMouseUp={() => handleMouseUp(row.resource.id, monthIndex)}
                                                >
                                                    <div className={`w-full ${cellHeight} rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 relative group/cell 
                                                        ${isSelected ? 'scale-90 shadow-liquid ring-2 ring-primary/20 brightness-105' : 'hover:scale-105 hover:brightness-110 hover:shadow-liquid hover:-translate-y-0.5'}
                                                        active:scale-90 active:duration-100 ease-spring
                                                        `}
                                                        style={style}>
                                                        
                                                        {hasAllocation ? (
                                                            <div className="flex flex-col items-center justify-center leading-none gap-0.5">
                                                                {percentage >= 100 && !shouldRemoveBackground && (
                                                                    <Check size={9} className="absolute top-0.5 right-0.5 opacity-50 text-white" strokeWidth={3} />
                                                                )}
                                                                {isCompactMode ? (
                                                                    // Compact: Show Allocated/Capacity with smaller font
                                                                    <span className="text-[10px] tracking-tighter">
                                                                        {Number.isInteger(ptAllocated) ? ptAllocated : ptAllocated.toFixed(1)}/{Number.isInteger(ptCapacity) ? ptCapacity : ptCapacity.toFixed(1)}
                                                                    </span>
                                                                ) : (
                                                                    // Comfortable: Show Allocated / Capacity without PT
                                                                    <span className="text-[11px]">
                                                                        {Number.isInteger(ptAllocated) ? ptAllocated : ptAllocated.toFixed(1)} / {Number.isInteger(ptCapacity) ? ptCapacity : ptCapacity.toFixed(1)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="opacity-0 group-hover/cell:opacity-100 text-slate-400 text-[10px] scale-150 font-light">+</span>
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