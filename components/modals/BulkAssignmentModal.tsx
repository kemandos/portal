import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, FolderOpen, ChevronDown, ChevronUp, Plus, Trash2, Users, Calendar } from 'lucide-react';
import { Resource } from '../../types';
import { MONTHS } from '../../constants';

interface BulkAssignmentModalProps {
  onClose: () => void;
  isOpen: boolean;
  selectedIds: string[];
  currentData: Resource[];
  initialMonths?: string[];
}

export const BulkAssignmentModal: React.FC<BulkAssignmentModalProps> = ({ onClose, isOpen, selectedIds, currentData, initialMonths }) => {
  const [activeMonths, setActiveMonths] = useState<string[]>(initialMonths && initialMonths.length > 0 ? initialMonths : [MONTHS[0], MONTHS[1]]);
  // Allocations in PT
  const [allocations, setAllocations] = useState<Record<string, Record<string, number>>>({});
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && initialMonths && initialMonths.length > 0) {
        setActiveMonths(initialMonths);
    } else if (isOpen && (!initialMonths || initialMonths.length === 0)) {
        setActiveMonths([MONTHS[0], MONTHS[1]]);
    }
  }, [isOpen, initialMonths]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
            setIsMonthPickerOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedEmployees = useMemo(() => {
    const employees: Resource[] = [];
    const traverse = (nodes: Resource[]) => {
        nodes.forEach(node => {
            if (selectedIds.includes(node.id) && node.type === 'employee') {
                employees.push(node);
            }
            if (node.children) traverse(node.children);
        });
    };
    traverse(currentData);
    return employees;
  }, [selectedIds, currentData]);

  const employeeCapacities = useMemo(() => {
      const caps: Record<string, number> = {};
      selectedEmployees.forEach(emp => {
          // Standard capacities in PT (roughly 20 days a month)
          const options = [15.0, 18.0, 20.0, 22.0];
          caps[emp.id] = options[Math.floor(Math.random() * options.length)];
      });
      return caps;
  }, [selectedEmployees]);

  useEffect(() => {
      setAllocations(prev => {
          const newAllocations = { ...prev };
          selectedEmployees.forEach(emp => {
              if (!newAllocations[emp.id]) newAllocations[emp.id] = {};
              activeMonths.forEach(m => {
                  if (newAllocations[emp.id][m] === undefined) {
                      newAllocations[emp.id][m] = 10.0; // Default 10 PT allocation
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
  };

  if (!isOpen) return null;

  const availableMonths = MONTHS.filter(m => !activeMonths.includes(m));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-4xl bg-[#FDFBF7]/90 backdrop-blur-2xl rounded-2xl shadow-glass border border-white/50 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 ease-spring">
        
        <div className="p-6 border-b border-gray-100/30 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/10">
               <Users size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Bulk Assignment</h3>
              <p className="text-xs text-slate-500">Assign multiple employees to a project</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 block">Project</label>
                <div className="relative group max-w-md">
                    <FolderOpen className="absolute left-3 top-3 text-gray-400" size={18} />
                    <select className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 rounded-lg text-sm font-medium text-slate-900 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-white/80 transition-colors outline-none backdrop-blur-sm">
                        <option>E-Commerce Platform Redesign</option>
                        <option>Internal HR Dashboard</option>
                        <option>Mobile App Migration</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 block">Select Months</label>
                <div className="flex flex-wrap items-center gap-3">
                    {activeMonths.map(month => (
                        <button 
                            key={month}
                            onClick={() => removeMonth(month)}
                            className="px-4 py-2 rounded-lg text-xs font-bold shadow-sm border border-primary bg-white/80 text-primary ring-1 ring-primary/20 hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:ring-red-100 transition-all flex items-center gap-2 group backdrop-blur-sm active:scale-95"
                        >
                            <Calendar size={14} />
                            {month}
                            <X size={12} className="opacity-50 group-hover:opacity-100" />
                        </button>
                    ))}
                    
                    <div className="relative" ref={monthPickerRef}>
                        <button 
                            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                            className={`h-9 px-3 rounded-lg border border-dashed flex items-center gap-2 transition-colors text-xs font-medium ${isMonthPickerOpen ? 'border-primary text-primary bg-primary/5' : 'border-gray-300 text-gray-400 hover:text-primary hover:border-primary'}`}
                        >
                            <Plus size={16} /> Add Month
                        </button>
                        
                        {isMonthPickerOpen && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-glass border border-white/50 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {availableMonths.length > 0 ? availableMonths.map(month => (
                                        <button
                                            key={month}
                                            onClick={() => addMonth(month)}
                                            className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50/50 transition-colors flex items-center justify-between group"
                                        >
                                            {month}
                                            <Plus size={12} className="text-slate-400 group-hover:text-primary transition-colors" />
                                        </button>
                                    )) : (
                                        <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                                            All months selected
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Allocations</label>
                    <span className="text-[10px] text-slate-500 bg-gray-100/50 px-2 py-0.5 rounded-full border border-gray-200/50 font-medium">Step: 0.5 PT</span>
                </div>
                
                <div className="border border-white/60 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white/30 backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <div className="min-w-max">
                            <div className="flex items-center bg-white/40 border-b border-white/50 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                                <div className="w-[200px] shrink-0">Employee</div>
                                {activeMonths.map(month => (
                                    <div key={month} className="w-32 shrink-0 text-center">{month}</div>
                                ))}
                                <div className="w-10 shrink-0"></div>
                            </div>

                            {selectedEmployees.length ===0 && (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    No employees selected. Select employees from the grid first.
                                </div>
                            )}

                            {selectedEmployees.map((employee) => (
                                <div key={employee.id} className="flex items-center px-4 py-3 border-b border-gray-100/30 hover:bg-white/40 transition-colors group">
                                    <div className="w-[200px] shrink-0 flex items-center gap-3">
                                        <div className="size-9 rounded-full bg-white/50 border border-white/60 shrink-0 overflow-hidden shadow-sm">
                                            <img src={employee.avatar || `https://i.pravatar.cc/150?u=${employee.id}`} alt={employee.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="truncate pr-2 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{employee.name}</p>
                                            <p className="text-[11px] text-slate-500 truncate">{employee.subtext || 'Senior Dev'}</p>
                                        </div>
                                    </div>
                                    
                                    {activeMonths.map((month) => {
                                        const val = allocations[employee.id]?.[month] ?? 0;
                                        const max = employeeCapacities[employee.id] || 20.0;
                                        const total = val; 
                                        const isOver = total > max;

                                        return (
                                            <div key={month} className="w-32 shrink-0 flex flex-col justify-center items-center gap-1 px-1">
                                                <div className="flex items-center bg-white/60 border border-white/60 rounded-lg shadow-sm h-10 w-24 overflow-hidden group-hover:border-primary/30 transition-colors">
                                                    <div className="flex-1 h-full flex items-center justify-center text-sm font-bold text-slate-900 bg-transparent pl-2">
                                                        {val.toFixed(1)}
                                                    </div>
                                                    <div className="flex flex-col border-l border-gray-100/50 w-8 h-full bg-slate-50/30">
                                                        <button 
                                                            onClick={() => handleAllocationChange(employee.id, month, 0.5)}
                                                            className="flex-1 flex items-center justify-center hover:bg-white/80 text-slate-500 hover:text-primary transition-colors border-b border-gray-200/50 active:bg-slate-100"
                                                        >
                                                            <ChevronUp size={12} strokeWidth={3} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAllocationChange(employee.id, month, -0.5)}
                                                            className="flex-1 flex items-center justify-center hover:bg-white/80 text-slate-500 hover:text-primary transition-colors disabled:opacity-30 disabled:hover:bg-transparent active:bg-slate-100"
                                                            disabled={val <= 0}
                                                        >
                                                            <ChevronDown size={12} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-semibold ${isOver ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {total.toFixed(1)} / {max.toFixed(1)} PT
                                                </span>
                                            </div>
                                        );
                                    })}

                                    <div className="w-10 shrink-0 flex justify-end">
                                        <button className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-50">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="px-4 py-3 bg-white/30 sticky left-0 border-t border-white/50 backdrop-blur-sm">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                className="w-full pl-10 pr-4 py-2 text-sm bg-white/50 border border-white/60 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder-gray-400 transition-colors shadow-sm text-slate-900 outline-none backdrop-blur-sm" 
                                placeholder="Search employees to add..." 
                                type="text"
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div className="p-4 bg-white/40 border-t border-white/50 flex justify-between items-center shrink-0 backdrop-blur-md">
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Total Added:</span>
                <span className="text-sm font-bold text-slate-900">
                    {Object.values(allocations).reduce((sum, empAlloc) => 
                        sum + Object.values(empAlloc).reduce((a, b) => a + b, 0)
                    , 0).toFixed(1)} PT
                </span>
            </div>
            <div className="flex gap-3">
                <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-white/50 rounded-lg transition-colors active:scale-95">
                    Cancel
                </button>
                <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-lg shadow-lg shadow-primary/30 hover:bg-primary-hover hover:shadow-primary/40 transition-all transform active:scale-95">
                    Apply Assignment
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};