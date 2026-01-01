import React from 'react';
import { ViewState, ThemeSettings, Filter, Resource, SelectionRange } from '../types';
import { Heatmap } from '../components/Heatmap';
import { LayoutGrid, Settings, Search } from 'lucide-react';

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

export const MobileLayout: React.FC<LayoutProps> = ({ 
    viewState, setViewState, currentData, handleSelectionChange, handleItemClick, onOpenSettings, themeSettings, density,
    selectionRange, onSelectionRangeChange, onCellClick, expandedRows, setExpandedRows,
    selectedMonthIndices, onMonthSelectionChange
}) => {
  return (
    <div className="flex flex-col h-screen bg-background text-slate-900 font-sans">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <LayoutGrid size={20} />
            </div>
            <h1 className="text-lg font-bold">Capacity</h1>
         </div>
         <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                <Search size={20} />
            </button>
            <button onClick={onOpenSettings} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                <Settings size={20} />
            </button>
         </div>
      </header>

      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewState(prev => ({ ...prev, mode: 'People', selectedIds: [] }))}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewState.mode === 'People' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
              >
                People
              </button>
              <button 
                onClick={() => setViewState(prev => ({ ...prev, mode: 'Projects', selectedIds: [] }))}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewState.mode === 'Projects' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
              >
                Projects
              </button>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
                onClick={() => setViewState(prev => ({ ...prev, timeRange: '3M' }))}
                className={`px-2 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewState.timeRange === '3M' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
              >
                3M
              </button>
              <button 
                onClick={() => setViewState(prev => ({ ...prev, timeRange: '6M' }))}
                className={`px-2 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewState.timeRange === '6M' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
              >
                6M
              </button>
              <button 
                onClick={() => setViewState(prev => ({ ...prev, timeRange: '9M' }))}
                className={`px-2 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewState.timeRange === '9M' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
              >
                9M
              </button>
        </div>
      </div>

      <main className="flex-1 overflow-hidden relative flex flex-col p-2 pb-24">
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
      </main>
    </div>
  );
};