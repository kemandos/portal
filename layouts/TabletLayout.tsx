import React, { useState, useEffect } from 'react';
import { ViewState, ThemeSettings, Filter, Resource, SelectionRange } from '../types';
import { Heatmap } from '../components/Heatmap';
import { Users, Settings, Filter as FilterIcon, ChevronDown, ChevronUp, Layers, Check, X } from 'lucide-react';
import { MOCK_PEOPLE, MOCK_PROJECTS } from '../constants';

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
  onCellClick: (resourceId: string, month: string) => void;
  expandedRows: Record<string, boolean>;
  setExpandedRows: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedMonthIndices?: number[];
  onMonthSelectionChange?: (indices: number[]) => void;
  onAddChild?: (resourceId: string) => void;
  onInlineSave?: (resourceId: string, month: string, value: number, isCapacity: boolean) => void;
}

export const TabletLayout: React.FC<LayoutProps> = ({ 
    viewState, setViewState, currentData, handleSelectionChange, handleItemClick, onOpenSettings, themeSettings,
    groupBy, setGroupBy, activeFilters, onAddFilter, onRemoveFilter, density,
    selectionRange, onSelectionRangeChange, onCellClick, expandedRows, setExpandedRows,
    selectedMonthIndices, onMonthSelectionChange, onAddChild, onInlineSave
}) => {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false);

  useEffect(() => {
    const handleResize = () => {
        setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ensure we default to 3M view on tablet if not already set
  useEffect(() => {
     if (viewState.timeRange !== '3M') {
         // setViewState(prev => ({...prev, timeRange: '3M'}));
     }
  }, []);

  const filterCategories = viewState.mode === 'People' 
    ? ['Capacity', 'Managing Consultant', 'Department', 'Employee']
    : ['Capacity', 'Project Lead', 'Dealfolder', 'Status'];
    
  const groupOptions = viewState.mode === 'People' 
    ? ['None', 'Department', 'Managing Consultant'] 
    : ['None', 'Dealfolder', 'Project Lead'];

  const getOptionsForCategory = (category: string) => {
      if (category === 'Capacity') return ['Available', 'Warning', 'Overbooked'];
      const rawData = viewState.mode === 'Projects' ? MOCK_PROJECTS : MOCK_PEOPLE;
      const values = new Set<string>();
      
      const process = (nodes: Resource[]) => {
          nodes.forEach(n => {
              if (category === 'Status') values.add(n.status || 'Active');
              if (category === 'Department' && n.department) values.add(n.department);
              if (category === 'Managing Consultant' && n.manager) values.add(n.manager);
              if (category === 'Project Lead' && n.manager) values.add(n.manager);
              if (category === 'Dealfolder' && n.type === 'project' && n.children && n.children.length > 0) values.add(n.name);
              if (n.children) process(n.children);
          });
      };
      process(rawData);
      return Array.from(values).sort();
  };

  const handleFilterToggle = (category: string, value: string) => {
      const existingFilter = activeFilters.find(f => f.key === category);
      let newValues: string[] = [];
      if (existingFilter) {
          if (existingFilter.values.includes(value)) newValues = existingFilter.values.filter(v => v !== value);
          else newValues = [...existingFilter.values, value];
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

  // Responsive Styles
  const headerRow1Padding = isPortrait ? 'px-4 py-2' : 'px-6 py-3';
  const headerRow2Padding = isPortrait ? 'px-4 py-1.5' : 'px-6 py-2';
  const toggleTextSize = isPortrait ? 'text-[11px]' : 'text-xs';
  const iconSize = isPortrait ? 16 : 18;
  const controlsHeight = isPortrait ? 'min-h-[40px]' : 'min-h-[44px]';

  return (
    <div className="bg-[#F5F2EB] text-[#1b0d10] font-sans antialiased h-screen flex flex-col overflow-hidden selection:bg-primary/20">
        
        {/* Header - 2 Rows */}
        <header className="flex-none bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-white/50 z-40 relative shadow-sm transition-all">
            {/* Row 1: Logo, Toggle, Range, Settings */}
            <div className={`${headerRow1Padding} flex items-center justify-between gap-4 border-b border-gray-100/50`}>
                <div className="flex items-center gap-4">
                     <div className="size-9 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm ring-1 ring-black/5">
                        <Users size={20} />
                    </div>
                    
                    <div className="flex bg-gray-200/50 p-1 rounded-lg">
                        <button 
                            onClick={() => setViewState(v => ({...v, mode: 'People'}))}
                            className={`px-4 py-1.5 rounded-md ${toggleTextSize} font-bold transition-all ${viewState.mode === 'People' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            People
                        </button>
                        <button 
                            onClick={() => setViewState(v => ({...v, mode: 'Projects'}))}
                            className={`px-4 py-1.5 rounded-md ${toggleTextSize} font-bold transition-all ${viewState.mode === 'Projects' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Projects
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                     <div className="flex bg-gray-200/50 p-1 rounded-lg">
                        {['3M', '6M', '9M'].map(r => (
                            <button 
                                key={r}
                                onClick={() => setViewState(v => ({...v, timeRange: r as any}))}
                                className={`px-3 py-1.5 rounded-md ${toggleTextSize} font-bold transition-all ${viewState.timeRange === r ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    <button onClick={onOpenSettings} className="size-9 flex items-center justify-center rounded-lg hover:bg-white/50 text-slate-500 hover:text-slate-900 transition-colors">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Row 2: Controls & Filters */}
            <div className={`${headerRow2Padding} ${controlsHeight} flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                     <div className="relative group">
                        <button 
                            className={`
                                flex items-center gap-2 px-4 py-3 rounded-xl ${toggleTextSize} font-bold shadow-sm border transition-all duration-200
                                bg-white border-gray-200 text-slate-900 hover:bg-slate-50
                            `}
                        >
                            <Layers size={14} className="text-slate-600" />
                            <span>Group: {groupBy}</span>
                            {groupBy !== 'None' && (
                                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full ml-1">
                                    Active
                                </span>
                            )}
                            <ChevronDown size={14} className="opacity-50" />
                        </button>
                        {/* Simple Hover Dropdown for Tablet */}
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-1 hidden group-hover:block animate-in fade-in slide-in-from-top-1">
                            {groupOptions.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setGroupBy(opt)}
                                    className={`w-full text-left px-3 py-2 rounded-lg ${toggleTextSize} font-medium flex items-center justify-between hover:bg-slate-50 ${groupBy === opt ? 'text-primary bg-primary/5' : 'text-slate-600'}`}
                                >
                                    {opt}
                                    {groupBy === opt && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                     </div>

                     <div className="h-6 w-px bg-gray-300/50 mx-1" />

                     {/* Active Filters Summary */}
                     <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar max-w-[400px]">
                         {activeFilters.length === 0 && <span className={`${toggleTextSize} text-slate-400 italic`}>No filters active</span>}
                         {activeFilters.map((f, i) => (
                             <div key={i} className={`flex items-center gap-1 bg-white border border-gray-200 ${isPortrait ? 'px-2 py-0.5' : 'px-2 py-1'} rounded-md shadow-sm`}>
                                 <span className={`${isPortrait ? 'text-[9px]' : 'text-[10px]'} font-bold text-slate-500 uppercase`}>{f.key}:</span>
                                 <span className={`${isPortrait ? 'text-[9px]' : 'text-[10px]'} font-bold text-slate-900`}>{f.values[0]}{f.values.length > 1 && ` +${f.values.length-1}`}</span>
                                 <button onClick={() => onRemoveFilter(i)} className="ml-1 text-slate-400 hover:text-red-500"><X size={12}/></button>
                             </div>
                         ))}
                     </div>
                </div>

                <button 
                    onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                    className={`
                        relative flex items-center gap-2 px-4 py-3 rounded-xl ${toggleTextSize} font-bold shadow-sm border transition-all duration-200
                        bg-white border-gray-200 text-slate-900 hover:bg-slate-50
                    `}
                >
                    <FilterIcon size={14} className="text-slate-600" />
                    Filters
                    {/* Badge for Closed State */}
                    {!isFilterPanelOpen && activeFilters.length > 0 && (
                        <span className={`absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 ${isPortrait ? 'px-1.5 text-[9px]' : 'px-1 text-[10px]'} bg-[#ee3a5e] text-white font-bold rounded-full shadow-sm ring-2 ring-white animate-in zoom-in-50 duration-200`}>
                            {activeFilters.length}
                        </span>
                    )}

                    {/* Inline count if open */}
                    {isFilterPanelOpen && activeFilters.length > 0 && (
                        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{activeFilters.length}</span>
                    )}

                    {isFilterPanelOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
            </div>

            {/* Collapsible Filter Panel */}
            {isFilterPanelOpen && (
                <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-xl z-50 animate-in slide-in-from-top-2 p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className={`grid ${isPortrait ? 'grid-cols-2 gap-4' : 'grid-cols-4 gap-6'}`}>
                            {filterCategories.map(cat => (
                                <div key={cat} className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cat}</h3>
                                    <div className="space-y-1">
                                        {getOptionsForCategory(cat).map(opt => {
                                            const isSelected = activeFilters.find(f => f.key === cat)?.values.includes(opt);
                                            return (
                                                <button
                                                    key={opt}
                                                    onClick={() => handleFilterToggle(cat, opt)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between group ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 text-slate-600'}`}
                                                >
                                                    {opt}
                                                    {isSelected && <Check size={14} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                             <button 
                                onClick={() => { activeFilters.forEach((_, i) => onRemoveFilter(0)); }}
                                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                             >
                                 Clear All
                             </button>
                             <button 
                                onClick={() => setIsFilterPanelOpen(false)}
                                className="px-6 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-lg transition-colors"
                             >
                                 Apply & Close
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
        
        {/* Backdrop when filter panel is open */}
        {isFilterPanelOpen && (
            <div className="absolute inset-0 z-30 bg-slate-900/10 backdrop-blur-[1px]" onClick={() => setIsFilterPanelOpen(false)} />
        )}

        <main className="flex-1 overflow-hidden relative bg-[#F5F2EB]">
            <div className="h-full w-full p-4 overflow-auto hide-scrollbar">
                 <div className="h-full flex flex-col relative z-10">
                    {/* Heatmap Wrapper with horizontal scroll and sticky column */}
                    <Heatmap 
                        data={currentData} 
                        viewMode={viewState.mode} 
                        timeRange={viewState.timeRange}
                        selectedIds={viewState.selectedIds}
                        onSelectionChange={handleSelectionChange}
                        onItemClick={handleItemClick}
                        themeSettings={themeSettings}
                        density={density} // Pass through, but tablet might enforce one
                        selectionRange={selectionRange}
                        onSelectionRangeChange={onSelectionRangeChange}
                        onCellClick={onCellClick}
                        expandedRows={expandedRows}
                        setExpandedRows={setExpandedRows}
                        selectedMonthIndices={selectedMonthIndices}
                        onMonthSelectionChange={onMonthSelectionChange}
                        onAddChild={onAddChild}
                        onInlineSave={onInlineSave}
                        isPortraitTablet={isPortrait}
                    />
                </div>
            </div>
        </main>
    </div>
  );
};