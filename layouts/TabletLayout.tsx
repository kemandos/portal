import React, { useState } from 'react';
import { ViewState, ThemeSettings, Filter, Resource, SelectionRange } from '../types';
import { Heatmap } from '../components/Heatmap';
import { Users } from 'lucide-react';

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

export const TabletLayout: React.FC<LayoutProps> = ({ 
    viewState, setViewState, currentData, handleSelectionChange, handleItemClick, onOpenSettings, themeSettings,
    groupBy, setGroupBy, activeFilters, onAddFilter, onRemoveFilter, density,
    selectionRange, onSelectionRangeChange, onCellClick, expandedRows, setExpandedRows,
    selectedMonthIndices, onMonthSelectionChange, onAddChild, onInlineSave
}) => {
  return (
    <div className="bg-background text-[#1b0d10] font-sans antialiased h-screen flex flex-col overflow-hidden selection:bg-primary/20">
        <header className="flex-none bg-white border-b border-[#f3e7ea] px-6 py-4 z-30 relative shadow-sm">
            <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
                <div className="flex items-center gap-3 w-[240px]">
                    <div className="text-primary flex items-center justify-center">
                        <Users size={28} />
                    </div>
                    <h1 className="text-[#1b0d10] text-xl font-bold tracking-tight">Staffing</h1>
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="bg-[#f3e7ea] p-1 rounded-xl flex items-center">
                        <button 
                            onClick={() => setViewState(v => ({...v, mode: 'People'}))}
                            className={`relative flex items-center justify-center px-6 py-2 rounded-lg transition-all duration-200 text-sm font-semibold ${viewState.mode === 'People' ? 'bg-white shadow-sm text-primary' : 'text-[#9a4c5b] hover:bg-white/50'}`}
                        >
                            People
                        </button>
                        <button 
                            onClick={() => setViewState(v => ({...v, mode: 'Projects'}))}
                            className={`relative flex items-center justify-center px-6 py-2 rounded-lg transition-all duration-200 text-sm font-semibold ${viewState.mode === 'Projects' ? 'bg-white shadow-sm text-primary' : 'text-[#9a4c5b] hover:bg-white/50'}`}
                        >
                            Projects
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 w-[240px]">
                    <button onClick={onOpenSettings} className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f3e7ea] hover:bg-[#ebdce0] text-[#1b0d10] transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </button>
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-hidden relative bg-[#fcf8f9]">
            <div className="h-full w-full p-6 pb-24 overflow-auto hide-scrollbar">
                <div className="max-w-[1400px] mx-auto">
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