import { useState, useRef, useMemo, useEffect } from 'react';
import { MONTHS, MOCK_PEOPLE, MOCK_PROJECTS } from '../../../constants';
import { Resource } from '../../../types';
import { getSearchableItems } from '../../../utils/resourceHelpers';

interface UseEditAssignmentLogicProps {
  isOpen: boolean;
  initialData?: { resourceId?: string; month?: string; months?: string[]; isAddMode?: boolean; intent?: 'budget' | 'assignments' };
  viewMode: 'People' | 'Projects';
  currentData: Resource[];
  onSave: (data: any) => void;
  onDelete: (resourceId: string, parentId?: string, month?: string, months?: string[]) => void;
}

export const useEditAssignmentLogic = ({
  isOpen,
  initialData,
  viewMode,
  currentData,
  onSave,
  onDelete
}: UseEditAssignmentLogicProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<'Project' | 'Employee'>('Project');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [ptValue, setPtValue] = useState(0.0);
  const [mode, setMode] = useState<'edit' | 'add'>('add');
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[0]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [targetResource, setTargetResource] = useState<Resource | null>(null);
  const [parentResource, setParentResource] = useState<Resource | null>(null);
  const [selectedSearchResult, setSelectedSearchResult] = useState<any>(null);
  const [isCapacityEdit, setIsCapacityEdit] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('Engineer');
  
  // Multi-Month State
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // List View State
  const [internalMode, setInternalMode] = useState<'list' | 'form'>('form');
  const [listAssignments, setListAssignments] = useState<Resource[]>([]);
  const [listEmployee, setListEmployee] = useState<Resource | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  // --- Logic Helpers ---

  const getRoleForEmployee = (emp: Resource | any) => {
    const title = (emp.subtext || '').toLowerCase();
    
    // Explicit Managing Consultant Detection -> Defaults to Project Manager
    if (title.includes('managing consultant') || /\bmc\b/.test(title)) {
        return 'Managing Consultant';
    }

    // Explicit Project Manager Detection
    if (title.includes('project manager')) {
        return 'Project Manager';
    }

    // Leadership roles default to Project Manager
    const isLeadership = title.includes('lead') || 
                 title.includes('manager') || 
                 title.includes('director') || 
                 title.includes('vp') || 
                 title.includes('head') || 
                 title.includes('architect') ||
                 title.includes('principal');

    if (isLeadership) return 'Project Manager';

    // Department Defaults
    const dept = emp.department || '';
    if (dept === 'Engineering') return 'Engineer';
    if (dept === 'Reporting') return 'Analyst';
    if (dept === 'Project Management') return 'Project Manager';
    
    return 'Engineer'; 
  };

  // --- Effects ---

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
        setSearchTerm('');
        setPtValue(0);
        setSelectedSearchResult(null);
        setMode('add');
        setIsCapacityEdit(false);
        setInternalMode('form');
        setListEmployee(null);
        setTargetResource(null);
        setParentResource(null);
        setSelectedItemType('Project');
        setSelectedRole('Engineer');
        setAllocations({});
    }
  }, [isOpen]);

  // Initialization Logic
  useEffect(() => {
    if (isOpen && initialData) {
        const dataset = currentData;
        const initialMonth = initialData.month || MONTHS[0];
        
        let initialMonthsList = [initialMonth];
        if (initialData.months && initialData.months.length > 1) {
            // Ensure months are sorted chronologically
            initialMonthsList = [...initialData.months].sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
        }
        
        setSelectedMonths(initialMonthsList);
        setSelectedMonth(initialMonthsList[0]);

        let foundResource: Resource | null = null;
        let foundParent: Resource | null = null;
        let foundDepth = -1;

        const find = (nodes: Resource[], depth: number, parent: Resource | null): boolean => {
            for (const node of nodes) {
                if (node.id === initialData.resourceId) {
                    foundResource = node;
                    foundParent = parent;
                    foundDepth = depth;
                    return true;
                }
                if (node.children) {
                    if (find(node.children, depth + 1, node)) return true;
                }
            }
            return false;
        };

        if (initialData.resourceId) {
            find(dataset, 0, null);
        }

        if (foundResource) {
            const res = foundResource as Resource;
            setTargetResource(res);
            setParentResource(foundParent);
            
            // Initialize Allocations Map
            const newAllocations: Record<string, number> = {};
            initialMonthsList.forEach(m => {
                newAllocations[m] = res.allocations[m]?.pt || 0;
            });
            setAllocations(newAllocations);
            
            const isMultiMonth = initialData.months && initialData.months.length > 1;

            // Logic to switch to List View if clicking a parent with existing assignments
            if (viewMode === 'Projects' && res.type === 'project') {
                 // Check if user wants to manage assignments (list view)
                 if (initialData.intent === 'assignments') {
                     const monthsToCheck = initialMonthsList.length > 0 ? initialMonthsList : [initialMonth];
                     const activeAssignments = res.children?.filter(c => 
                        monthsToCheck.some(m => (c.allocations[m]?.pt || 0) > 0)
                     ) || [];
                     setInternalMode('list');
                     setListAssignments(activeAssignments);
                     setListEmployee(res);
                     setMode('edit'); 
                     setSearchTerm('');
                     setIsCapacityEdit(false);
                     return;
                 }
                 
                 // Default to Budget Edit or if intent === 'budget'
                 if (foundDepth > 0 || true) { // Always true for actual projects
                     setMode('edit');
                     setIsCapacityEdit(true);
                     setSearchTerm(res.name);
                     const allocation = res.allocations[initialMonth];
                     setPtValue(allocation ? allocation.capacity : 0);
                     const capAlloc: Record<string, number> = {};
                     initialMonthsList.forEach(m => capAlloc[m] = res.allocations[m]?.capacity || 0);
                     setAllocations(capAlloc);
                 }
            } else if (!isMultiMonth && viewMode === 'People' && res.type === 'employee' && !initialData.isAddMode) {
                 const activeAssignments = res.children?.filter(c => (c.allocations[initialMonth]?.pt || 0) > 0) || [];
                 if (activeAssignments.length > 0) {
                     setInternalMode('list');
                     setListAssignments(activeAssignments);
                     setListEmployee(res);
                     setMode('edit'); 
                     setSearchTerm(''); 
                     return;
                 } else {
                     setInternalMode('form');
                     setMode('add');
                     setParentResource(res);
                     setTargetResource(null);
                     setSelectedItemType('Project');
                     setPtValue(0);
                     setAllocations({});
                     setSearchTerm('');
                     setSelectedSearchResult(null);
                     return;
                 }
            } else if (isMultiMonth && viewMode === 'People' && res.type === 'employee') {
                 setInternalMode('form');
                 setMode('add');
                 setParentResource(res);
                 setTargetResource(null);
                 setSelectedItemType('Project');
                 setPtValue(0);
                 
                 const emptyAlloc: Record<string, number> = {};
                 initialMonthsList.forEach(m => emptyAlloc[m] = 0);
                 setAllocations(emptyAlloc);

                 setSearchTerm('');
                 setSelectedSearchResult(null);
                 return;
            }

            setInternalMode('form');

            if (initialData.isAddMode) {
                 setMode('add');
                 setSearchTerm('');
                 setPtValue(0);
                 
                 const emptyAlloc: Record<string, number> = {};
                 initialMonthsList.forEach(m => emptyAlloc[m] = 0);
                 setAllocations(emptyAlloc);

                 setSelectedSearchResult(null);
                 setIsCapacityEdit(false);
                 
                 if (viewMode === 'Projects' && res.type === 'project') {
                     setSelectedItemType('Employee');
                     setParentResource(res); 
                 } else {
                     setSelectedItemType(viewMode === 'People' ? 'Project' : 'Employee');
                 }
                 return;
            }

            // Fallback edit for deep clicked items (assignments)
            if ((viewMode === 'Projects' && res.type === 'project' && foundDepth > 0 && !initialData.intent) || (foundDepth > 0 && viewMode === 'Projects' && initialData.intent === 'budget')) {
                 // Already handled above but kept for safety if logic falls through
                 setMode('edit');
                 setIsCapacityEdit(true);
            } else if (foundDepth === 2 || (foundDepth === 1 && viewMode === 'People' && parentResource?.type === 'employee')) {
                setMode('edit');
                setIsCapacityEdit(false);
                setSearchTerm(res.name);
                setSelectedItemType(res.type === 'project' ? 'Project' : 'Employee');
                const allocation = res.allocations[initialMonth];
                setPtValue(allocation ? allocation.pt : 0);
                
                if (res.role) {
                    setSelectedRole(res.role);
                } else if (viewMode === 'Projects' && res.subtext) {
                    const sub = res.subtext;
                    if (['Engineer', 'Analyst', 'Managing Consultant', 'Project Manager', 'Project Lead'].includes(sub)) {
                        setSelectedRole(sub);
                    } else {
                         setSelectedRole('Engineer');
                    }
                }
            } else {
                setMode('add');
                setIsCapacityEdit(false);
                setSearchTerm(''); 
                setPtValue(0);
                setAllocations({});
                setSelectedSearchResult(null);
                
                if (viewMode === 'People') setSelectedItemType('Project');
                else setSelectedItemType('Employee');
            }
        }
    }
  }, [isOpen, initialData, viewMode, currentData]);

  // Click outside search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            setIsSearchOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync PT Value on Change
  const existingChild = useMemo(() => {
    if (mode === 'edit') return targetResource;
    if (mode === 'add' && parentResource && selectedSearchResult) {
         const childId = selectedSearchResult.id;
         return parentResource.children?.find(c => c.id === childId || c.id.startsWith(`${childId}::`));
    }
    return null;
  }, [mode, targetResource, parentResource, selectedSearchResult]);

  useEffect(() => {
    if (isCapacityEdit && targetResource) {
          const allocation = targetResource.allocations[selectedMonth];
          setPtValue(allocation ? allocation.capacity : 0);
          return;
    }

    if (existingChild) {
        const allocation = existingChild.allocations[selectedMonth];
        setPtValue(allocation ? allocation.pt : 0);
        if (existingChild.role) {
             setSelectedRole(existingChild.role);
        }
    } else if (mode === 'add') {
        if (selectedMonths.length === 1) {
             setPtValue(allocations[selectedMonths[0]] || 0);
        }
    }
    
    if (internalMode === 'list' && listEmployee) {
        const monthsToCheck = selectedMonths.length > 0 ? selectedMonths : [selectedMonth];
        const activeAssignments = listEmployee.children?.filter(c => 
            monthsToCheck.some(m => (c.allocations[m]?.pt || 0) > 0)
        ) || [];
        setListAssignments(activeAssignments);
    }
  }, [selectedMonth, existingChild, isCapacityEdit, targetResource, mode, internalMode, listEmployee, selectedMonths, allocations]);

  // Update default role when adding
  useEffect(() => {
      if (mode === 'add' && selectedSearchResult) {
          let employeeToCheck = null;

          if (viewMode === 'Projects' && selectedItemType === 'Employee') {
              employeeToCheck = selectedSearchResult;
          } else if (viewMode === 'People' && parentResource && parentResource.type === 'employee') {
              employeeToCheck = parentResource;
          }

          if (employeeToCheck) {
              const defaultRole = getRoleForEmployee(employeeToCheck);
              setSelectedRole(defaultRole);
          }
      }
  }, [selectedSearchResult, mode, selectedItemType, viewMode, parentResource]);

  // --- Computed Values ---

  const searchableItems = useMemo(() => getSearchableItems(MOCK_PEOPLE, MOCK_PROJECTS), []);
  
  const filteredItems = searchableItems.filter(p => 
    p.type === selectedItemType && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCapacityStatsForMonth = (month: string, proposedPt: number) => {
      let cap = 20;
      let base = 0;
      
      if (viewMode === 'People') {
          const employee = parentResource || targetResource;
          if (employee) {
              const alloc = employee.allocations[month];
              cap = alloc?.capacity || 20;
              const currentTotal = employee.children 
                  ? employee.children.reduce((sum, child) => sum + (child.allocations[month]?.pt || 0), 0)
                  : (alloc?.pt || 0);
              
              if (mode === 'edit' && targetResource && !isCapacityEdit) {
                   const assignAlloc = targetResource.allocations[month];
                   base = Math.max(0, currentTotal - (assignAlloc?.pt || 0));
              } else {
                   base = currentTotal;
              }
          }
      } else if (viewMode === 'Projects') {
          if (isCapacityEdit && targetResource) {
              const usage = targetResource.children 
                  ? targetResource.children.reduce((sum, child) => sum + (child.allocations[month]?.pt || 0), 0)
                  : 0;
              return {
                  capacity: proposedPt,
                  baseLoad: usage,
                  projectedTotal: usage,
                  isOverCapacity: usage > proposedPt 
              };
          } else {
              // Calculate Employee Load for Assignments in Projects View
              let employeeId = '';
              if (mode === 'add' && selectedSearchResult && selectedItemType === 'Employee') {
                   employeeId = selectedSearchResult.id;
              } else if (mode === 'edit' && targetResource) {
                   employeeId = targetResource.id.split('::')[0];
              }

              if (employeeId) {
                  // Find employee in source of truth (MOCK_PEOPLE)
                  const findEmployee = (nodes: Resource[]): Resource | null => {
                     for (const node of nodes) {
                         if (node.type === 'employee' && node.id === employeeId) return node;
                         if (node.children) {
                             const found = findEmployee(node.children);
                             if (found) return found;
                         }
                     }
                     return null;
                  };

                  const employeeNode = findEmployee(MOCK_PEOPLE);
                  
                  if (employeeNode) {
                       const alloc = employeeNode.allocations[month];
                       cap = alloc?.capacity || 20;
                       const totalLoad = employeeNode.children 
                          ? employeeNode.children.reduce((sum, c) => sum + (c.allocations[month]?.pt || 0), 0)
                          : 0;
                        
                       if (mode === 'edit' && parentResource) {
                           // Subtract current project assignment from load to get true base
                           const projectId = parentResource.id;
                           const projectChild = employeeNode.children?.find(c => c.id === projectId || c.id.startsWith(projectId + '::'));
                           const currentVal = projectChild?.allocations[month]?.pt || 0;
                           base = Math.max(0, totalLoad - currentVal);
                       } else {
                           base = totalLoad;
                       }
                  } else {
                      base = 0;
                  }
              }
          }
      }

      const total = base + (isCapacityEdit ? 0 : proposedPt);
      return { 
          capacity: cap, 
          baseLoad: base, 
          projectedTotal: total,
          isOverCapacity: total > (isCapacityEdit ? proposedPt : cap) 
      };
  };

  const capacityStats = useMemo(() => {
      // For single month / current view
      return getCapacityStatsForMonth(selectedMonth, ptValue);
  }, [viewMode, mode, targetResource, parentResource, selectedMonth, ptValue, isCapacityEdit, selectedSearchResult, selectedItemType]);

  const capacityStatsByMonth = useMemo(() => {
      const stats: Record<string, any> = {};
      selectedMonths.forEach(m => {
          stats[m] = getCapacityStatsForMonth(m, allocations[m] || 0);
      });
      return stats;
  }, [selectedMonths, allocations, viewMode, mode, targetResource, parentResource, isCapacityEdit, selectedSearchResult, selectedItemType]);


  // --- Actions ---

  const addMonth = (month: string) => {
      setSelectedMonths(prev => [...prev, month].sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b)));
      // Initialize new month allocation
      setAllocations(prev => ({...prev, [month]: 0}));
  };

  const removeMonth = (month: string) => {
      if (selectedMonths.length > 1) {
          setSelectedMonths(prev => prev.filter(m => m !== month));
          // cleanup allocation
          setAllocations(prev => {
              const next = {...prev};
              delete next[month];
              return next;
          });
      }
  };

  const handleAllocationChange = (month: string, val: number) => {
      const newVal = Math.max(0, val);
      setAllocations(prev => ({...prev, [month]: newVal}));
      
      // If single month, keep synced with ptValue
      if (selectedMonths.length === 1 && month === selectedMonths[0]) {
          setPtValue(newVal);
      }
  };

  const handleEditAssignment = (child: Resource) => {
      setTargetResource(child);
      setParentResource(listEmployee);
      setMode('edit');
      setInternalMode('form');
      setSearchTerm(child.name);
      
      // Determine correct item type for the form icon/context
      if (viewMode === 'Projects') {
          setSelectedItemType('Employee');
      } else {
          setSelectedItemType('Project');
      }

      // LOAD ALLOCATIONS FOR ALL SELECTED MONTHS
      const newAllocations: Record<string, number> = {};
      // If selectedMonths is empty (single select), use selectedMonth
      const monthsToLoad = selectedMonths.length > 0 ? selectedMonths : [selectedMonth];
      
      monthsToLoad.forEach(m => {
          newAllocations[m] = child.allocations[m]?.pt || 0;
      });
      setAllocations(newAllocations);
      
      // Fallback for single month view sync
      const currentMonthVal = newAllocations[selectedMonth] !== undefined ? newAllocations[selectedMonth] : (newAllocations[monthsToLoad[0]] || 0);
      setPtValue(currentMonthVal);

      setIsCapacityEdit(false);
      if (child.role) {
          setSelectedRole(child.role);
      }
  };
  
  const handleListDelete = (child: Resource) => {
      if (listEmployee) {
          // Pass all selected months to delete
          onDelete(child.id, listEmployee.id, selectedMonth, selectedMonths.length > 0 ? selectedMonths : undefined);
      }
  };

  const handleAddAssignment = () => {
      setParentResource(listEmployee);
      setTargetResource(null);
      setMode('add');
      setInternalMode('form');
      setSearchTerm('');
      setPtValue(0);
      
      // Initialize allocations for all selected months
      const initialAllocations: Record<string, number> = {};
      if (selectedMonths.length > 0) {
          selectedMonths.forEach(m => initialAllocations[m] = 0);
      } else {
          initialAllocations[selectedMonth] = 0;
      }
      setAllocations(initialAllocations);

      setSelectedItemType(viewMode === 'People' ? 'Project' : 'Employee');
      setIsCapacityEdit(false);
      setSelectedSearchResult(null);
  };

  const handleBackToList = () => {
      setInternalMode('list');
      if (listEmployee) {
           const monthsToCheck = selectedMonths.length > 0 ? selectedMonths : [selectedMonth];
           const activeAssignments = listEmployee.children?.filter(c => 
                monthsToCheck.some(m => (c.allocations[m]?.pt || 0) > 0)
           ) || [];
           setListAssignments(activeAssignments);
      }
  };

  const handleIncrement = () => {
      const step = 0.5;
      const nextVal = ptValue + step;
      if (isCapacityEdit) {
          setPtValue(nextVal);
          return;
      }
      if (viewMode === 'People') {
          if (capacityStats.baseLoad + nextVal <= capacityStats.capacity) {
              setPtValue(nextVal);
              handleAllocationChange(selectedMonth, nextVal);
          }
      } else {
         setPtValue(nextVal);
         handleAllocationChange(selectedMonth, nextVal);
      }
  };

  const handleSaveClick = () => {
    if (!targetResource && mode === 'edit') return;
    if (mode === 'add' && !parentResource) return;

    // Use allocations map for both single and multi modes
    const finalAllocations = { ...allocations };
    if (selectedMonths.length === 1) {
        finalAllocations[selectedMonths[0]] = ptValue;
    }

    const monthsToSave = selectedMonths.length > 0 ? selectedMonths : [selectedMonth];

    if (mode === 'edit') {
        monthsToSave.forEach(m => {
             onSave({
                mode: 'edit',
                resourceId: targetResource!.id,
                parentId: parentResource?.id,
                month: m,
                pt: finalAllocations[m] || 0,
                isCapacityEdit,
                role: selectedRole
            });
        });
        
    } else {
        if (!selectedSearchResult && !searchTerm) return; 
        
        const itemToAdd = selectedSearchResult || {
             id: `temp_${Date.now()}`,
             name: searchTerm,
             type: selectedItemType === 'Project' ? 'project' : 'employee', // Keep this lowercase for resourceHelpers match
             subtext: 'New Assignment'
        };

        const targetId = targetResource ? targetResource.id : parentResource!.id;

        monthsToSave.forEach(m => {
            onSave({
                mode: 'add',
                resourceId: targetId,
                parentId: targetId,
                month: m,
                pt: finalAllocations[m] || 0,
                newItem: itemToAdd,
                role: selectedRole
            });
        });
    }
  };

  const handleDeleteClick = () => {
      if (targetResource) {
          onDelete(targetResource.id, parentResource?.id, selectedMonth, selectedMonths);
      }
  };
  
  const handleUnassignClick = () => {
      if (targetResource && parentResource) {
          const allMonths = Object.keys(targetResource.allocations);
          onDelete(targetResource.id, parentResource.id, undefined, allMonths);
      }
  };

  return {
    state: {
      searchTerm, selectedItemType, isSearchOpen, ptValue, mode, selectedMonth, selectedMonths,
      targetResource, parentResource, selectedSearchResult, isCapacityEdit, selectedRole,
      internalMode, listAssignments, listEmployee, searchRef, filteredItems, capacityStats,
      allocations, capacityStatsByMonth
    },
    actions: {
      setSearchTerm, setSelectedItemType, setIsSearchOpen, setPtValue, setSelectedMonth, setSelectedRole,
      setSelectedSearchResult, setAllocations,
      handleEditAssignment, handleListDelete, handleAddAssignment, handleBackToList,
      handleIncrement, handleSaveClick, handleDeleteClick, handleUnassignClick,
      addMonth, removeMonth, handleAllocationChange
    }
  };
};