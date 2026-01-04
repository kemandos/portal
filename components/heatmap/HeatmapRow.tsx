import React from 'react';
import { Resource } from '../../types';
import { HeatmapResourceInfo } from './HeatmapResourceInfo';
import { HeatmapCell } from './HeatmapCell';
import { RowItem } from '../../hooks/useHeatmapLogic';
import { Plus, Check } from 'lucide-react';

interface HeatmapRowProps {
  row: RowItem;
  rowIndex: number;
  viewMode: 'People' | 'Projects';
  selectedIds: string[];
  visibleMonths: string[];
  bounds: any;
  selectedMonthIndices: number[];
  editingCell: {resourceId: string, month: string, value: string} | null;
  expandedRows: Record<string, boolean>;
  themeSettings: any;
  onSelectionChange: (ids: string[]) => void;
  onAddChild?: (resourceId: string) => void;
  onItemClick: (id: string) => void;
  setExpandedRows: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  actions: any; 
  density: 'comfortable' | 'compact';
}

export const HeatmapRow: React.FC<HeatmapRowProps> = ({
  row,
  rowIndex,
  viewMode,
  selectedIds,
  visibleMonths,
  bounds,
  selectedMonthIndices,
  editingCell,
  expandedRows,
  themeSettings,
  onSelectionChange,
  onAddChild,
  onItemClick,
  setExpandedRows,
  actions,
  density
}) => {
  const isCompact = density === 'compact';
  const rowMinHeight = isCompact ? 'min-h-[40px]' : 'min-h-[68px]';
  const cellHeight = isCompact ? 'h-[32px]' : 'h-[48px]';
  const paddingClass = isCompact ? 'px-2 py-1.5' : 'px-4 py-2';

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

  // --- ACTION ROW ---
  if (row.type === 'action') {
    const isPeopleViewAction = viewMode === 'People';
    const label = isPeopleViewAction ? 'Add Assignment' : 'Add Employee';
    
    return (
        <tr className={`${rowMinHeight} group`}>
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

  // --- RESOURCE ROW ---
  const resource = row.resource!;
  const isRowSelectable = viewMode === 'People' 
    ? resource.type === 'employee' 
    : resource.type === 'project';

  const isRowInRange = bounds && rowIndex >= bounds.minRow && rowIndex <= bounds.maxRow;
  const isSelectedRow = selectedIds.includes(resource.id) || isRowInRange;

  const isProjectRoot = viewMode === 'Projects' && row.depth === 0 && resource.type === 'project';
  const isProjectChild = viewMode === 'Projects' && !isProjectRoot;

  const handleResourceClick = (e: React.MouseEvent, resource: Resource) => {
      e.stopPropagation();
      // If forced expand (People View Employees), do not allow collapse
      if (viewMode === 'People' && resource.type === 'employee') {
          onItemClick(resource.id); 
          return;
      }

      const canExpand = (resource.children && resource.children.length > 0) || 
                        (viewMode === 'Projects' && resource.type === 'project');

      if (canExpand) {
          setExpandedRows(prev => ({ ...prev, [resource.id]: !prev[resource.id] }));
      } else {
          onItemClick(resource.id);
      }
  };
  
  const groupHeaderClass = "sticky left-[48px] z-20 bg-[#ebe9e4] bg-opacity-60 backdrop-blur-md px-4 py-3 cursor-pointer align-middle border-t border-b border-white/50";
  
  // Zebra striping and hover logic
  const rowBackgroundClass = row.isGroupHeader 
    ? '' 
    : rowIndex % 2 === 0 
        ? 'bg-white/40 hover:bg-white/90' 
        : 'bg-slate-50/40 hover:bg-white/90';

  return (
    <tr className={`${rowMinHeight} group transition-all duration-300 ${rowBackgroundClass}`}>
        {/* Checkbox */}
        <td className={`sticky left-0 z-20 ${isSelectedRow ? 'bg-primary/5' : (selectedIds.includes(resource.id) ? 'bg-primary/5' : 'bg-white/20')} backdrop-blur-md ${paddingClass} text-center transition-colors align-middle border-r border-slate-200/50`}>
            {!row.isGroupHeader && isRowSelectable && (
                <LiquidCheckbox 
                    checked={selectedIds.includes(resource.id)}
                    onChange={(e) => {
                        onSelectionChange(e.target.checked ? [...selectedIds, resource.id] : selectedIds.filter(id => id !== resource.id));
                    }}
                />
            )}
        </td>
        
        {/* Resource Info Column */}
        <HeatmapResourceInfo 
            resource={resource}
            depth={row.depth}
            viewMode={viewMode}
            isExpanded={expandedRows[resource.id] ?? resource.isExpanded}
            selectedIds={selectedIds}
            paddingClass={paddingClass}
            isCompact={isCompact}
            handleResourceClick={handleResourceClick}
            visibleMonths={visibleMonths}
            themeSettings={themeSettings}
            colSpan={row.isGroupHeader ? visibleMonths.length + 1 : undefined}
            className={row.isGroupHeader ? groupHeaderClass : undefined}
        />

        {/* Data Cells (Only render if not a group header) */}
        {!row.isGroupHeader && visibleMonths.map((month, monthIndex) => {
            const isRangeSelected = bounds && 
                            rowIndex >= bounds.minRow && rowIndex <= bounds.maxRow && 
                            monthIndex >= bounds.minCol && monthIndex <= bounds.maxCol;
            const isColSelected = selectedMonthIndices.includes(monthIndex);
            const isSelected = isRangeSelected || isColSelected;
            
            const isEditing = editingCell?.resourceId === resource.id && editingCell?.month === month;

            return (
                <HeatmapCell 
                    key={month}
                    resource={resource}
                    month={month}
                    monthIndex={monthIndex}
                    rowIndex={rowIndex}
                    viewMode={viewMode}
                    themeSettings={themeSettings}
                    isSelected={isSelected}
                    isEditing={isEditing}
                    editingValue={editingCell?.value || ''}
                    cellHeight={cellHeight}
                    isCompactMode={isCompact}
                    isProjectChild={isProjectChild}
                    isProjectRoot={isProjectRoot}
                    onMouseDown={() => actions.handleMouseDown(resource.id, monthIndex, rowIndex)}
                    onMouseEnter={() => actions.handleMouseEnter(resource.id, monthIndex, rowIndex)}
                    onMouseLeave={() => {}} 
                    onMouseUp={(val) => actions.handleMouseUp(resource.id, monthIndex, val, isProjectRoot)}
                    setEditingCell={actions.setEditingCell}
                    onInlineBlur={actions.handleInlineInputBlur}
                    setTooltipState={actions.setTooltipState}
                />
            );
        })}
    </tr>
  );
};