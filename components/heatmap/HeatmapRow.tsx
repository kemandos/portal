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
  isPortraitTablet?: boolean;
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
  density,
  isPortraitTablet = false
}) => {
  const isCompact = density === 'compact';
  const rowMinHeight = isCompact 
    ? 'min-h-[40px] 3xl:min-h-[48px]' 
    : (isPortraitTablet 
        ? 'min-h-[48px]' 
        : 'min-h-[68px] 3xl:min-h-[80px] 4xl:min-h-[96px]');
        
  const cellHeight = isCompact 
    ? 'h-[32px] 3xl:h-[36px]' 
    : (isPortraitTablet 
        ? 'h-[40px]' 
        : 'h-[48px] 3xl:h-[56px] 4xl:h-[64px]');

  const paddingClass = isCompact || isPortraitTablet 
    ? 'px-2 py-1.5 3xl:px-3 3xl:py-2' 
    : 'px-4 py-2 3xl:px-6 3xl:py-3';
  
  const stickyLeftClass = viewMode === 'Projects' 
    ? 'left-0' 
    : (isCompact || isPortraitTablet ? 'left-[40px] 3xl:left-[48px]' : 'left-[48px] 3xl:left-[56px]');

  // Header Height Offset for Sticky Group Headers
  const topOffsetClass = isCompact || isPortraitTablet 
      ? 'top-[41px] 3xl:top-[53px]' 
      : 'top-[45px] 3xl:top-[57px]';

  // Only disable in Projects view when months are selected
  const isCheckboxDisabled = viewMode === 'Projects' && selectedMonthIndices.length > 0;

  const handleDisabledHover = (e: React.MouseEvent, message: string) => {
      if (actions.setTooltipState) {
          const rect = e.currentTarget.getBoundingClientRect();
          actions.setTooltipState({
              content: message,
              position: { x: rect.left + rect.width / 2, y: rect.bottom }
          });
      }
  };

  const handleDisabledLeave = () => {
      if (actions.setTooltipState) actions.setTooltipState(null);
  };

  const LiquidCheckbox = ({ checked, onChange }: { checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div 
        className={`relative inline-flex items-center justify-center ${isCompact || isPortraitTablet ? 'size-4' : 'size-5 3xl:size-6'} group ${isCheckboxDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        onMouseEnter={(e) => isCheckboxDisabled && handleDisabledHover(e, "Clear month selection first")}
        onMouseLeave={handleDisabledLeave}
        onClick={(e) => {
            if (isCheckboxDisabled) {
                e.stopPropagation();
            }
        }}
    >
        <input 
            type="checkbox" 
            checked={checked} 
            onChange={(e) => {
                if (!isCheckboxDisabled) {
                    onChange(e);
                }
            }}
            disabled={isCheckboxDisabled}
            className={`peer appearance-none ${isCompact || isPortraitTablet ? 'size-4' : 'size-5 3xl:size-6'} rounded-full border border-gray-300 bg-white/60 backdrop-blur-sm transition-all duration-300 ease-spring checked:bg-primary checked:border-primary checked:scale-110 ${isCheckboxDisabled ? '' : 'cursor-pointer hover:scale-110 active:scale-90'}`}
        />
        <Check 
            size={isCompact || isPortraitTablet ? 10 : 12} 
            className="absolute text-white opacity-0 peer-checked:opacity-100 transition-all duration-200 pointer-events-none stroke-[3] 3xl:w-4 3xl:h-4" 
        />
    </div>
  );

  // --- ACTION ROW ---
  if (row.type === 'action') {
    const isPeopleViewAction = viewMode === 'People';
    const label = isPeopleViewAction ? 'Add Assignment' : 'Add Employee';
    
    return (
        <tr className={`${rowMinHeight} group`}>
            {viewMode === 'People' && (
                <td className={`sticky left-0 z-20 bg-white ${paddingClass} border-r border-slate-200/50`}>
                     <div className="w-full h-full flex items-center justify-center">
                         <div className="w-5 h-5 rounded border border-gray-300 3xl:w-6 3xl:h-6"></div>
                     </div>
                </td>
            )}
            <td 
                className={`sticky ${stickyLeftClass} z-20 bg-white shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] ${paddingClass} border-r border-slate-200 cursor-pointer relative ring-2 ring-blue-400/0 z-30`}
            >
                <div className="flex items-center h-full">
                    <div style={{ width: row.depth * 24 }} className="shrink-0" />
                    <button 
                        type="button"
                        className="flex items-center gap-3 text-sm 3xl:text-base font-semibold text-slate-600 hover:text-primary transition-colors group w-full px-2 py-1 rounded-lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onAddChild && row.parentId) onAddChild(row.parentId);
                        }}
                    >
                        <div className="flex items-center justify-center size-8 rounded-full border border-slate-300 bg-white group-hover:border-primary group-hover:bg-primary/5 transition-all shadow-sm 3xl:size-10">
                            <Plus size={16} className="3xl:w-5 3xl:h-5" />
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
  
  // Use bg-white for opaque sticky header
  // Removed z-25 (invalid) and replaced with z-30 to match checkbox
  const groupHeaderClass = `sticky ${stickyLeftClass} ${topOffsetClass} z-30 bg-white shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] ${paddingClass} cursor-pointer align-middle border-t border-b border-slate-200`;
  
  const resourceInfoClass = `sticky ${stickyLeftClass} z-20 ${isSelectedRow ? 'bg-rose-50' : 'bg-white'} shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] ${paddingClass} transition-colors cursor-pointer align-middle border-r border-slate-200`;

  // Zebra striping and hover logic
  const rowBackgroundClass = row.isGroupHeader 
    ? 'bg-white' 
    : rowIndex % 2 === 0 
        ? 'bg-white/40 hover:bg-white/90' 
        : 'bg-slate-50/40 hover:bg-white/90';

  return (
    <tr className={`${rowMinHeight} group transition-all duration-300 ${rowBackgroundClass}`}>
        {/* Checkbox - Sticky horizontally (left-0). For Group Headers, also sticky vertically (top). */}
        {viewMode === 'People' && (
            <td className={`sticky left-0 ${row.isGroupHeader ? `${topOffsetClass} z-30 border-t border-b border-slate-200` : 'z-20'} ${isSelectedRow ? 'bg-rose-50' : 'bg-white'} ${paddingClass} text-center transition-colors align-middle border-r border-slate-200/50`}>
                {!row.isGroupHeader && isRowSelectable && (
                    <LiquidCheckbox 
                        checked={selectedIds.includes(resource.id)}
                        onChange={(e) => {
                            onSelectionChange(e.target.checked ? [...selectedIds, resource.id] : selectedIds.filter(id => id !== resource.id));
                        }}
                    />
                )}
            </td>
        )}
        
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
            colSpan={undefined} // Do not colspan to ensure sticky left behavior works reliably
            className={row.isGroupHeader ? groupHeaderClass : resourceInfoClass}
            setTooltipState={actions.setTooltipState}
        />

        {/* Data Cells OR Empty Header Cells */}
        {row.isGroupHeader ? (
             // Render empty sticky-top cells for the rest of the row to maintain background/borders
             // Added border-l to maintain the vertical grid lines
             visibleMonths.map(month => (
                 <td 
                    key={month} 
                    className={`sticky ${topOffsetClass} z-10 bg-white border-t border-b border-l border-slate-200`}
                 />
             ))
        ) : (
            visibleMonths.map((month, monthIndex) => {
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
            })
        )}
    </tr>
  );
};