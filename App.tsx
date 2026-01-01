import React, { useState, useEffect, useMemo } from 'react';
import { DesktopLayout } from './layouts/DesktopLayout';
import { TabletLayout } from './layouts/TabletLayout';
import { MobileLayout } from './layouts/MobileLayout';
import { EditAssignmentModal } from './components/modals/EditAssignmentModal';
import { BulkAssignmentModal } from './components/modals/BulkAssignmentModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { MOCK_PROJECTS, MOCK_PEOPLE, MONTHS } from './constants';
import { ViewState, ThemeSettings, Filter, Resource, SelectionRange } from './types';
import { ClipboardList, Merge, X } from 'lucide-react';

function App() {
  const [viewState, setViewState] = useState<ViewState>({
    mode: 'People',
    timeRange: '6M',
    selectedIds: []
  });

  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    mode: 'light',
    colorTheme: 'rose',
    cellStyle: 'modern',
    thresholds: { under: 50, balanced: 90, over: 110 }
  });

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
      'f1': true, 'p1': true, 'g1': true, 'e1': true
  });

  // Apply Dark Mode Class
  useEffect(() => {
    if (themeSettings.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeSettings.mode]);
  
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  
  // New state for column (month) selection
  const [selectedMonthIndices, setSelectedMonthIndices] = useState<number[]>([]);

  const [groupBy, setGroupBy] = useState<string>('None');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([
     { key: 'Status', values: ['Active'] }
  ]);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [editContext, setEditContext] = useState<{resourceId?: string, month?: string}>({});

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const processedData = useMemo(() => {
    const rawDataSource = viewState.mode === 'Projects' ? MOCK_PROJECTS : MOCK_PEOPLE;
    // Flatten to leaves (Employees or Projects) for filtering
    const allItems = rawDataSource.flatMap(parent => parent.children || []);

    // Filter Logic
    const filteredItems = allItems.filter(item => {
        if (activeFilters.length === 0) return true;

        return activeFilters.every(filter => {
            if (filter.values.length === 0) return true;

            if (filter.key === 'Utilization') {
                const monthsToCheck = MONTHS.slice(0, viewState.timeRange === '3M' ? 3 : viewState.timeRange === '6M' ? 6 : 9);
                const t = themeSettings.thresholds || { under: 50, balanced: 90, over: 110 };
                
                let totalPt = 0;
                let totalCapacity = 0;
                
                monthsToCheck.forEach(m => {
                    const alloc = item.allocations[m];
                    if (alloc) {
                        totalPt += alloc.pt;
                        totalCapacity += alloc.capacity;
                    } else {
                        totalCapacity += 20; 
                    }
                });

                const ratio = totalCapacity > 0 ? totalPt / totalCapacity : 0;
                const percentage = ratio * 100;
                
                let status = 'Fully Allocated';
                if (percentage <= t.under) status = 'Available';
                else if (percentage > t.over) status = 'Over Capacity';

                return filter.values.includes(status);
            }

            if (filter.key === 'Status') return filter.values.includes(item.status || 'Active');
            if (filter.key === 'Managing Consultant') return filter.values.includes(item.manager || 'Unassigned');
            if (filter.key === 'Department') return filter.values.includes(item.department || 'Unassigned');
            if (filter.key === 'Employee') return filter.values.includes(item.name);
            // Skill filter now uses 'every' (AND logic) instead of 'some' (OR logic)
            if (filter.key === 'Skill') return filter.values.every(s => item.skills?.includes(s));
            
            return true;
        });
    });

    // --- Recalculate allocations (Roll-up) ---
    // Ensure parent allocation matches the sum of children
    const calculatedItems = filteredItems.map(item => {
        if (!item.children) return item;

        const newAllocations = { ...item.allocations };
        
        MONTHS.forEach(month => {
             // Sum children PT for this month
             const totalPt = item.children!.reduce((sum, child) => {
                 return sum + (child.allocations[month]?.pt || 0);
             }, 0);

             // Get capacity from existing record or default to 20 PT
             const existing = item.allocations[month];
             const capacity = existing ? existing.capacity : 20;

             // Determine status
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

    // Grouping Logic applied to calculated items
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
                subtext: `${children.length} Members`,
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
                subtext: `${children.length} Reports`,
                type: 'group' as const,
                isExpanded: true,
                allocations: {},
                children
            }));
        }
         return calculatedItems; 
    } else {
        // Projects Mode
        if (groupBy === 'None') return calculatedItems;
        if (groupBy === 'Dealfolder') {
             // Reconstruct parent folders with filtered/calculated children
             return MOCK_PROJECTS.map(folder => {
                 // Use calculatedItems to find the updated child (with rolled-up pt)
                 const matchingChildren = (folder.children || []).map(child => 
                     calculatedItems.find(c => c.id === child.id)
                 ).filter((c): c is Resource => !!c);

                 if (matchingChildren.length === 0) return null;
                 
                 return {
                     ...folder,
                     children: matchingChildren,
                     subtext: `${matchingChildren.length} Projects`,
                     isExpanded: true
                 };
             }).filter(Boolean) as Resource[];
        }
        return calculatedItems;
    }
  }, [viewState.mode, groupBy, activeFilters, viewState.timeRange, themeSettings.thresholds]);

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
      setEditContext({ resourceId, month });
      setIsEditModalOpen(true);
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
    themeSettings, groupBy, setGroupBy, activeFilters,
    // Fix: Upsert filter instead of appending to avoid duplicates which caused AND logic between same-key filters
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
    expandedRows, setExpandedRows,
    selectedMonthIndices, onMonthSelectionChange: handleMonthSelectionChange
  };

  const isSingleCellRange = selectionRange && 
    selectionRange.start.rowIndex === selectionRange.end.rowIndex && 
    selectionRange.start.monthIndex === selectionRange.end.monthIndex;

  const hasSelection = viewState.selectedIds.length > 0 || (selectionRange !== null && !isSingleCellRange) || selectedMonthIndices.length > 0;
  
  let selectionLabel = 'Selection Active';
  if (viewState.selectedIds.length > 0) selectionLabel = viewState.mode === 'People' ? 'Employees selected' : 'Projects selected';
  else if (selectionRange && !isSingleCellRange) selectionLabel = 'Cells selected';
  else if (selectedMonthIndices.length > 0) selectionLabel = 'Months selected';

  return (
    <>
      {windowWidth < 768 ? (
          <MobileLayout {...commonProps} />
      ) : windowWidth < 1024 ? (
          <TabletLayout {...commonProps} />
      ) : (
          <DesktopLayout {...commonProps} />
      )}

      {/* Floating Action Bar (Bulk Actions) */}
      {hasSelection && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-center w-full px-4 pointer-events-none">
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
                        Assign
                    </button>
                    {viewState.mode === 'Projects' && (
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all text-xs font-bold active:scale-95 border border-white/5 hover:border-white/20 hover:shadow-lg shadow-black/20">
                             <Merge size={16} className="text-slate-300" />
                             Merge
                        </button>
                    )}
                    
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

      <EditAssignmentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        initialData={editContext}
        viewMode={viewState.mode}
      />
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
        themeSettings={themeSettings}
        setThemeSettings={setThemeSettings}
      />
    </>
  );
}

export default App;