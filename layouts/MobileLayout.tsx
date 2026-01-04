import React, { useState, useEffect, useRef } from 'react';
import { ViewState, ThemeSettings, Filter, Resource, SelectionRange } from '../types';
import { MobileListView } from '../components/MobileListView';
import { Users, X, Filter as FilterIcon, ChevronDown, Check, ChevronRight, Briefcase, ChevronUp, Layers, Plus, RefreshCw } from 'lucide-react';
import { MOCK_PEOPLE, MOCK_PROJECTS } from '../constants';

interface LayoutProps {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  currentData: Resource[];
  handleSelectionChange: (ids: string[]) => void;
  handleItemClick: (id: string) => void;
  onOpenSettings: () => void;
  themeSettings?: ThemeSettings;
  groupBy: string;
  setGroupBy: (val: string) => void;
  activeFilters: Filter[];
  onAddFilter: (filter?: Filter) => void;
  onRemoveFilter: (index: number) => void;
  density: 'comfortable' | 'compact';
  setDensity: (density: 'comfortable' | 'compact') => void;
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

export const MobileLayout: React.FC<LayoutProps> = ({ 
    viewState, setViewState, currentData, handleSelectionChange, handleItemClick, themeSettings,
    activeFilters, onAddFilter, onRemoveFilter, onCellClick, 
    selectedMonthIndices, onAddChild, groupBy, setGroupBy,
    expandedRows, setExpandedRows
}) => {
  
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState<string | null>(null);
  const [isSelectionMode] = useState(true);
  
  // Pull to Refresh State
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Enforce 3M view on mobile mount
  useEffect(() => {
    setViewState(prev => {
        if (prev.timeRange !== '3M') {
            return { ...prev, timeRange: '3M' };
        }
        return prev;
    });
  }, [setViewState]);

  const handleTouchStart = (e: React.TouchEvent) => {
      if (containerRef.current?.scrollTop === 0) {
          touchStartY.current = e.touches[0].clientY;
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (touchStartY.current > 0 && !isRefreshing) {
          const deltaY = e.touches[0].clientY - touchStartY.current;
          if (deltaY > 0) {
              setPullY(deltaY * 0.5); // Resistance
          }
      }
  };

  const handleTouchEnd = () => {
      if (pullY > 60) {
          setIsRefreshing(true);
          setPullY(60); // Snap to refresh
          setTimeout(() => {
              setIsRefreshing(false);
              setPullY(0);
              touchStartY.current = 0;
          }, 1500);
      } else {
          setPullY(0);
          touchStartY.current = 0;
      }
  };

  // --- Dynamic Filter Logic ---
  const filterCategories = viewState.mode === 'People' 
    ? ['Managing Consultant', 'Department', 'Employee', 'Skill', 'Status']
    : ['Project Lead', 'Managing Consultant', 'Dealfolder', 'Deal', 'Employee', 'Status'];
    
  const groupOptions = viewState.mode === 'People' 
    ? ['None', 'Department', 'Managing Consultant'] 
    : ['None', 'Dealfolder'];

  const getOptionsForCategory = (category: string) => {
      const rawData = viewState.mode === 'Projects' ? MOCK_PROJECTS : MOCK_PEOPLE;
      const values = new Set<string>();

      if (viewState.mode === 'Projects') {
        rawData.forEach(folder => {
            if (category === 'Dealfolder') values.add(folder.name);
            folder.children?.forEach(project => {
                if (category === 'Deal') values.add(project.name);
                if (category === 'Project Lead' && project.manager) values.add(project.manager);
                if (category === 'Status') values.add(project.status || 'Active');
                project.children?.forEach(empAssignment => {
                     if (category === 'Employee') values.add(empAssignment.name);
                     if (category === 'Managing Consultant' && empAssignment.manager) values.add(empAssignment.manager);
                });
            });
        });
      } else {
        const allEmployees = rawData.flatMap(g => g.children || []);
        allEmployees.forEach(emp => {
            if (category === 'Employee') values.add(emp.name);
            if (category === 'Managing Consultant' && emp.manager) values.add(emp.manager);
            if (category === 'Department' && emp.department) values.add(emp.department);
            if (category === 'Skill' && emp.skills) emp.skills.forEach(s => values.add(s));
            if (category === 'Status') values.add(emp.status || 'Active');
        });
      }
      return Array.from(values).sort();
  };

  const handleFilterToggle = (category: string, value: string) => {
      const existingFilter = activeFilters.find(f => f.key === category);
      let newValues: string[] = [];

      if (existingFilter) {
          if (existingFilter.values.includes(value)) {
              newValues = existingFilter.values.filter(v => v !== value);
          } else {
              newValues = [...existingFilter.values, value];
          }
      } else {
          newValues = [value];
      }

      if (newValues.length === 0) {
          const idx = activeFilters.findIndex(f => f.key === category);
          if (idx !== -1) onRemoveFilter(idx);
      } else {
          onAddFilter({ key: category, values: newValues });
      }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F9FAFB] text-slate-900 font-sans w-full overflow-hidden">
      
      {/* Header */}
      <header className="flex-none sticky top-0 z-50 transition-all duration-300">
         <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]" />
         
         <div className="relative z-10">
             {/* Row 1: Toggles */}
             <div className="px-5 pt-6 pb-3">
                 <div className="flex gap-4 p-2 rounded-[24px] bg-slate-200/40 border border-white/60 shadow-inner backdrop-blur-xl">
                     <button 
                        onClick={() => setViewState(v => ({...v, mode: 'People'}))}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all duration-300 relative overflow-hidden group ${viewState.mode === 'People' ? 'bg-white text-slate-900 shadow-lg shadow-black/5 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'}`}
                     >
                         <span className="relative z-10 flex items-center gap-2">
                             <Users size={18} className={viewState.mode === 'People' ? 'text-primary' : 'text-slate-400'} /> 
                             People
                         </span>
                     </button>
                     <button 
                        onClick={() => setViewState(v => ({...v, mode: 'Projects'}))}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all duration-300 relative overflow-hidden group ${viewState.mode === 'Projects' ? 'bg-white text-slate-900 shadow-lg shadow-black/5 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'}`}
                     >
                         <span className="relative z-10 flex items-center gap-2">
                             <Briefcase size={18} className={viewState.mode === 'Projects' ? 'text-primary' : 'text-slate-400'} /> 
                             Projects
                         </span>
                     </button>
                 </div>
             </div>

             {/* Row 2: Filter Button */}
             <div className="px-5 pb-5">
                 <button 
                    onClick={() => setIsFilterSheetOpen(!isFilterSheetOpen)}
                    className={`
                        w-full flex items-center justify-between px-5 py-3.5 rounded-[20px] border text-sm font-bold transition-all active:scale-[0.98] backdrop-blur-md shadow-sm
                        ${activeFilters.length > 0 || isFilterSheetOpen ? 'bg-white border-primary/30 ring-2 ring-primary/10 text-slate-900 shadow-primary/5' : 'bg-white/50 border-white/60 hover:bg-white/80 text-slate-500'}
                    `}
                 >
                     <div className="flex items-center gap-3">
                         <div className={`p-1.5 rounded-lg ${activeFilters.length > 0 ? 'bg-primary/10 text-primary' : 'bg-slate-200/50 text-slate-400'}`}>
                             <FilterIcon size={16} />
                         </div>
                         <span>Filter & Group</span>
                     </div>
                     <div className="flex items-center gap-3">
                         {activeFilters.length > 0 && (
                             <span className="bg-primary text-white text-[10px] px-2.5 py-1 rounded-full shadow-lg shadow-primary/20 font-bold">
                                 {activeFilters.length} Active
                             </span>
                         )}
                         {isFilterSheetOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                     </div>
                 </button>
             </div>

             {/* Row 3: Active Filters */}
             {activeFilters.length > 0 && !isFilterSheetOpen && (
                 <div className="flex gap-2 overflow-x-auto px-5 pb-5 hide-scrollbar">
                     {activeFilters.map((filter, idx) => (
                         <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white/70 border border-white/60 shadow-sm backdrop-blur-md rounded-lg whitespace-nowrap min-w-fit">
                             <span className="text-xs font-bold text-slate-600">{filter.key}:</span>
                             <span className="text-xs font-bold text-[#ee3a5e]">{filter.values[0]}{filter.values.length > 1 ? ` +${filter.values.length - 1}` : ''}</span>
                             <button 
                                onClick={(e) => { e.stopPropagation(); onRemoveFilter(idx); }}
                                className="ml-1 p-0.5 rounded-full hover:bg-slate-200 text-slate-400"
                             >
                                 <X size={12} />
                             </button>
                         </div>
                     ))}
                 </div>
             )}
         </div>

         {/* Dropdown Filter Menu */}
         {isFilterSheetOpen && (
            <div className="absolute top-full left-0 right-0 bg-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border-t border-gray-100 z-[60] animate-in slide-in-from-top-5 duration-200 max-h-[70vh] flex flex-col">
                 <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                    <div className="mb-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-slate-50/50">
                            <Layers size={14} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Group By</span>
                        </div>
                        <div className="p-2 flex flex-col gap-1">
                            {groupOptions.map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => setGroupBy(opt)}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${groupBy === opt ? 'bg-[#ee3a5e]/5 text-[#ee3a5e] font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {opt}
                                    {groupBy === opt && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* ... Filter Logic ... */}
                    {filterCategories.map(category => {
                        const isOpen = activeFilterCategory === category;
                        const activeCount = activeFilters.find(f => f.key === category)?.values.length || 0;
                        return (
                            <div key={category} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all mb-3 last:mb-0">
                                <button 
                                    onClick={() => setActiveFilterCategory(isOpen ? null : category)}
                                    className="w-full flex items-center justify-between p-4 text-left active:bg-slate-50"
                                >
                                    <span className="text-sm font-bold text-slate-700">{category}</span>
                                    <div className="flex items-center gap-3">
                                        {activeCount > 0 && (
                                            <span className="bg-[#ee3a5e] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {activeCount}
                                            </span>
                                        )}
                                        {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                    </div>
                                </button>
                                {isOpen && (
                                    <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2">
                                        <div className="h-px bg-slate-50 mb-3" />
                                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                                            {getOptionsForCategory(category).map(option => {
                                                const isSelected = activeFilters.find(f => f.key === category)?.values.includes(option);
                                                return (
                                                    <label key={option} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                                                        <div className={`size-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#ee3a5e] border-[#ee3a5e]' : 'bg-white border-slate-300'}`}>
                                                            {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                        </div>
                                                        <span className={`text-sm ${isSelected ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{option}</span>
                                                        <input 
                                                            type="checkbox" 
                                                            className="hidden"
                                                            checked={isSelected || false}
                                                            onChange={() => handleFilterToggle(category, option)}
                                                        />
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                 </div>
                 <div className="p-4 bg-white border-t border-gray-100 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button 
                        onClick={() => {
                            activeFilters.forEach((_, i) => onRemoveFilter(0));
                            setGroupBy('None');
                        }}
                        className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Reset
                    </button>
                    <button 
                        onClick={() => setIsFilterSheetOpen(false)}
                        className="flex-[2] py-3 text-sm font-bold text-white bg-[#ee3a5e] hover:bg-[#d63453] rounded-xl shadow-lg shadow-rose-200 transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
         )}
      </header>
      
      {/* Backdrop */}
      {isFilterSheetOpen && (
          <div 
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsFilterSheetOpen(false)}
          />
      )}

      {/* Main Content Area */}
      <main 
        ref={containerRef}
        className="flex-1 overflow-y-auto relative flex flex-col w-full bg-[#F9FAFB] overscroll-contain"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
         
         {/* Pull Refresh Indicator */}
         <div 
            className="w-full flex justify-center overflow-hidden transition-all duration-300" 
            style={{ height: pullY, opacity: Math.min(1, pullY / 40) }}
         >
             <div className="flex items-center justify-center size-8 rounded-full bg-white shadow-md border border-gray-100 mt-2">
                 <RefreshCw size={16} className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 2}deg)` }} />
             </div>
         </div>

         <MobileListView 
            data={currentData}
            viewMode={viewState.mode}
            timeRange={viewState.timeRange}
            selectedIds={viewState.selectedIds}
            onSelectionChange={handleSelectionChange}
            onItemClick={handleItemClick}
            onCellClick={onCellClick}
            onAddChild={onAddChild}
            themeSettings={themeSettings}
            className="hide-scrollbar"
            isSelectionMode={isSelectionMode}
            selectedMonthIndices={selectedMonthIndices}
            groupBy={groupBy}
            expandedRows={expandedRows}
            setExpandedRows={setExpandedRows}
         />
      </main>

      {/* FAB - Floating Action Button */}
      <button 
        onClick={() => onAddChild && onAddChild('')}
        className="fixed bottom-6 right-6 size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-40 active:scale-95 transition-transform hover:scale-105"
      >
          <Plus size={28} strokeWidth={2.5} />
      </button>

    </div>
  );
};