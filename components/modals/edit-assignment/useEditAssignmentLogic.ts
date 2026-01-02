import { useState, useRef, useMemo, useEffect } from 'react';
import { MONTHS, MOCK_PEOPLE, MOCK_PROJECTS } from '../../../constants';
import { Resource } from '../../../types';
import { getSearchableItems } from '../../../utils/resourceHelpers';

interface UseEditAssignmentLogicProps {
  isOpen: boolean;
  initialData?: { resourceId?: string; month?: string; months?: string[]; isAddMode?: boolean };
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

  // List View State
  const [internalMode, setInternalMode] = useState<'list' | 'form'>('form');
  const [listAssignments, setListAssignments] = useState<Resource[]>([]);
  const [listEmployee, setListEmployee] = useState<Resource | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  // --- Logic Helpers ---

  const getRoleForEmployee = (emp: Resource | any) => {
    const title = (emp.subtext || '').toLowerCase();
    const dept = emp.department || '';
    
    // Explicit Managing Consultant Detection -> Defaults to Project Manager (overrides department)
    if (title.includes('managing consultant') || /\bmc\b/.test(title)) {
        return 'Project Manager';
    }

    // Department Based Defaults
    if (dept === 'Engineering') return 'Engineer';
    if (dept === 'Reporting') return 'Analyst';
    if (dept === 'Project Management') return 'Project Manager';
    
    // Leadership roles default to Project Manager if not caught above
    const isLeadership = title.includes('director') || 
                 title.includes('vp') || 
                 title.includes('head');

    if (isLeadership) return 'Project Manager';

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
    }
  }, [isOpen]);

  // Initialization Logic
  useEffect(() => {
    if (isOpen && initialData) {
        const dataset = currentData;
        const initialMonth = initialData.month || MONTHS[0];
        
        if (initialData.months && initialData.months.length > 1) {
            setSelectedMonths(initialData.months);
            setSelectedMonth(initialData.months[0]);
        } else {
            setSelectedMonths([]);
            setSelectedMonth(initialMonth);
        }

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
            
            const isMultiMonth = initialData.months && initialData.months.length > 1;

            // Logic to switch to List View if clicking a parent with existing assignments
            if (!isMultiMonth && viewMode === 'People' && res.type === 'employee' && !initialData.isAddMode) {
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
                 setSearchTerm('');
                 setSelectedSearchResult(null);
                 return;
            }

            setInternalMode('form');

            if (initialData.isAddMode) {
                 setMode('add');
                 setSearchTerm('');
                 setPtValue(0);
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

            if (viewMode === 'Projects' && res.type === 'project' && foundDepth > 0) {
                 setMode('edit');
                 setIsCapacityEdit(true);
                 setSearchTerm(res.name);
                 const allocation = res.allocations[initialMonth];
                 setPtValue(allocation ? allocation.capacity : 0);
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
                    // Try to match subtext to one of our roles, otherwise default
                    const sub = res.subtext;
                    if (['Engineer', 'Analyst', 'Project Manager', 'Project Lead'].includes(sub)) {
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
        setPtValue(0);
    }
    
    if (internalMode === 'list' && listEmployee) {
        const activeAssignments = listEmployee.children?.filter(c => (c.allocations[selectedMonth]?.pt || 0) > 0) || [];
        setListAssignments(activeAssignments);
    }
  }, [selectedMonth, existingChild, isCapacityEdit, targetResource, mode, internalMode, listEmployee]);

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

  const capacityStats = useMemo(() => {
      let cap = 20;
      let base = 0;
      
      if (viewMode === 'People') {
          const employee = parentResource || targetResource;
          if (employee) {
              const alloc = employee.allocations[selectedMonth];
              cap = alloc?.capacity || 20;
              const currentTotal = employee.children 
                  ? employee.children.reduce((sum, child) => sum + (child.allocations[selectedMonth]?.pt || 0), 0)
                  : (alloc?.pt || 0);
              
              if (mode === 'edit' && targetResource && !isCapacityEdit) {
                   const assignAlloc = targetResource.allocations[selectedMonth];
                   base = Math.max(0, currentTotal - (assignAlloc?.pt || 0));
              } else {
                   base = currentTotal;
              }
          }
      } else if (viewMode === 'Projects') {
          if (isCapacityEdit && targetResource) {
              const usage = targetResource.children 
                  ? targetResource.children.reduce((sum, child) => sum + (child.allocations[selectedMonth]?.pt || 0), 0)
                  : 0;
              return {
                  capacity: ptValue,
                  baseLoad: usage,
                  projectedTotal: usage,
                  isOverCapacity: usage > ptValue 
              };
          } else if (parentResource) {
             const projAlloc = parentResource.allocations[selectedMonth];
             cap = projAlloc?.capacity || 0;
             base = 0; 
          }
      }

      const total = base + (isCapacityEdit ? 0 : ptValue);
      return { 
          capacity: cap, 
          baseLoad: base, 
          projectedTotal: total,
          isOverCapacity: total > (isCapacityEdit ? ptValue : cap) 
      };
  }, [viewMode, mode, targetResource, parentResource, selectedMonth, ptValue, isCapacityEdit]);


  // --- Actions ---

  const handleEditAssignment = (child: Resource) => {
      setTargetResource(child);
      setParentResource(listEmployee);
      setMode('edit');
      setInternalMode('form');
      setSearchTerm(child.name);
      setSelectedItemType('Project');
      const allocation = child.allocations[selectedMonth];
      setPtValue(allocation ? allocation.pt : 0);
      setIsCapacityEdit(false);
      if (child.role) {
          setSelectedRole(child.role);
      }
  };
  
  const handleListDelete = (child: Resource) => {
      if (listEmployee) {
          onDelete(child.id, listEmployee.id, selectedMonth);
      }
  };

  const handleAddAssignment = () => {
      setParentResource(listEmployee);
      setTargetResource(null);
      setMode('add');
      setInternalMode('form');
      setSearchTerm('');
      setPtValue(0);
      setSelectedItemType('Project');
      setIsCapacityEdit(false);
      setSelectedSearchResult(null);
  };

  const handleBackToList = () => {
      setInternalMode('list');
      if (listEmployee) {
           const activeAssignments = listEmployee.children?.filter(c => (c.allocations[selectedMonth]?.pt || 0) > 0) || [];
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
          }
      } else {
         setPtValue(nextVal);
      }
  };

  const handleSaveClick = () => {
    if (!targetResource && mode === 'edit') return;
    if (mode === 'add' && !parentResource) return;

    if (mode === 'edit') {
        onSave({
            mode: 'edit',
            resourceId: targetResource!.id,
            parentId: parentResource?.id,
            month: selectedMonth,
            months: selectedMonths.length > 0 ? selectedMonths : undefined,
            pt: ptValue,
            isCapacityEdit,
            role: selectedRole
        });
    } else {
        if (!selectedSearchResult && !searchTerm) return; 
        
        const itemToAdd = selectedSearchResult || {
             id: `temp_${Date.now()}`,
             name: searchTerm,
             type: selectedItemType === 'Project' ? 'project' : 'employee',
             subtext: 'New Assignment'
        };

        const targetId = targetResource ? targetResource.id : parentResource!.id;

        onSave({
            mode: 'add',
            resourceId: targetId,
            parentId: targetId,
            month: selectedMonth,
            months: selectedMonths.length > 0 ? selectedMonths : undefined,
            pt: ptValue,
            newItem: itemToAdd,
            role: selectedRole
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
      internalMode, listAssignments, listEmployee, searchRef, filteredItems, capacityStats
    },
    actions: {
      setSearchTerm, setSelectedItemType, setIsSearchOpen, setPtValue, setSelectedMonth, setSelectedRole,
      setSelectedSearchResult,
      handleEditAssignment, handleListDelete, handleAddAssignment, handleBackToList,
      handleIncrement, handleSaveClick, handleDeleteClick, handleUnassignClick
    }
  };
};