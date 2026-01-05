import React, { useState, useEffect, useRef } from 'react';
import { ViewState, ThemeSettings, Filter, Resource, SelectionRange } from '../types';
import { MobileListView } from '../components/MobileListView';
import { X, Filter as FilterIcon, Settings, RefreshCw, Plus, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { MOCK_PEOPLE, MOCK_PROJECTS, MONTHS } from '../constants';
import { DetailSheet } from '../components/mobile/DetailSheet';
import { findResource } from '../utils/resourceHelpers';

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

export const MobileLayout: React.FC<LayoutProps> = ({ 
    viewState, setViewState, currentData, handleSelectionChange, handleItemClick, themeSettings,
    activeFilters, onAddFilter, onRemoveFilter, onCellClick, 
    selectedMonthIndices, onAddChild, groupBy, setGroupBy,
    expandedRows, setExpandedRows, onOpenSettings
}) => {
  
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState<string | null>(null);
  
  // Detail Sheet State
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Resource | null>(null);
  
  // Compute active resource from currentData to ensure updates (like added assignments) are reflected immediately in DetailSheet
  // and to prevent stale data when returning from Edit Modal.
  const activeResource = selectedItem ? findResource(currentData, selectedItem.id) : null;
  
  // Pull to Refresh State
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleMonths = MONTHS.slice(0, 3); // Always show first 3 months

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

  const handleCardTap = (item: Resource) => {
      setSelectedItem(item);
      setDetailSheetOpen(true);
  };

  const handleEditMonth = (resourceId: string, month: string | string[], intent?: 'budget' | 'assignments') => {
      if (Array.isArray(month)) {
          // Bulk edit
          if (onCellClick) onCellClick(resourceId, month[0], month, intent);
      } else {
          // Single edit
          if (onCellClick) onCellClick(resourceId, month, undefined, intent);
      }
  };

  // --- Dynamic Filter Logic ---
  const filterCategories = viewState.mode === 'People' 
    ? ['Managing Consultant', 'Department', 'Employee', 'Skill', 'Status']
    : ['Project Lead', 'Managing Consultant', 'Dealfolder', 'Deal', 'Employee', 'Status'];
    
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
    <div className="flex flex-col h-[100dvh] bg-[#F5F2EB] text-slate-900 font-sans w-full overflow-hidden">
      
      {/* Fixed Header - Simplified */}
      <div className="bg-[#FDFBF7] border-b border-gray-200/50 shadow-sm flex-none z-30">
          <div className="flex items-center justify-between px-4 py-3">
              {/* View Toggle */}
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-1 border border-white/40 shadow-sm flex gap-1">
                  <button
                      onClick={() => setViewState(prev => ({ ...prev, mode: 'People' }))}
                      className={`
                          px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
                          ${viewState.mode === 'People'
                              ? 'bg-white text-primary shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }
                      `}
                  >
                      People
                  </button>
                  <button
                      onClick={() => setViewState(prev => ({ ...prev, mode: 'Projects' }))}
                      className={`
                          px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
                          ${viewState.mode === 'Projects'
                              ? 'bg-white text-primary shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }
                      `}
                  >
                      Projects
                  </button>
              </div>

              {/* Settings Button */}
              <button
                  onClick={onOpenSettings}
                  className="p-2.5 rounded-xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                  <Settings size={20} />
              </button>
          </div>
      </div>

      {/* Main Content Area */}
      <main 
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-[#F5F2EB] overscroll-contain relative"
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

         {/* Controls Bar - Sticky at top of scroll */}
         <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 px-3 py-3 shadow-sm">
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm p-2 space-y-2">
                
                {/* Filter Button - Full Width */}
                <button 
                    onClick={() => setIsFilterSheetOpen(!isFilterSheetOpen)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold shadow-sm border transition-all duration-200 active:scale-95 bg-white border-gray-200 text-slate-900 hover:bg-slate-50"
                >
                    <div className="relative shrink-0">
                        <FilterIcon size={18} className="text-slate-600" />
                        {activeFilters.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 size-4 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                                {activeFilters.length}
                            </span>
                        )}
                    </div>
                    <span>Filters</span>
                </button>

                {/* Active Filters Row */}
                {activeFilters.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                        {activeFilters.map((filter, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-white border border-gray-200/50 px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{filter.key}:</span>
                                <span className="text-[10px] font-bold text-primary">{filter.values[0]}{filter.values.length > 1 ? ` +${filter.values.length - 1}` : ''}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onRemoveFilter(idx); }}
                                    className="ml-0.5 p-0.5 rounded-full hover:bg-slate-100 text-slate-400"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
         </div>

         {/* Cards List */}
         <MobileListView 
            data={currentData}
            visibleMonths={visibleMonths}
            viewMode={viewState.mode}
            timeRange={viewState.timeRange}
            selectedIds={viewState.selectedIds}
            onSelectionChange={handleSelectionChange}
            onItemClick={handleItemClick}
            onCellClick={onCellClick}
            onAddChild={onAddChild}
            themeSettings={themeSettings}
            className=""
            isSelectionMode={false}
            selectedMonthIndices={selectedMonthIndices}
            groupBy={groupBy}
            expandedRows={expandedRows}
            setExpandedRows={setExpandedRows}
            onCardTap={handleCardTap}
         />
      </main>

      {/* Detail Sheet */}
      <DetailSheet 
        isOpen={detailSheetOpen}
        onClose={() => setDetailSheetOpen(false)}
        employee={viewState.mode === 'People' ? activeResource : undefined}
        project={viewState.mode === 'Projects' ? activeResource : undefined}
        viewMode={viewState.mode}
        onEditAllocations={() => {
            // Keep DetailSheet open so when the modal closes, we return here
            if (activeResource) {
                if (viewState.mode === 'Projects') {
                    handleItemClick(activeResource.id, 'assignments');
                } else {
                    handleItemClick(activeResource.id);
                }
            }
        }}
        onEditBudget={(projectId) => {
             // Keep DetailSheet open
            handleItemClick(projectId, 'budget');
        }}
        onAddChild={() => {
            // Keep DetailSheet open
            if (activeResource && onAddChild) onAddChild(activeResource.id);
        }}
        onEditMonth={handleEditMonth}
      />

      {/* Filter Sheet */}
      {isFilterSheetOpen && (
        <>
        <div 
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsFilterSheetOpen(false)}
        />
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] border-t border-gray-100 z-50 animate-in slide-in-from-bottom duration-300 rounded-t-[32px] flex flex-col max-h-[75dvh]">
             <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsFilterSheetOpen(false)}>
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
             </div>
             
             <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                <h3 className="text-lg font-bold text-slate-900">Filters</h3>
                {activeFilters.length > 0 && (
                    <button 
                        onClick={() => { activeFilters.forEach((_, i) => onRemoveFilter(0)); }}
                        className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
                    >
                        Clear All
                    </button>
                )}
             </div>

             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                {filterCategories.map(category => {
                    const isOpen = activeFilterCategory === category;
                    const activeCount = activeFilters.find(f => f.key === category)?.values.length || 0;
                    return (
                        <div key={category} className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm transition-all mb-3 last:mb-0">
                            <button 
                                onClick={() => setActiveFilterCategory(isOpen ? null : category)}
                                className="w-full flex items-center justify-between p-4 text-left active:bg-slate-50 hover:bg-slate-50/50 transition-colors"
                            >
                                <span className="text-sm font-bold text-slate-700">{category}</span>
                                <div className="flex items-center gap-3">
                                    {activeCount > 0 && (
                                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            {activeCount}
                                        </span>
                                    )}
                                    {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                </div>
                            </button>
                            {isOpen && (
                                <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2">
                                    <div className="h-px bg-slate-100 mb-3" />
                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                                        {getOptionsForCategory(category).map(option => {
                                            const isSelected = activeFilters.find(f => f.key === category)?.values.includes(option);
                                            return (
                                                <label key={option} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors">
                                                    <div className={`size-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary shadow-sm' : 'bg-white border-slate-300 group-hover:border-primary/50'}`}>
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
             
             <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                <button 
                    onClick={() => setIsFilterSheetOpen(false)}
                    className="w-full py-3.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg transition-colors active:scale-95"
                >
                    Apply Filters
                </button>
            </div>
        </div>
        </>
      )}

    </div>
  );
};