import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ViewState, ThemeSettings, Filter, Resource, SelectionRange } from '../types';
import { Heatmap } from '../components/Heatmap';
import { Header } from '../components/Header';
import { X, Plus, Layers, ChevronDown, Check, ChevronRight, Search } from 'lucide-react';
import { MONTHS, MOCK_PEOPLE, MOCK_PROJECTS } from '../constants';

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
}

export const DesktopLayout: React.FC<LayoutProps> = ({ 
    viewState, setViewState, currentData, handleSelectionChange, handleItemClick, onOpenSettings, themeSettings,
    groupBy, setGroupBy, activeFilters, onAddFilter, onRemoveFilter, density, setDensity,
    selectionRange, onSelectionRangeChange, onCellClick, expandedRows, setExpandedRows,
    selectedMonthIndices, onMonthSelectionChange
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
    : ['None', 'Dealfolder'];

  const filterCategories = viewState.mode === 'People' 
    ? ['Managing Consultant', 'Department', 'Employee', 'Skill', 'Status']
    : ['Status']; 

  const getOptionsForCategory = (category: string) => {
      const rawData = viewState.mode === 'Projects' ? MOCK_PROJECTS : MOCK_PEOPLE;
      const allItems = rawData.flatMap(g => g.children || []);
      
      const filteredContext = allItems.filter(item => {
          return activeFilters.every(f => {
              if (f.key === category) return true;
              if (f.key === 'Managing Consultant') return f.values.includes(item.manager || '');
              if (f.key === 'Department') return f.values.includes(item.department || '');
              // Match App.tsx: Use 'every' for Skills to implement AND logic
              if (f.key === 'Skill') return f.values.every(s => item.skills?.includes(s));
              if (f.key === 'Employee') return f.values.includes(item.name);
              if (f.key === 'Status') return f.values.includes(item.status || 'Active');
              return true;
          });
      });

      const values = new Set<string>();
      filteredContext.forEach(item => {
          if (category === 'Managing Consultant' && item.manager) values.add(item.manager);
          if (category === 'Department' && item.department) values.add(item.department);
          if (category === 'Employee') values.add(item.name);
          if (category === 'Skill' && item.skills) item.skills.forEach(s => values.add(s));
          if (category === 'Status') values.add(item.status || 'Active');
      });

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

  const stats = useMemo(() => {
    const available: Resource[] = [];
    const fullyAllocated: Resource[] = [];
    const overCapacity: Resource[] = [];

    // Use currentData here to reflect active filters in statistics count
    const flatData = currentData.flatMap(item => 
        item.children && item.type === 'group' ? item.children : 
        item.type === 'project' && item.children ? item.children : 
        [item]
    );

    const monthsToCheck = MONTHS.slice(0, viewState.timeRange === '3M' ? 3 : viewState.timeRange === '6M' ? 6 : 9);
    
    const t = themeSettings?.thresholds || { under: 50, balanced: 90, over: 110 };

    flatData.forEach(res => {
        let totalPt = 0;
        let totalCapacity = 0;
        
        monthsToCheck.forEach(m => {
            const alloc = res.allocations[m];
            if (alloc) {
                totalPt += alloc.pt;
                totalCapacity += alloc.capacity;
            } else {
                totalCapacity += 20; 
            }
        });

        const ratio = totalCapacity > 0 ? totalPt / totalCapacity : 0;
        const percentage = ratio * 100;

        if (percentage <= t.under) {
            available.push(res);
        } else if (percentage > t.over) {
            overCapacity.push(res);
        } else {
            fullyAllocated.push(res);
        }
    });

    return { available, fullyAllocated, overCapacity };
  }, [currentData, viewState.timeRange, themeSettings?.thresholds]);

  const renderLegendCard = (title: string, items: Resource[], colorHex: string, filterValue: string) => {
      const isActive = activeFilters.some(f => f.key === 'Utilization' && f.values.includes(filterValue));
      
      return (
        <button 
            onClick={() => {
                const existing = activeFilters.find(f => f.key === 'Utilization');
                let newValues = existing ? [...existing.values] : [];
                if (newValues.includes(filterValue)) {
                    newValues = newValues.filter(v => v !== filterValue);
                } else {
                    newValues = [...newValues, filterValue];
                }
                
                if (newValues.length === 0) {
                    const idx = activeFilters.findIndex(f => f.key === 'Utilization');
                    if (idx !== -1) onRemoveFilter(idx);
                } else {
                    onAddFilter({ key: 'Utilization', values: newValues });
                }
            }}
            className={`
                group flex items-center gap-2 px-2 py-1 rounded-full border transition-all duration-300 cursor-pointer h-7 shadow-sm text-xs backdrop-blur-md
                hover:scale-105 active:scale-95
                ${isActive 
                    ? 'bg-white/80 border-slate-300 ring-2 ring-white/50 shadow-glow' 
                    : 'bg-white/40 border-white/50 hover:bg-white/60 hover:shadow-md'
                }
            `}
            title={`Filter by ${title}`}
        >
            <div className="size-2 rounded-full shadow-sm ring-1 ring-black/5" style={{ backgroundColor: colorHex }}></div>
            <span className="font-semibold text-slate-600 truncate max-w-[80px] hidden sm:block">{title}</span>
            <span className="font-bold text-slate-900 bg-white/50 px-1.5 rounded-full min-w-[18px] text-center">{items.length}</span>
        </button>
      );
  };

  const colors = themeSettings?.thresholdColors || {
    under: '#cbd5e1', 
    balanced: '#ee3a5e', 
    optimal: '#ee3a5e',
    over: '#be123c'
  };

  return (
    <div className="flex flex-col h-screen bg-transparent text-slate-900 font-sans selection:bg-primary/20">
      <Header 
        viewState={viewState} 
        setViewState={setViewState} 
        onOpenSettings={onOpenSettings}
        isDesktop={true}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex-1 flex flex-col px-6 pt-2 pb-6 max-w-[1920px] w-full mx-auto overflow-hidden">
            
            {/* Filter Bar */}
            <div className="flex-none flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-500 mr-2 drop-shadow-sm">Filters:</span>
                    
                    {activeFilters.map((filter, idx) => (
                         <div key={idx} className="flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-white/60 rounded-full px-3 py-1 text-xs font-medium shadow-sm animate-in fade-in zoom-in duration-300 hover:shadow-glow transition-shadow">
                            <span className="text-slate-500">{filter.key}:</span>
                            <span className="text-slate-900 font-bold">{filter.values.join(', ')}</span>
                            <button 
                                onClick={() => onRemoveFilter(idx)}
                                className="p-0.5 hover:bg-black/5 rounded-full text-slate-400 hover:text-red-500 transition-colors ml-1 active:scale-90"
                            >
                                <X size={14} />
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
                                hover:scale-105 active:scale-95
                                ${isFilterMenuOpen 
                                    ? 'bg-white text-primary border-primary shadow-glow' 
                                    : 'text-slate-500 hover:text-primary hover:bg-white/40 border-slate-300'
                                }
                            `}
                        >
                            <Plus size={14} /> Add Filter
                        </button>

                        {/* Dropdown Menu */}
                        {isFilterMenuOpen && (
                            <div className="absolute left-0 top-full mt-2 bg-white/80 backdrop-blur-2xl rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-white/50 py-1 z-50 min-w-[200px] animate-in fade-in zoom-in-95 duration-200 flex flex-row h-[320px] ring-1 ring-white/80">
                                <div className="flex flex-col py-1 min-w-[180px] border-r border-gray-100/30">
                                    {filterCategories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setActiveFilterCategory(category)}
                                            className={`flex items-center justify-between px-4 py-2.5 text-xs font-medium text-left transition-colors ${activeFilterCategory === category ? 'bg-white/60 text-primary shadow-sm' : 'text-slate-700 hover:bg-white/40'}`}
                                        >
                                            {category}
                                            <ChevronRight size={14} className={`text-slate-400 ${activeFilterCategory === category ? 'text-primary' : ''}`} />
                                        </button>
                                    ))}
                                </div>
                                {activeFilterCategory ? (
                                    <div className="flex flex-col min-w-[240px] bg-transparent rounded-r-xl">
                                        <div className="p-2 border-b border-gray-100/30">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                                                Select {activeFilterCategory}
                                            </div>
                                            <div className="relative group/search">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within/search:text-primary" size={14} />
                                                <input 
                                                    ref={searchInputRef}
                                                    type="text" 
                                                    placeholder={`Search...`}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-1.5 bg-white/40 border border-white/60 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/60 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                                            {(() => {
                                                const options = getOptionsForCategory(activeFilterCategory);
                                                const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()));
                                                
                                                if (filteredOptions.length === 0) {
                                                     return <div className="px-4 py-3 text-xs text-slate-400 italic text-center mt-4">No results found</div>;
                                                }
                                                
                                                return filteredOptions.map(option => {
                                                    const currentFilter = activeFilters.find(f => f.key === activeFilterCategory);
                                                    const isSelected = currentFilter?.values.includes(option);
                                                    return (
                                                        <label key={option} className="flex items-center gap-2 px-3 py-2 hover:bg-white/50 rounded-lg cursor-pointer group transition-all active:scale-98">
                                                            <div className={`size-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-primary border-primary shadow-sm' : 'border-slate-300 bg-white/60 group-hover:border-primary/50'}`}>
                                                                {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                                                            </div>
                                                            <input 
                                                                type="checkbox" 
                                                                className="hidden"
                                                                checked={isSelected || false}
                                                                onChange={() => handleFilterValueToggle(activeFilterCategory, option)}
                                                            />
                                                            <span className={`text-xs ${isSelected ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{option}</span>
                                                        </label>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center flex-1 text-xs text-slate-400 italic px-6 text-center">
                                        Select a category
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Quick Filters / Legend */}
                    <div className="flex items-center gap-2 mr-2">
                         {renderLegendCard('Available', stats.available, colors.under, 'Available')}
                         {renderLegendCard('Fully Allocated', stats.fullyAllocated, colors.balanced, 'Fully Allocated')}
                         {renderLegendCard('Over Capacity', stats.overCapacity, colors.over, 'Over Capacity')}
                    </div>

                    <div className="w-px h-6 bg-slate-400/20 mx-1"></div>

                    <div className="relative group z-20">
                        <button 
                            onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/40 backdrop-blur-xl border border-white/50 px-3 py-1.5 rounded-xl shadow-sm hover:bg-white/70 hover:shadow-glow transition-all active:scale-95 focus:ring-2 focus:ring-primary/20 outline-none min-w-[140px] justify-between"
                        >
                            <div className="flex items-center gap-2">
                                 <Layers size={14} className="text-slate-500" />
                                 <span className="truncate">Group: {groupBy}</span>
                            </div>
                            <ChevronDown size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                        </button>
                        {isGroupMenuOpen && (
                             <div className="absolute right-0 top-full mt-2 w-[180px] bg-white/80 backdrop-blur-2xl rounded-xl shadow-glass border border-white/50 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {groupOptions.map(opt => (
                                    <button 
                                        key={opt}
                                        onClick={() => { setGroupBy(opt); setIsGroupMenuOpen(false); }}
                                        className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-700 hover:bg-white/50 transition-colors"
                                    >
                                        {opt}
                                        {groupBy === opt && <Check size={14} className="text-primary" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
                        className="relative size-8 flex items-center justify-center bg-white/40 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm hover:bg-white/70 hover:shadow-glow transition-all active:scale-90 focus:ring-2 focus:ring-primary/20 outline-none group overflow-hidden"
                        title={density === 'comfortable' ? "Switch to Compact View" : "Switch to Comfortable View"}
                    >
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out transform ${density === 'comfortable' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-slate-600 group-hover:text-slate-800"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"></path></svg>
                        </div>
                        
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out transform ${density === 'compact' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}>
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-slate-600 group-hover:text-slate-800"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"></path></svg>
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
                />
            </div>
        </div>

      </main>
    </div>
  );
};