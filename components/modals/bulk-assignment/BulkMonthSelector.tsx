import React from 'react';
import { Calendar, X, Plus } from 'lucide-react';

interface BulkMonthSelectorProps {
  activeMonths: string[];
  availableMonths: string[];
  isMonthPickerOpen: boolean;
  setIsMonthPickerOpen: (isOpen: boolean) => void;
  removeMonth: (month: string) => void;
  addMonth: (month: string) => void;
  monthPickerRef: React.RefObject<HTMLDivElement | null>;
}

export const BulkMonthSelector: React.FC<BulkMonthSelectorProps> = ({
  activeMonths,
  availableMonths,
  isMonthPickerOpen,
  setIsMonthPickerOpen,
  removeMonth,
  addMonth,
  monthPickerRef
}) => {
  return (
    <div>
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 block">Select Months</label>
        <div className="flex flex-wrap items-center gap-3">
            {activeMonths.map(month => (
                <button 
                    key={month}
                    onClick={() => removeMonth(month)}
                    className="px-4 py-2 rounded-lg text-xs font-bold shadow-sm border border-primary bg-white/80 dark:bg-primary/10 text-primary ring-1 ring-primary/20 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 hover:ring-red-100 transition-all flex items-center gap-2 group backdrop-blur-sm active:scale-95"
                >
                    <Calendar size={14} />
                    {month}
                    <X size={12} className="opacity-50 group-hover:opacity-100" />
                </button>
            ))}
            
            <div className="relative" ref={monthPickerRef}>
                <button 
                    onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                    className={`h-9 px-3 rounded-lg border border-dashed flex items-center gap-2 transition-colors text-xs font-medium ${isMonthPickerOpen ? 'border-primary text-primary bg-primary/5' : 'border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500 hover:text-primary hover:border-primary'}`}
                >
                    <Plus size={16} /> Add Month
                </button>
                
                {isMonthPickerOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white/90 dark:bg-[#1e1e20]/95 backdrop-blur-xl rounded-xl shadow-glass dark:shadow-none border border-white/50 dark:border-white/10 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {availableMonths.length > 0 ? availableMonths.map(month => (
                                <button
                                    key={month}
                                    onClick={() => addMonth(month)}
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-white/10 transition-colors flex items-center justify-between group"
                                >
                                    {month}
                                    <Plus size={12} className="text-slate-400 group-hover:text-primary transition-colors" />
                                </button>
                            )) : (
                                <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                                    All months selected
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};