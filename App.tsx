import React, { useState, useEffect, useMemo } from 'react';
import { DesktopLayout } from './layouts/DesktopLayout';
import { TabletLayout } from './layouts/TabletLayout';
import { MobileLayout } from './layouts/MobileLayout';
import { EditAssignmentModal } from './components/modals/EditAssignmentModal';
import { MobileEditAssignmentModal } from './components/modals/MobileEditAssignmentModal';
import { BulkAssignmentModal } from './components/modals/BulkAssignmentModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { MONTHS } from './constants';
import { ViewState, ThemeSettings, Filter, Resource, SelectionRange } from './types';
import { ClipboardList, X } from 'lucide-react';
import { useStaffingData } from './hooks/useStaffingData';

function App() {
  const [viewState, setViewState] = useState<ViewState>({
    mode: 'People',
    timeRange: '6M',
    selectedIds: []
  });

  // Updated Theme Settings for new Color System
  // Under (0-50%): Slate/Gray
  // Balanced (50-90%): Emerald
  // Warning (90-100%): Amber
  // Over (>100%): Red
  const [peopleThemeSettings, setPeopleThemeSettings] = useState<ThemeSettings>({
    mode: 'light',
    colorTheme: 'emerald',
    cellStyle: 'modern',
    thresholdColors: {
        under: '#94a3b8',   // Slate 400
        balanced: '#10b981', // Emerald 500
        optimal: '#f59e0b',  // Amber 500 (Warning zone)
        over: '#ef4444'      // Red 500
    },
    thresholds: { under: 50, balanced: 90, over: 100 }
  });

  const [projectThemeSettings, setProjectThemeSettings] = useState<ThemeSettings>({
    mode: 'light',
    colorTheme: 'rose',
    cellStyle: 'modern',
    thresholdColors: {
        under: '#94a3b8',
        balanced: '#10b981',
        optimal: '#f59e0b',
        over: '#ef4444'
    },
    thresholds: { under: 50, balanced: 90, over: 100 }
  });

  const currentThemeSettings = viewState.mode === 'People' ? peopleThemeSettings : projectThemeSettings;
  const setCurrentThemeSettings = viewState.mode === 'People' ? setPeopleThemeSettings : setProjectThemeSettings;

  const { 
      peopleData, 
      projectData, 
      handleSaveAssignment, 
      handleDeleteAssignment, 
      handleInlineSave 
  } = useStaffingData(viewState.mode);

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
      'f1': true, 'p1': true, 'g1': true, 'e1': true
  });

  useEffect(() => {
    if (currentThemeSettings.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentThemeSettings.mode]);

  // Clear row selection when switching to Projects view
  useEffect(() => {
    if (viewState.mode === 'Projects') {
      setViewState(prev => ({ ...prev, selectedIds: [] }));
    }
  }, [viewState.mode]);
  
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [selectedMonthIndices, setSelectedMonthIndices] = useState<number[]>([]);
  const [groupBy, setGroupBy] = useState<string>('Managing Consultant');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([
     { key: 'Status', values: ['Active'] }
  ]);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [editContext, setEditContext] = useState<{resourceId?: string, month?: string, months?: string[], isAddMode?: boolean}>({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const processedData = useMemo(() => {
    const rawDataSource = viewState.mode === 'Projects' ? projectData : peopleData;
    const settings = viewState.mode === 'People' ? peopleThemeSettings : projectThemeSettings;
    
    const projectParentMap = new Map<string, string>();
    if (viewState.mode === 'Projects') {
        projectData.forEach(folder => {
            folder.children?.forEach(child => {
                projectParentMap.set(child.id, folder.name);
            });
        });
    }

    const allItems = rawDataSource.flatMap(parent => parent.children || []);

    const filteredItems = allItems.filter(item => {
        if (activeFilters.length === 0) return true;

        return activeFilters.every(filter => {
            if (filter.values.length === 0) return true;

            // Capacity Filter Logic
            if (filter.key === 'Capacity') {
                const visibleMonths = MONTHS.slice(0, viewState.timeRange === '3M' ? 3 : viewState.timeRange === '6M' ? 6 : 9);
                // Calculate average utilization
                let totalPct = 0;
                let monthCount = 0;
                
                visibleMonths.forEach(m => {
                    const alloc = item.allocations[m];
                    const cap = alloc?.capacity || 20;
                    const pt = alloc?.pt || 0;
                    if (cap > 0) {
                        totalPct += (pt / cap) * 100;
                        monthCount++;
                    }
                });
                const avgUtil = monthCount > 0 ? totalPct / monthCount : 0;
                
                // Logic adjusted to:
                // Available: <= 90% (includes under and balanced)
                // Warning: 90% - 100%
                // Overbooked: > 100%
                
                const isOverbooked = avgUtil > settings.thresholds!.over; // > 100
                const isWarning = avgUtil > settings.thresholds!.balanced && avgUtil <= settings.thresholds!.over; // 90-100
                const isAvailable = avgUtil <= settings.thresholds!.balanced; // < 90

                if (filter.values.includes('Overbooked') && isOverbooked) return true;
                if (filter.values.includes('Warning') && isWarning) return true;
                if (filter.values.includes('Available') && isAvailable) return true;
                return false;
            }

            if (filter.key === 'Utilization') {
                return true; 
            }

            if (filter.key === 'Status') return filter.values.includes(item.status || 'Active');

            if (viewState.mode === 'People') {
                if (filter.key === 'Managing Consultant') return filter.values.includes(item.manager || 'Unassigned');
                if (filter.key === 'Department') return filter.values.includes(item.department || 'Unassigned');
                if (filter.key === 'Employee') return filter.values.includes(item.name);
                if (filter.key === 'Skill') return filter.values.every(s => item.skills?.includes(s));
            } 
            else {
                if (filter.key === 'Dealfolder') {
                    const parentName = projectParentMap.get(item.id);
                    return parentName && filter.values.includes(parentName);
                }
                if (filter.key === 'Deal') return filter.values.includes(item.name);
                if (filter.key === 'Project Lead') return filter.values.includes(item.manager || '');
                if (filter.key === 'Employee') {
                    return item.children && item.children.some(child => filter.values.includes(child.name));
                }
                if (filter.key === 'Managing Consultant') {
                    return item.children && item.children.some(child => child.manager && filter.values.includes(child.manager));
                }
            }
            return true;
        });
    });

    const calculatedItems = filteredItems.map(item => {
        if (!item.children) return item;

        const newAllocations = { ...item.allocations };
        
        MONTHS.forEach(month => {
             const totalPt = item.children!.reduce((sum, child) => {
                 return sum + (child.allocations[month]?.pt || 0);
             }, 0);

             const existing = item.allocations[month];
             const capacity = existing ? existing.capacity : 20;

             let status: 'optimal' | 'over' | 'under' | 'empty' = 'optimal';
             if (totalPt === 0) status = 'empty';
             else if (totalPt > capacity) status = 'over';
             else if (totalPt < capacity) status = 'under';

             newAllocations[month] = {
                 pt: totalPt,
                 capacity: capacity,
                 status
             };
        });

        return { ...item, allocations: newAllocations };
    });

    // Helper to calculate group statistics
    const getGroupSubtext = (children: Resource[]) => {
        const count = children.length;
        if (count === 0) return 'No items';
        
        // Calculate Avg Utilization for current time range
        const months = MONTHS.slice(0, 6);
        let totalUtil = 0;
        let validMonths = 0;

        children.forEach(c => {
            months.forEach(m => {
                const alloc = c.allocations[m];
                const pt = alloc?.pt || 0;
                const cap = alloc?.capacity || 20;
                if (cap > 0) {
                    totalUtil += (pt / cap);
                    validMonths++;
                }
            });
        });

        const avg = validMonths > 0 ? (totalUtil / validMonths) * 100 : 0;
        return `${count} Members • ${avg.toFixed(0)}% Avg Util.`;
    };

    if (viewState.mode === 'People') {
        if (groupBy === 'None') return calculatedItems;
        if (groupBy === 'Department') {
            const groups: Record<string, Resource[]> = {};
            calculatedItems.forEach(item => {
                const dept = item.department || 'Unassigned';
                if (!groups[dept]) groups[dept] = [];
                groups[dept].push(item);
            });
            return Object.entries(groups).map(([name, children], idx) => ({
                id: `grp_dept_${idx}`,
                name: name,
                subtext: getGroupSubtext(children),
                type: 'group' as const,
                isExpanded: true,
                allocations: {},
                children
            }));
        }
        if (groupBy === 'Managing Consultant') {
             const groups: Record<string, Resource[]> = {};
            calculatedItems.forEach(item => {
                const mgr = item.manager || 'Unassigned';
                if (!groups[mgr]) groups[mgr] = [];
                groups[mgr].push(item);
            });
            return Object.entries(groups).map(([name, children], idx) => ({
                id: `grp_mgr_${idx}`,
                name: name,
                subtext: getGroupSubtext(children),
                type: 'group' as const,
                isExpanded: true,
                allocations: {},
                children
            }));
        }
         return calculatedItems; 
    } else {
        if (groupBy === 'None') return calculatedItems;
        if (groupBy === 'Dealfolder') {
             return projectData.map(folder => {
                 const matchingChildren = (folder.children || []).map(child => 
                     calculatedItems.find(c => c.id === child.id)
                 ).filter((c): c is Resource => !!c);

                 if (matchingChildren.length === 0) return null;
                 
                 return {
                     ...folder,
                     type: 'group' as const,
                     children: matchingChildren,
                     subtext: `${matchingChildren.length} Projects`,
                     isExpanded: true
                 };
             }).filter(Boolean) as Resource[];
        }
        return calculatedItems;
    }
  }, [viewState.mode, groupBy, activeFilters, viewState.timeRange, peopleData, projectData, peopleThemeSettings, projectThemeSettings]);

  const flattenedRows = useMemo(() => {
    const rows: { resource: Resource; depth: number; isGroupHeader: boolean }[] = [];
    const traverse = (nodes: Resource[], depth = 0) => {
        nodes.forEach(node => {
            const hasChildren = node.children && node.children.length > 0;
            const isGroupHeader = node.type === 'group' || (node.type === 'project' && hasChildren && depth === 0);
            rows.push({ resource: node, depth, isGroupHeader });
            const isExpanded = expandedRows[node.id] ?? node.isExpanded;
            if (isExpanded && hasChildren) traverse(node.children!, depth + 1);
        });
    };
    traverse(processedData);
    return rows;
  }, [processedData, expandedRows]);

  const handleCellClick = (resourceId: string, month: string) => {
      const visibleMonths = MONTHS.slice(0, viewState.timeRange === '3M' ? 3 : viewState.timeRange === '6M' ? 6 : 9);
      let targetMonths = [month];

      if (selectedMonthIndices.length > 0) {
          targetMonths = selectedMonthIndices.map(i => visibleMonths[i]).filter(Boolean);
      } else if (selectionRange) {
          const start = Math.min(selectionRange.start.monthIndex, selectionRange.end.monthIndex);
          const end = Math.max(selectionRange.start.monthIndex, selectionRange.end.monthIndex);
          if (start !== end) {
              targetMonths = [];
              for(let i=start; i<=end; i++) {
                  if (visibleMonths[i]) targetMonths.push(visibleMonths[i]);
              }
          }
      }

      setEditContext({ resourceId, month, months: targetMonths, isAddMode: false });
      setIsEditModalOpen(true);
  };

  const handleAddChild = (resourceId: string) => {
      setEditContext({ resourceId, isAddMode: true });
      setIsEditModalOpen(true);
  };
  
  const handleSaveWrapper = (data: any) => {
      handleSaveAssignment(data);
      setIsEditModalOpen(false);
  };

  const handleDeleteWrapper = (resourceId: string, parentId?: string, month?: string, months?: string[]) => {
      handleDeleteAssignment(resourceId, parentId, month, months);
      setIsEditModalOpen(false);
  };

  const handleSelectionChange = (ids: string[]) => {
    setViewState(prev => ({ ...prev, selectedIds: ids }));
  };

  const handleRangeChange = (range: SelectionRange | null) => {
      setSelectionRange(range);
  };

  const handleMonthSelectionChange = (indices: number[]) => {
      setSelectedMonthIndices(indices);
  };

  const getSelectionCount = () => {
    if (viewState.selectedIds.length === 0 && selectionRange) {
        const rowDiff = Math.abs(selectionRange.end.rowIndex - selectionRange.start.rowIndex) + 1;
        const colDiff = Math.abs(selectionRange.end.monthIndex - selectionRange.start.monthIndex) + 1;
        return rowDiff * colDiff;
    }
    // For Projects view, strict count based on what's active
    if (viewState.mode === 'Projects') {
        if (viewState.selectedIds.length > 0) return viewState.selectedIds.length;
        if (selectedMonthIndices.length > 0) return selectedMonthIndices.length;
    }
    
    // For People view, sum is fine or prioritize rows
    if (viewState.selectedIds.length > 0 && selectedMonthIndices.length > 0) return viewState.selectedIds.length + selectedMonthIndices.length;
    if (viewState.selectedIds.length > 0) return viewState.selectedIds.length;
    if (selectedMonthIndices.length > 0) return selectedMonthIndices.length;
    return 0;
  };

  const modalData = useMemo(() => {
    let selectedIds = [...viewState.selectedIds];
    if (selectedIds.length === 0 && selectionRange) {
         const startRow = Math.min(selectionRange.start.rowIndex, selectionRange.end.rowIndex);
         const endRow = Math.max(selectionRange.start.rowIndex, selectionRange.end.rowIndex);
         for (let i = startRow; i <= endRow; i++) {
             if (flattenedRows[i]) {
                 selectedIds.push(flattenedRows[i].resource.id);
             }
         }
    }
    const visibleMonths = MONTHS.slice(0, viewState.timeRange === '3M' ? 3 : viewState.timeRange === '6M' ? 6 : 9);
    let initialMonthsSet = new Set<string>();
    if (selectionRange) {
        const startIdx = Math.min(selectionRange.start.monthIndex, selectionRange.end.monthIndex);
        const endIdx = Math.max(selectionRange.start.monthIndex, selectionRange.end.monthIndex);
        for (let i = startIdx; i <= endIdx; i++) {
            if (visibleMonths[i]) initialMonthsSet.add(visibleMonths[i]);
        }
    }
    selectedMonthIndices.forEach(idx => {
        if (visibleMonths[idx]) initialMonthsSet.add(visibleMonths[idx]);
    });
    return { selectedIds, initialMonths: Array.from(initialMonthsSet) };
  }, [viewState.selectedIds, selectionRange, selectedMonthIndices, flattenedRows, viewState.timeRange]);

  const commonProps = {
    viewState, setViewState, currentData: processedData,
    handleSelectionChange,
    handleItemClick: (id: string) => { setEditContext({resourceId: id}); setIsEditModalOpen(true); },
    onOpenSettings: () => setIsSettingsModalOpen(true),
    themeSettings: currentThemeSettings, groupBy, setGroupBy, activeFilters,
    onAddFilter: (f: Filter) => setActiveFilters(prev => {
        const existingIdx = prev.findIndex(item => item.key === f.key);
        if (existingIdx >= 0) {
            const next = [...prev];
            next[existingIdx] = f;
            return next;
        }
        return [...prev, f];
    }),
    onRemoveFilter: (idx: number) => setActiveFilters(prev => prev.filter((_, i) => i !== idx)),
    density, setDensity,
    selectionRange, 
    onSelectionRangeChange: handleRangeChange,
    onCellClick: handleCellClick,
    onAddChild: handleAddChild,
    expandedRows, setExpandedRows,
    selectedMonthIndices, onMonthSelectionChange: handleMonthSelectionChange,
    onInlineSave: handleInlineSave
  };

  const isSingleCellRange = selectionRange && 
    selectionRange.start.rowIndex === selectionRange.end.rowIndex && 
    selectionRange.start.monthIndex === selectionRange.end.monthIndex;

  // Show selection bar ONLY if there is a selection.
  // In Projects view, ONLY show if months are selected (row selection is disabled).
  const showSelectionBar = viewState.mode === 'People' 
      ? (viewState.selectedIds.length > 0 || (selectionRange !== null && !isSingleCellRange) || selectedMonthIndices.length > 0)
      : (selectedMonthIndices.length > 0 || (selectionRange !== null && !isSingleCellRange));

  // Selection Label Logic
  let selectionLabel = 'Selection Active';
  if (viewState.mode === 'People') {
      if (viewState.selectedIds.length > 0 && selectedMonthIndices.length > 0) {
          selectionLabel = `${viewState.selectedIds.length} employees, ${selectedMonthIndices.length} months`;
      } else if (viewState.selectedIds.length > 0) {
          selectionLabel = `${viewState.selectedIds.length} employees selected`;
      } else if (selectedMonthIndices.length > 0) {
          selectionLabel = `${selectedMonthIndices.length} months selected`;
      } else if (selectionRange && !isSingleCellRange) {
          selectionLabel = 'Cells selected';
      }
  } else if (viewState.mode === 'Projects') {
      // In Projects view, we only care about Month selection or Cell selection
      if (selectedMonthIndices.length > 0) {
          selectionLabel = `${selectedMonthIndices.length} months selected`;
      } else if (selectionRange && !isSingleCellRange) {
          selectionLabel = 'Cells selected';
      }
  }

  const isMobile = windowWidth < 768;

  return (
    <>
      {windowWidth < 768 ? (
          <MobileLayout {...commonProps} />
      ) : windowWidth < 1024 ? (
          <TabletLayout {...commonProps} />
      ) : (
          <DesktopLayout {...commonProps} />
      )}

      {showSelectionBar && !isMobile && (
        <div className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-center w-full px-4 pointer-events-none">
            <div className="bg-[#1e293b] text-white rounded-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] p-2 pr-4 flex items-center gap-6 animate-in slide-in-from-bottom-5 fade-in duration-300 border border-white/10 ring-1 ring-black/20 pointer-events-auto backdrop-blur-xl">
                <div className="flex items-center gap-4 pl-2">
                    <div className="flex items-center justify-center size-10 rounded-full bg-[#e11d48] text-white font-bold text-sm shadow-[0_4px_12px_rgba(225,29,72,0.4)] ring-2 ring-[#e11d48]/50 ring-offset-2 ring-offset-[#1e293b]">
                        {getSelectionCount()}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-white leading-none">
                            {selectionLabel}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium leading-none">
                            Select action below
                        </span>
                    </div>
                </div>
                
                <div className="h-8 w-px bg-white/10" />

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsBulkModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all text-xs font-bold active:scale-95 border border-white/5 hover:border-white/20 hover:shadow-lg shadow-black/20"
                    >
                        <ClipboardList size={16} className="text-slate-300" />
                        {viewState.mode === 'Projects' && selectedMonthIndices.length > 0 ? 'View Time Periods' : 'Assign'}
                    </button>
                    
                    <button 
                        onClick={() => { 
                            setViewState(v => ({...v, selectedIds: []})); 
                            setSelectionRange(null); 
                            setSelectedMonthIndices([]);
                        }}
                        className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
      )}

      {isMobile ? (
          <MobileEditAssignmentModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            initialData={editContext}
            viewMode={viewState.mode}
            currentData={viewState.mode === 'People' ? peopleData : projectData}
            onSave={handleSaveWrapper}
            onDelete={handleDeleteWrapper}
          />
      ) : (
          <EditAssignmentModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            initialData={editContext}
            viewMode={viewState.mode}
            currentData={viewState.mode === 'People' ? peopleData : projectData}
            onSave={handleSaveWrapper}
            onDelete={handleDeleteWrapper}
          />
      )}
      
      <BulkAssignmentModal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)}
        selectedIds={modalData.selectedIds}
        currentData={processedData}
        initialMonths={modalData.initialMonths}
      />
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        peopleSettings={peopleThemeSettings}
        setPeopleSettings={setPeopleThemeSettings}
        projectSettings={projectThemeSettings}
        setProjectSettings={setProjectThemeSettings}
        initialView={viewState.mode}
      />
    </>
  );
}

export default App;