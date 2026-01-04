import React from 'react';
import { Check } from 'lucide-react';

interface HeatmapHeaderProps {
  visibleMonths: string[];
  allSelectableIds: string[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  viewMode: 'People' | 'Projects';
  headerPaddingClass: string;
  selectedMonthIndices: number[];
  bounds: any;
  flattenedRowsLength: number;
  handleHeaderMouseDown: (e: React.MouseEvent, index: number) => void;
  handleHeaderMouseEnter: (index: number) => void;
  handleMonthHeaderClick: (e: React.MouseEvent, index: number) => void;
  density: 'comfortable' | 'compact';
  isPortraitTablet?: boolean;
  setTooltipState?: (state: any) => void;
}

export const HeatmapHeader: React.FC<HeatmapHeaderProps> = ({
  visibleMonths,
  allSelectableIds,
  selectedIds,
  onSelectionChange,
  viewMode,
  headerPaddingClass,
  selectedMonthIndices,
  bounds,
  flattenedRowsLength,
  handleHeaderMouseDown,
  handleHeaderMouseEnter,
  handleMonthHeaderClick,
  density,
  isPortraitTablet = false,
  setTooltipState
}) => {
  const isCompact = density === 'compact';
  const stickyLeftClass = viewMode === 'Projects' 
    ? 'left-0' 
    : (isCompact || isPortraitTablet ? 'left-[40px] 3xl:left-[48px]' : 'left-[48px] 3xl:left-[56px]');

  // Only disable in Projects view when projects are selected
  const isMonthHeaderDisabled = viewMode === 'Projects' && selectedIds.length > 0;
  // Also disable "Select All Rows" if months are selected in Projects view
  const isSelectAllDisabled = viewMode === 'Projects' && selectedMonthIndices.length > 0;

  const handleDisabledHover = (e: React.MouseEvent, message: string) => {
      if (setTooltipState) {
          const rect = e.currentTarget.getBoundingClientRect();
          setTooltipState({
              content: message,
              position: { x: rect.left + rect.width / 2, y: rect.bottom }
          });
      }
  };

  const handleDisabledLeave = () => {
      if (setTooltipState) setTooltipState(null);
  };

  const LiquidCheckbox = ({ checked, onChange, disabled }: { checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean }) => (
    <div 
        className={`relative inline-flex items-center justify-center ${isCompact || isPortraitTablet ? 'size-4' : 'size-5 3xl:size-6'} group ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        onMouseEnter={(e) => disabled && handleDisabledHover(e, "Clear month selection first")}
        onMouseLeave={handleDisabledLeave}
    >
        <input 
            type="checkbox" 
            checked={checked} 
            onChange={onChange}
            disabled={disabled}
            className={`peer appearance-none ${isCompact || isPortraitTablet ? 'size-4' : 'size-5 3xl:size-6'} rounded-full border border-gray-300 bg-white/60 backdrop-blur-sm transition-all duration-300 ease-spring checked:bg-primary checked:border-primary checked:scale-110 ${disabled ? '' : 'cursor-pointer hover:scale-110 active:scale-90'}`}
        />
        <Check 
            size={isCompact || isPortraitTablet ? 10 : 12} 
            className="absolute text-white opacity-0 peer-checked:opacity-100 transition-all duration-200 pointer-events-none stroke-[3] 3xl:w-4 3xl:h-4" 
        />
    </div>
  );

  return (
    <thead className="sticky top-0 z-30 bg-white">
        <tr className="border-b border-slate-200">
            {viewMode === 'People' && (
                <th className={`sticky left-0 z-40 bg-white ${headerPaddingClass} text-center border-r border-slate-200/50`}>
                    <LiquidCheckbox 
                        checked={allSelectableIds.length > 0 && allSelectableIds.every(id => selectedIds.includes(id))}
                        onChange={(e) => onSelectionChange(e.target.checked ? allSelectableIds : [])}
                        disabled={isSelectAllDisabled}
                    />
                </th>
            )}
            <th className={`sticky ${stickyLeftClass} z-40 bg-[#FDFBF7] ${headerPaddingClass} text-sm font-bold text-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] align-middle border-r border-slate-200 3xl:text-base`}>
                <div className="flex items-center h-full">
                    {viewMode === 'People' ? 'Employee' : 'Project'}
                </div>
            </th>
            {visibleMonths.map((month, index) => {
                const isColumnSelected = 
                    (bounds && index >= bounds.minCol && index <= bounds.maxCol && bounds.minRow === 0 && bounds.maxRow === flattenedRowsLength - 1) ||
                    selectedMonthIndices.includes(index);
                return (
                    <th 
                        key={month} 
                        className={`
                            ${headerPaddingClass} ${isPortraitTablet ? 'text-[10px]' : 'text-sm'} font-bold text-center uppercase tracking-wider align-middle transition-all duration-300 3xl:text-base
                            border-t-[4px] border-l border-slate-200/50 bg-white
                            ${isMonthHeaderDisabled ? 'opacity-50 cursor-not-allowed border-t-transparent text-slate-400' : 'cursor-pointer hover:bg-slate-50'}
                            ${isColumnSelected && !isMonthHeaderDisabled ? 'border-t-primary bg-primary/5 text-primary' : (isMonthHeaderDisabled ? '' : 'border-t-transparent text-slate-500')}
                        `}
                        onMouseDown={(e) => {
                            if (!isMonthHeaderDisabled) handleHeaderMouseDown(e, index);
                        }}
                        onMouseEnter={(e) => {
                            if (isMonthHeaderDisabled) {
                                handleDisabledHover(e, "Clear project selection first");
                            } else {
                                handleHeaderMouseEnter(index);
                            }
                        }}
                        onMouseLeave={handleDisabledLeave}
                        onClick={(e) => {
                            if (isMonthHeaderDisabled) {
                                e.stopPropagation();
                                return;
                            }
                            handleMonthHeaderClick(e, index);
                        }}
                    >
                        <div className={`transition-transform duration-300 ease-spring ${isColumnSelected && !isMonthHeaderDisabled ? 'scale-110' : (!isMonthHeaderDisabled ? 'hover:scale-105' : '')}`}>
                            {month}
                        </div>
                    </th>
                );
            })}
        </tr>
    </thead>
  );
};