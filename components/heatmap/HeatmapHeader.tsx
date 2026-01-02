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
  density
}) => {
  const isCompact = density === 'compact';

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

  return (
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
                    (bounds && index >= bounds.minCol && index <= bounds.maxCol && bounds.minRow === 0 && bounds.maxRow === flattenedRowsLength - 1) ||
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
  );
};