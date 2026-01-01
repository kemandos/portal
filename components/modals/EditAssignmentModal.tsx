import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, Minus, Plus, Trash2, CheckCircle, Briefcase, User, Calendar, Edit2, ArrowLeft } from 'lucide-react';
import { MOCK_PROJECTS, MOCK_PEOPLE, MONTHS } from '../../constants';
import { Resource } from '../../types';

interface EditAssignmentModalProps {
  onClose: () => void;
  isOpen: boolean;
  initialData?: { resourceId?: string; month?: string; months?: string[]; isAddMode?: boolean };
  viewMode: 'People' | 'Projects';
  currentData: Resource[];
  onSave: (data: { mode: 'edit' | 'add', resourceId: string, parentId?: string, month: string, months?: string[], pt: number, newItem?: any, isCapacityEdit?: boolean }) => void;
  onDelete: (resourceId: string, parentId?: string, month?: string, months?: string[]) => void;
}

export const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({ onClose, isOpen, initialData, viewMode, currentData, onSave, onDelete }) => {
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
  
  // New State for List View
  const [internalMode, setInternalMode] = useState<'list' | 'form'>('form');
  const [listAssignments, setListAssignments] = useState<Resource[]>([]);
  const [listEmployee, setListEmployee] = useState<Resource | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  // Combine Projects and People for search
  const searchableItems = useMemo(() => {
    const list: { id: string, name: string, subtext: string, type: 'Project' | 'Employee', avatar?: string }[] = [];
    
    // Traverse Projects
    const traverseProjects = (nodes: any[]) => {
        nodes.forEach(node => {
            if (node.type === 'project') {
                const isFolder = node.children && node.children.some((c: any) => c.type === 'project');
                if (!isFolder) {
                    list.push({ id: node.id, name: node.name, subtext: node.subtext, type: 'Project' });
                }
            }
            if (node.children) traverseProjects(node.children);
        });
    };
    traverseProjects(MOCK_PROJECTS);

    // Traverse People
    const traversePeople = (nodes: any[]) => {
        nodes.forEach(node => {
            if (node.type === 'employee') {
                list.push({ id: node.id, name: node.name, subtext: node.subtext, type: 'Employee', avatar: node.avatar });
            }
            if (node.children) traversePeople(node.children);
        });
    };
    traversePeople(MOCK_PEOPLE);

    return Array.from(new Map(list.map(item => [item.id, item])).values());
  }, []);

  const filteredItems = searchableItems.filter(p => 
    p.type === selectedItemType && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determine context and pre-fill data when modal opens
  useEffect(() => {
    if (isOpen && initialData) {
        const dataset = currentData;
        const initialMonth = initialData.month || MONTHS[0];
        
        // Handle Multiple Months
        if (initialData.months && initialData.months.length > 1) {
            setSelectedMonths(initialData.months);
            setSelectedMonth(initialData.months[0]); // Primary month for reference
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
            
            // Handle List View Logic for Employee in People View
            // If multiple months are selected, skip List View and go straight to Add Form (Bulk Add to Employee)
            const isMultiMonth = initialData.months && initialData.months.length > 1;

            if (!isMultiMonth && viewMode === 'People' && res.type === 'employee' && !initialData.isAddMode) {
                 // Gather assignments for this month
                 const activeAssignments = res.children?.filter(c => (c.allocations[initialMonth]?.pt || 0) > 0) || [];
                 if (activeAssignments.length > 0) {
                     setInternalMode('list');
                     setListAssignments(activeAssignments);
                     setListEmployee(res);
                     setMode('edit'); // Just to allow rendering list wrapper
                     setSearchTerm(''); // Clear search term to prevent bleed over
                     return;
                 } else {
                     // No assignments, default to adding one
                     setInternalMode('form');
                     setMode('add');
                     setParentResource(res); // Add to this employee
                     setTargetResource(null);
                     setSelectedItemType('Project');
                     setPtValue(0);
                     setSearchTerm('');
                     setSelectedSearchResult(null);
                     return;
                 }
            } else if (isMultiMonth && viewMode === 'People' && res.type === 'employee') {
                 // Bulk Add/Edit for Employee Root -> Default to Add mode for multiple months
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

            // Normal Form Logic
            setInternalMode('form');

            // Check for explicit add mode from UI action (e.g. clicking + on Project)
            if (initialData.isAddMode) {
                 setMode('add');
                 setSearchTerm('');
                 setPtValue(0);
                 setSelectedSearchResult(null);
                 setIsCapacityEdit(false);
                 
                 // If we are in Projects view and adding to a Project, we search for Employees
                 if (viewMode === 'Projects' && res.type === 'project') {
                     setSelectedItemType('Employee');
                     setParentResource(res); // The clicked resource is the parent
                 } else {
                     setSelectedItemType(viewMode === 'People' ? 'Project' : 'Employee');
                 }
                 return;
            }

            // Normal cell click logic for Projects View or Child Cells
            if (viewMode === 'Projects' && res.type === 'project' && foundDepth > 0) {
                 // Clicking a Project Cell in Projects View -> Edit Capacity/Budget
                 setMode('edit');
                 setIsCapacityEdit(true);
                 setSearchTerm(res.name);
                 const allocation = res.allocations[initialMonth];
                 // For capacity edit, we edit the capacity property
                 setPtValue(allocation ? allocation.capacity : 0);
            } else if (foundDepth === 2 || (foundDepth === 1 && viewMode === 'People' && parentResource?.type === 'employee')) {
                // Child Row (Assignment)
                setMode('edit');
                setIsCapacityEdit(false);
                setSearchTerm(res.name);
                setSelectedItemType(res.type === 'project' ? 'Project' : 'Employee');
                const allocation = res.allocations[initialMonth];
                setPtValue(allocation ? allocation.pt : 0);
            } else {
                // Root row other cases -> Add Assignment
                setMode('add');
                setIsCapacityEdit(false);
                setSearchTerm(''); 
                setPtValue(0);
                setSelectedSearchResult(null);
                
                if (viewMode === 'People') {
                    setSelectedItemType('Project');
                } else {
                    setSelectedItemType('Employee');
                }
            }
        }
    }
  }, [isOpen, initialData, viewMode, currentData]);

  // Handle switching from List to Edit Form
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
  };

  // Handle switching from List to Add Form
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
      // Refresh list assignments (in a real app, you might re-fetch or rely on updated props, for now simplistic)
      if (listEmployee) {
           const activeAssignments = listEmployee.children?.filter(c => (c.allocations[selectedMonth]?.pt || 0) > 0) || [];
           setListAssignments(activeAssignments);
      }
  };

  // Derived state to find the relevant child resource based on mode and selection
  const existingChild = useMemo(() => {
    if (mode === 'edit') return targetResource;
    if (mode === 'add' && parentResource && selectedSearchResult) {
         const childId = selectedSearchResult.id;
         // Match composite ID logic
         return parentResource.children?.find(c => c.id === childId || c.id.startsWith(`${childId}::`));
    }
    return null;
  }, [mode, targetResource, parentResource, selectedSearchResult]);

  // Update PT Value when selected month changes OR when the derived existing child changes
  useEffect(() => {
    if (isCapacityEdit && targetResource) {
          const allocation = targetResource.allocations[selectedMonth];
          setPtValue(allocation ? allocation.capacity : 0);
          return;
    }

    if (existingChild) {
        const allocation = existingChild.allocations[selectedMonth];
        setPtValue(allocation ? allocation.pt : 0);
    } else if (mode === 'add') {
        setPtValue(0);
    }
    
    // Update List if in list mode and month changes
    if (internalMode === 'list' && listEmployee) {
        const activeAssignments = listEmployee.children?.filter(c => (c.allocations[selectedMonth]?.pt || 0) > 0) || [];
        setListAssignments(activeAssignments);
    }
  }, [selectedMonth, existingChild, isCapacityEdit, targetResource, mode, internalMode, listEmployee]);

  // Stats Calculation for Capacity Logic
  const { capacity, baseLoad, projectedTotal, isOverCapacity } = useMemo(() => {
      let cap = 20;
      let base = 0;
      
      if (viewMode === 'People') {
          const employee = mode === 'add' ? targetResource : parentResource;
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
             // Add/Edit Employee on Project
             // User Request: "i only want to see the assigned pts for this project"
             // This implies we hide the base load of other employees for this visualization
             const projAlloc = parentResource.allocations[selectedMonth];
             cap = projAlloc?.capacity || 0;
             base = 0; // Force base to 0 to visualize only current assignment against total capacity
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            setIsSearchOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleIncrement = () => {
      const step = 0.5;
      const nextVal = ptValue + step;
      if (isCapacityEdit) {
          setPtValue(nextVal);
          return;
      }
      if (viewMode === 'People') {
          if (baseLoad + nextVal <= capacity) {
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
            isCapacityEdit
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
            newItem: itemToAdd
        });
    }
  };

  const handleDeleteClick = () => {
      if (targetResource) {
          onDelete(targetResource.id, parentResource?.id, selectedMonth, selectedMonths);
      }
  };

  if (!isOpen) return null;

  const dynamicLabel = viewMode === 'People' ? 'Project' : 'Employee';
  const showCapacityBar = true; 
  const isMultiMonth = selectedMonths.length > 1;

  const getTitle = () => {
      if (internalMode === 'list') return `Assignments: ${selectedMonth}`;
      if (isMultiMonth) return `Bulk Edit: ${selectedMonths.length} Months`;
      if (isCapacityEdit) return 'Edit Monthly Budget';
      if (mode === 'add') return `Add ${dynamicLabel}`;
      return 'Edit Assignment';
  };

  const getSubTitle = () => {
      if (internalMode === 'list' && listEmployee) return listEmployee.name;
      if (isCapacityEdit && targetResource) return `Project: ${targetResource.name}`;
      if (mode === 'edit' && parentResource) return `Project: ${parentResource.name}`;
      if (mode === 'add' && parentResource) return `To: ${parentResource.name}`;
      return '---';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 ease-spring">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
             {internalMode === 'form' && listEmployee && (
                 <button onClick={handleBackToList} className="p-1 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
                     <ArrowLeft size={20} className="text-slate-500" />
                 </button>
             )}
            <div>
                <h2 className="text-lg font-bold text-slate-900">{getTitle()}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{getSubTitle()}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* LIST VIEW */}
        {internalMode === 'list' && (
            <>
                <div className="p-6 overflow-y-auto space-y-4 min-h-[300px]">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-900 block">Select Month</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all appearance-none cursor-pointer hover:bg-slate-100"
                            >
                                {MONTHS.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-gray-300 pl-4 text-xs font-bold text-slate-500">
                                2024
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-900 block">Assigned Projects</label>
                        {listAssignments.length === 0 ? (
                            <div className="p-4 rounded-xl border border-dashed border-gray-300 text-center text-sm text-slate-500 italic bg-slate-50">
                                No assignments for {selectedMonth}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {listAssignments.map(assignment => (
                                    <div key={assignment.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                                        <div className="flex items-center gap-3">
                                             <div className="size-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-primary shadow-sm">
                                                 <Briefcase size={16} />
                                             </div>
                                             <div>
                                                 <div className="text-sm font-bold text-slate-900">{assignment.name}</div>
                                                 <div className="text-xs text-slate-500">{assignment.allocations[selectedMonth]?.pt.toFixed(1)} PT</div>
                                             </div>
                                        </div>
                                        <button 
                                            onClick={() => handleEditAssignment(assignment)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-white transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 flex justify-end">
                     <button 
                        onClick={handleAddAssignment}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-lg shadow-primary/30 transition-all flex items-center gap-2 active:scale-95"
                     >
                        <Plus size={18} />
                        Add Assignment
                     </button>
                </div>
            </>
        )}

        {/* FORM VIEW */}
        {internalMode === 'form' && (
            <>
                <div className="p-6 overflow-y-auto space-y-6 min-h-[300px]">
                
                <div className="space-y-2 relative" ref={searchRef}>
                    <label className="text-sm font-semibold text-slate-900">{isCapacityEdit ? 'Project Name' : dynamicLabel}</label>
                    <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        className={`w-full pl-10 pr-24 py-3 border border-gray-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm ${mode === 'edit' ? 'bg-gray-50 text-slate-500 cursor-not-allowed' : 'bg-slate-50'}`}
                        value={searchTerm}
                        onChange={(e) => {
                            if (mode === 'add') {
                                setSearchTerm(e.target.value);
                                setIsSearchOpen(true);
                            }
                        }}
                        onFocus={() => {
                            if (mode === 'add') setIsSearchOpen(true);
                        }}
                        disabled={mode === 'edit'}
                        placeholder={`Search for a ${dynamicLabel.toLowerCase()}...`}
                    />
                    {!isCapacityEdit && (
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded border shadow-sm pointer-events-none transition-colors
                            ${selectedItemType === 'Project' ? 'text-primary bg-primary/5 border-primary/20' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}>
                            {selectedItemType}
                        </span>
                    )}
                    </div>

                    {isSearchOpen && mode === 'add' && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                            {filteredItems.length > 0 ? (
                                filteredItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setSearchTerm(item.name);
                                            setSelectedItemType(item.type);
                                            setSelectedSearchResult(item);
                                            setIsSearchOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-gray-50 last:border-0 transition-colors group flex items-center gap-3"
                                    >
                                        <div className={`p-1.5 rounded-lg shrink-0 transition-colors 
                                            ${item.type === 'Project' 
                                                ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' 
                                                : 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                                            {item.type === 'Project' ? <Briefcase size={16} /> : <User size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-slate-900 truncate">{item.name}</div>
                                            <div className="text-xs text-slate-500 truncate">{item.subtext || item.type}</div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-xs text-slate-400 text-center italic">
                                    No {selectedItemType === 'Project' ? 'projects' : 'employees'} found
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900 block">Select Month</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                        {isMultiMonth ? (
                            <div className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-900 cursor-not-allowed">
                                {selectedMonths.join(', ')}
                            </div>
                        ) : (
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all appearance-none cursor-pointer hover:bg-slate-100"
                            >
                                {MONTHS.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        )}
                        {!isMultiMonth && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-gray-300 pl-4 text-xs font-bold text-slate-500">
                                2024
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900 block truncate">
                        {isCapacityEdit ? 'Monthly Budget' : 'PT Assignment'} <span className="text-xs font-normal text-slate-400 ml-1">(Step 0.5 PT)</span>
                    </label>
                    <div className="flex items-center h-12">
                        <button 
                        onClick={() => setPtValue(prev => Math.max(0, prev - 0.5))}
                        className="w-12 h-full flex items-center justify-center bg-slate-50 border border-gray-200 rounded-l-xl hover:bg-white active:bg-slate-100 transition-colors text-slate-600 active:scale-95"
                        >
                        <Minus size={18} />
                        </button>
                        <div className="h-full flex-1 border-y border-gray-200 flex items-center justify-center bg-white text-lg font-bold text-slate-900">
                        {ptValue.toFixed(1)} PT
                        </div>
                        <button 
                        onClick={handleIncrement}
                        disabled={!isCapacityEdit && (viewMode === 'People' ? projectedTotal >= capacity : ptValue >= 20)}
                        className="w-12 h-full flex items-center justify-center bg-slate-50 border border-gray-200 rounded-r-xl hover:bg-white active:bg-slate-100 transition-colors text-slate-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-50"
                        >
                        <Plus size={18} />
                        </button>
                    </div>
                    </div>

                    <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900 block">{isCapacityEdit ? 'Budget Utilization' : 'Current Load'} <span className="text-slate-400 font-normal">({selectedMonth})</span></label>
                    <div className="px-4 bg-slate-50 rounded-xl border border-gray-200 flex flex-col justify-center h-12 gap-1">
                        <div className="flex justify-between text-[10px] font-medium text-slate-500">
                        {isCapacityEdit ? (
                            <span>Usage: {projectedTotal.toFixed(1)} / {ptValue.toFixed(1)} PT</span>
                        ) : showCapacityBar ? (
                            <span>Total: {projectedTotal.toFixed(1)} / {capacity.toFixed(1)} PT</span>
                        ) : (
                            <span>Assignment: {ptValue.toFixed(1)} PT</span>
                        )}
                        <span className={`${isOverCapacity ? 'text-red-500' : 'text-emerald-600'} font-bold`}>
                            {isOverCapacity ? (isCapacityEdit ? 'Over Budget' : 'Over Capacity') : 'Available'}
                        </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full shadow-sm transition-all duration-500 ${isOverCapacity ? 'bg-red-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, (isCapacityEdit ? (projectedTotal / (ptValue || 1)) : (projectedTotal / (capacity || 1))) * 100)}%` }}
                        ></div>
                        </div>
                    </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900">Notes</label>
                    <textarea 
                    className="w-full p-4 bg-slate-50 border border-gray-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none shadow-sm"
                    rows={3}
                    placeholder="Add details about this assignment (optional)..."
                    defaultValue={mode === 'edit' ? "Frontend development focus for the Q3 sprint cycle." : ""}
                    />
                </div>

                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between">
                {mode === 'edit' && !isCapacityEdit && (
                    <button 
                        onClick={handleDeleteClick}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                    >
                        <Trash2 size={18} />
                        <span>Delete</span>
                    </button>
                )}
                {mode === 'edit' && isCapacityEdit && (
                    <div></div>
                )}

                <div className={`flex gap-3 ${mode === 'add' ? 'w-full justify-end' : ''}`}>
                    <button 
                    onClick={onClose}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                    Cancel
                    </button>
                    <button 
                    onClick={handleSaveClick}
                    disabled={isOverCapacity && viewMode === 'People'}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-lg shadow-primary/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                    <CheckCircle size={18} />
                    {mode === 'edit' ? (isMultiMonth ? 'Save All' : 'Save Changes') : (mode === 'add' ? 'Add Assignment' : 'Create')}
                    </button>
                </div>
                </div>
            </>
        )}

      </div>
    </div>
  );
};