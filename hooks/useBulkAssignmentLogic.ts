import { useState, useMemo, useEffect, useRef } from 'react';
import { Resource } from '../types';
import { MONTHS } from '../constants';

export const useBulkAssignmentLogic = (
  isOpen: boolean,
  selectedIds: string[],
  currentData: Resource[],
  initialMonths?: string[]
) => {
  const [activeMonths, setActiveMonths] = useState<string[]>([]);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, Record<string, number>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        setLocalSelectedIds(selectedIds);
        setActiveMonths(initialMonths && initialMonths.length > 0 ? initialMonths : [MONTHS[0], MONTHS[1]]);
        setSearchTerm('');
    }
  }, [isOpen, selectedIds, initialMonths]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
            setIsMonthPickerOpen(false);
        }
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            setIsSearchOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Flatten all employees from data for search
  const allEmployees = useMemo(() => {
    const employees: Resource[] = [];
    const traverse = (nodes: Resource[]) => {
        nodes.forEach(node => {
            if (node.type === 'employee') {
                employees.push(node);
            }
            if (node.children) traverse(node.children);
        });
    };
    traverse(currentData);
    // Return unique employees
    return Array.from(new Map(employees.map(item => [item.id, item])).values());
  }, [currentData]);

  const selectedEmployees = useMemo(() => {
    return allEmployees.filter(emp => localSelectedIds.includes(emp.id));
  }, [allEmployees, localSelectedIds]);

  const searchResults = useMemo(() => {
      if (!searchTerm.trim()) return [];
      const lowerTerm = searchTerm.toLowerCase();
      return allEmployees.filter(emp => 
          !localSelectedIds.includes(emp.id) && 
          (emp.name.toLowerCase().includes(lowerTerm) || (emp.subtext && emp.subtext.toLowerCase().includes(lowerTerm)))
      );
  }, [allEmployees, localSelectedIds, searchTerm]);

  // Initialize allocations for selected employees and months
  useEffect(() => {
      setAllocations(prev => {
          const newAllocations = { ...prev };
          selectedEmployees.forEach(emp => {
              if (!newAllocations[emp.id]) newAllocations[emp.id] = {};
              activeMonths.forEach(m => {
                  if (newAllocations[emp.id][m] === undefined) {
                      newAllocations[emp.id][m] = 0.0; // Default to 0 PT allocation for new assignment
                  }
              });
          });
          return newAllocations;
      });
  }, [selectedEmployees, activeMonths]);

  const handleAllocationChange = (empId: string, month: string, delta: number) => {
      setAllocations(prev => {
          const currentVal = prev[empId]?.[month] ?? 0;
          const newVal = Math.max(0, currentVal + delta);
          const rounded = Math.round(newVal * 2) / 2;
          
          return {
              ...prev,
              [empId]: {
                  ...prev[empId],
                  [month]: rounded
              }
          };
      });
  };

  const removeMonth = (month: string) => {
      setActiveMonths(prev => prev.filter(m => m !== month));
  };

  const addMonth = (month: string) => {
      setActiveMonths(prev => {
          const newMonths = [...prev, month];
          return newMonths.sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
      });
      setIsMonthPickerOpen(false);
  };

  const handleAddEmployee = (employeeId: string) => {
      setLocalSelectedIds(prev => [...prev, employeeId]);
      setSearchTerm('');
      setIsSearchOpen(false);
  };

  const handleRemoveEmployee = (employeeId: string) => {
      setLocalSelectedIds(prev => prev.filter(id => id !== employeeId));
  };

  // Recalculate total
  const visibleTotal = useMemo(() => {
      return selectedEmployees.reduce((sum, emp) => {
          const empAlloc = allocations[emp.id];
          if (!empAlloc) return sum;
          return sum + activeMonths.reduce((mSum, m) => mSum + (empAlloc[m] || 0), 0);
      }, 0);
  }, [selectedEmployees, allocations, activeMonths]);

  const availableMonths = useMemo(() => 
    MONTHS.filter(m => !activeMonths.includes(m)), 
  [activeMonths]);

  return {
    state: {
        activeMonths,
        localSelectedIds,
        allocations,
        searchTerm,
        isSearchOpen,
        isMonthPickerOpen,
        selectedEmployees,
        searchResults,
        availableMonths,
        visibleTotal,
        searchRef,
        monthPickerRef
    },
    actions: {
        setSearchTerm,
        setIsSearchOpen,
        setIsMonthPickerOpen,
        handleAllocationChange,
        removeMonth,
        addMonth,
        handleAddEmployee,
        handleRemoveEmployee
    }
  };
};