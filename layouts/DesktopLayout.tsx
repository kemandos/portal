import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ViewState, ThemeSettings, Filter, Resource, SelectionRange } from '../types';
import { Heatmap } from '../components/Heatmap';
import { Header } from '../components/Header';
import { X, Plus, Layers, ChevronDown, Check, ChevronRight, Search, BarChart3 } from 'lucide-react';
import { MONTHS, MOCK_PEOPLE, MOCK_PROJECTS } from '../constants';

interface LayoutProps {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  currentData: Resource[];
  handleSelectionChange: (ids: string[]) => void;
  handleItemClick: (id: string, intent?: 'budget' | 'assignments') => void;
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
  onCellClick: (resourceId: string, month: string, specificMonths?: string[], intent?: 'budget' | 'assignments') => void;
  expandedRows: Record<string, boolean>;
  setExpandedRows: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedMonthIndices?: number[];
  onMonthSelectionChange?: (indices: number[]) => void;
  onAddChild?: (resourceId: string) => void;
  onInlineSave?: (resourceId: string, month: string, value: number, isCapacity: boolean) => void;
}

export const DesktopLayout: React.FC<LayoutProps> = ({ 
    viewState, setViewState, currentData, handleSelectionChange, handleItemClick, onOpenSettings, themeSettings,
    groupBy, setGroupBy, activeFilters, onAddFilter, onRemoveFilter, density, setDensity,
    selectionRange, onSelectionRangeChange, onCellClick, expandedRows, setExpandedRows,
    selectedMonthIndices, onMonthSelectionChange, onAddChild, onInlineSave
}) => {
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
            setIsFilterMenuOpen(false);
            setActiveFilterCategory(null);
            setSearchQuery('');
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeFilterCategory && searchInputRef.current) {
        searchInputRef.current.focus();
        setSearchQuery('');
    }
  }, [activeFilterCategory]);

  const groupOptions = viewState.mode === 'People' 
    ? ['None', 'Department', 'Managing Consultant'] 
    : ['None', 'Dealfolder', 'Project Lead'];

  const filterCategories = viewState.mode === 'People' 
    ? ['Capacity', 'Managing Consultant', 'Department', 'Employee', 'Skill']
    : ['Capacity', 'Project Lead', 'Managing Consultant', 'Dealfolder', 'Deal', 'Employee', 'Status'];

  const getOptionsForCategory = (category: string) => {
      // Special Handling for Capacity Filter
      if (category === 'Capacity') {
          return ['Available', 'Warning', 'Overbooked'];
      }

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

  const handleFilterValueToggle = (category: string, value: string) => {
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
    <div className="flex flex-col h-screen bg-transparent text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/20">
      <Header 
        viewState={viewState} 
        setViewState={setViewState} 
        onOpenSettings={onOpenSettings}
        isDesktop={true}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex-1 flex flex-col px-6 pt-2 pb-6 max-w-[1920px] 3xl:max-w-none w-full mx-auto overflow-hidden">
            
            {/* Filter Bar */}
            <div className="flex-none flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-2 drop-shadow-sm 3xl:text-base">Filters:</span>
                    
                    {activeFilters.map((filter, idx) => (
                         <div key={idx} className="flex items-center gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-xl border border-white/60 dark:border-white/5 rounded-full px-3 py-1 text-xs font-medium shadow-sm animate-in fade-in zoom-in duration-300 hover:shadow-glow transition-shadow 3xl:text-sm 3xl:px-4 3xl:py-1.5">
                            <span className="text-slate-500 dark:text-slate-400">{filter.key}:</span>
                            <span className="text-slate-900 dark:text-white font-bold">{filter.values.join(', ')}</span>
                            <button 
                                onClick={() => onRemoveFilter(idx)}
                                className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors ml-1 active:scale-90"
                            >
                                <X size={14} className="3xl:w-4 3xl:h-4" />
                            </button>
                        </div>
                    ))}

                    <div className="relative" ref={filterMenuRef}>
                        <button 
                            onClick={() => {
                                setIsFilterMenuOpen(!isFilterMenuOpen);
                                setActiveFilterCategory(null);
                            }}
                            className={`
                                text-xs font-bold px-3 py-1 rounded-full border border-dashed flex items-center gap-1 transition-all duration-300
                                hover:scale-105 active:scale-95 3xl:text-sm 3xl:px-4 3xl:py-1.5
                                ${isFilterMenuOpen 
                                    ? 'bg-white dark:bg-slate-800 text-primary border-primary shadow-glow' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-white/40 dark:hover:bg-white/10 border-slate-300 dark:border-slate-600'
                                }
                            `}
                        >
                            <Plus size={14} className="3xl:w-4 3xl:h-4" /> Add Filter
                        </button>

                        {/* Dropdown Menu */}
                        {isFilterMenuOpen && (
                            <div className="absolute left-0 top-full mt-2 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-white/50 dark:border-white/10 py-1 z-50 min-w-[200px] animate-in fade-in zoom-in-95 duration-200 flex flex-row h-[320px] ring-1 ring-white/80 dark:ring-white/10 3xl:h-[400px] 3xl:min-w-[250px]">
                                <div className="flex flex-col py-1 min-w-[180px] border-r border-gray-100/30 dark:border-gray-800/30 3xl:min-w-[220px]">
                                    {filterCategories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setActiveFilterCategory(category)}
                                            className={`flex items-center justify-between px-4 py-2.5 text-xs font-medium text-left transition-colors 3xl:text-sm 3xl:py-3 ${activeFilterCategory === category ? 'bg-white/60 dark:bg-white/10 text-primary shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {category === 'Capacity' && <BarChart3 size={14} className="text-slate-400 3xl:w-4 3xl:h-4" />}
                                                {category}
                                            </div>
                                            <ChevronRight size={14} className={`text-slate-400 3xl:w-4 3xl:h-4 ${activeFilterCategory === category ? 'text-primary' : ''}`} />
                                        </button>
                                    ))}
                                </div>
                                {activeFilterCategory ? (
                                    <div className="flex flex-col min-w-[240px] bg-transparent rounded-r-xl 3xl:min-w-[300px]">
                                        <div className="p-2 border-b border-gray-100/30 dark:border-gray-800/30">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 3xl:text-xs">
                                                Select {activeFilterCategory}
                                            </div>
                                            {activeFilterCategory !== 'Capacity' && (
                                                <div className="relative group/search">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within/search:text-primary 3xl:w-4 3xl:h-4" size={14} />
                                                    <input 
                                                        ref={searchInputRef}
                                                        type="text" 
                                                        placeholder={`Search...`}
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full pl-8 pr-3 py-1.5 bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/60 dark:focus:bg-white/10 transition-all 3xl:text-sm 3xl:py-2 3xl:pl-10"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                                            {(() => {
                                                const options = getOptionsForCategory(activeFilterCategory);
                                                const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()));
                                                
                                                if (filteredOptions.length === 0) {
                                                     return <div className="px-4 py-3 text-xs text-slate-400 italic text-center mt-4 3xl:text-sm">No results found</div>;
                                                }
                                                
                                                return filteredOptions.map(option => {
                                                    const currentFilter = activeFilters.find(f => f.key === activeFilterCategory);
                                                    const isSelected = currentFilter?.values.includes(option);
                                                    
                                                    // Custom rendering for Capacity options
                                                    let colorClass = 'bg-white/60 dark:bg-white/5 border-slate-300 dark:border-slate-600';
                                                    if (activeFilterCategory === 'Capacity') {
                                                        if (option === 'Available') colorClass = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
                                                        if (option === 'Warning') colorClass = 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400';
                                                        if (option === 'Overbooked') colorClass = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400';
                                                    }

                                                    return (
                                                        <label key={option} className="flex items-center gap-2 px-3 py-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg cursor-pointer group transition-all active:scale-98 3xl:px-4 3xl:py-2.5">
                                                            <div className={`size-4 rounded-md border flex items-center justify-center transition-all shrink-0 3xl:size-5 ${isSelected ? 'bg-primary border-primary shadow-sm' : colorClass} ${isSelected ? '' : 'group-hover:border-primary/50'}`}>
                                                                {isSelected && <Check size={10} className="text-white 3xl:w-3 3xl:h-3" strokeWidth={3} />}
                                                            </div>
                                                            <input 
                                                                type="checkbox" 
                                                                className="hidden"
                                                                checked={isSelected || false}
                                                                onChange={() => handleFilterValueToggle(activeFilterCategory, option)}
                                                            />
                                                            <span className={`text-xs ${isSelected ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'} 3xl:text-sm`}>{option}</span>
                                                        </label>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center flex-1 text-xs text-slate-400 italic px-6 text-center 3xl:text-sm">
                                        Select a category
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group z-20">
                        <button 
                            onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 px-3 py-1.5 rounded-xl shadow-sm hover:bg-white/70 dark:hover:bg-white/10 hover:shadow-glow transition-all active:scale-95 focus:ring-2 focus:ring-primary/20 outline-none min-w-[140px] justify-between 3xl:text-sm 3xl:px-4 3xl:py-2 3xl:min-w-[160px]"
                        >
                            <div className="flex items-center gap-2">
                                 <Layers size={14} className="text-slate-500 dark:text-slate-400 3xl:w-4 3xl:h-4" />
                                 <span className="truncate">Group: {groupBy}</span>
                            </div>
                            <ChevronDown size={14} className="text-slate-400 group-hover:text-primary transition-colors 3xl:w-4 3xl:h-4" />
                        </button>
                        {isGroupMenuOpen && (
                             <div className="absolute right-0 top-full mt-2 w-[180px] bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-xl shadow-glass border border-white/50 dark:border-white/10 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200 3xl:w-[220px]">
                                {groupOptions.map(opt => (
                                    <button 
                                        key={opt}
                                        onClick={() => { setGroupBy(opt); setIsGroupMenuOpen(false); }}
                                        className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 transition-colors 3xl:text-sm 3xl:py-3"
                                    >
                                        {opt}
                                        {groupBy === opt && <Check size={14} className="text-primary 3xl:w-4 3xl:h-4" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
                        className="relative size-8 flex items-center justify-center bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-xl shadow-sm hover:bg-white/70 dark:hover:bg-white/10 hover:shadow-glow transition-all active:scale-90 focus:ring-2 focus:ring-primary/20 outline-none group overflow-hidden 3xl:size-10"
                        title={density === 'comfortable' ? "Switch to Compact View" : "Switch to Comfortable View"}
                    >
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out transform ${density === 'comfortable' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 3xl:w-5 3xl:h-5"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"></path></svg>
                        </div>
                        
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out transform ${density === 'compact' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}>
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 3xl:w-5 3xl:h-5"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"></path></svg>
                        </div>
                    </button>
                </div>
            </div>

            {/* Heatmap Container */}
            <div className="flex-1 min-h-0 flex flex-col relative z-10 transition-all duration-500 ease-out">
                <Heatmap 
                    data={currentData} 
                    viewMode={viewState.mode} 
                    timeRange={viewState.timeRange}
                    selectedIds={viewState.selectedIds}
                    onSelectionChange={handleSelectionChange}
                    onItemClick={handleItemClick}
                    themeSettings={themeSettings}
                    density={density}
                    selectionRange={selectionRange}
                    onSelectionRangeChange={onSelectionRangeChange}
                    onCellClick={onCellClick}
                    expandedRows={expandedRows}
                    setExpandedRows={setExpandedRows}
                    selectedMonthIndices={selectedMonthIndices}
                    onMonthSelectionChange={onMonthSelectionChange}
                    onAddChild={onAddChild}
                    onInlineSave={onInlineSave}
                />
            </div>
        </div>

      </main>
    </div>
  );
};