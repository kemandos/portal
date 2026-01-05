import React from 'react';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Resource } from '../../../types';

interface BulkAllocationTableProps {
  selectedEmployees: Resource[];
  activeMonths: string[];
  allocations: Record<string, Record<string, number>>;
  employeeRoles: Record<string, string>;
  handleAllocationChange: (empId: string, month: string, delta: number) => void;
  handleRemoveEmployee: (empId: string) => void;
  handleRoleChange: (empId: string, role: string) => void;
}

export const BulkAllocationTable: React.FC<BulkAllocationTableProps> = ({
  selectedEmployees,
  activeMonths,
  allocations,
  employeeRoles,
  handleAllocationChange,
  handleRemoveEmployee,
  handleRoleChange
}) => {
  return (
    <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-max">
                {/* Header Row */}
            <div className="flex items-center bg-slate-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                <div className="w-[180px] shrink-0">Employee</div>
                <div className="w-[140px] shrink-0">Role</div>
                {activeMonths.map(month => (
                    <div key={month} className="w-32 shrink-0 text-center">{month}</div>
                ))}
                <div className="w-10 shrink-0"></div>
            </div>

            {selectedEmployees.length === 0 && (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No employees selected. Search to add employees.
                </div>
            )}

            {selectedEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <div className="w-[180px] shrink-0 flex items-center gap-3">
                        <div className="size-9 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shrink-0 overflow-hidden shadow-sm">
                            <img src={employee.avatar || `https://i.pravatar.cc/150?u=${employee.id}`} alt={employee.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="truncate pr-2 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{employee.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{employee.subtext || 'Senior Dev'}</p>
                        </div>
                    </div>

                    <div className="w-[140px] shrink-0 pr-4">
                        <select 
                            value={employeeRoles[employee.id] || 'Engineer'}
                            onChange={(e) => handleRoleChange(employee.id, e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                        >
                            <option value="Engineer">Engineer</option>
                            <option value="Senior Engineer">Senior Engineer</option>
                            <option value="Analyst">Analyst</option>
                            <option value="Project Manager">Project Manager</option>
                            <option value="Project Lead">Project Lead</option>
                            <option value="Managing Consultant">Managing Consultant</option>
                        </select>
                    </div>
                    
                    {activeMonths.map((month) => {
                        const val = allocations[employee.id]?.[month] ?? 0;
                        
                        // Calculate Projected Availability based on Real Data
                        const alloc = employee.allocations[month];
                        const existingPT = alloc ? alloc.pt : 0;
                        const capacity = alloc ? alloc.capacity : 20; // Default capacity 20 if not set
                        
                        const projected = existingPT + val;
                        const isOver = projected > capacity;

                        return (
                            <div key={month} className="w-32 shrink-0 flex flex-col justify-center items-center gap-1 px-1">
                                <div className="flex items-center bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg shadow-sm h-10 w-24 overflow-hidden group-hover:border-primary/50 transition-colors">
                                    <div className="flex-1 h-full flex items-center justify-center text-sm font-bold text-slate-900 dark:text-white bg-transparent pl-2">
                                        {val.toFixed(1)}
                                    </div>
                                    <div className="flex flex-col border-l border-gray-200 dark:border-white/10 w-8 h-full bg-slate-50 dark:bg-white/5">
                                        <button 
                                            onClick={() => handleAllocationChange(employee.id, month, 0.5)}
                                            className="flex-1 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 text-slate-500 hover:text-primary transition-colors border-b border-gray-200 dark:border-white/10 active:bg-slate-100 dark:active:bg-white/10"
                                        >
                                            <ChevronUp size={12} strokeWidth={3} />
                                        </button>
                                        <button 
                                            onClick={() => handleAllocationChange(employee.id, month, -0.5)}
                                            className="flex-1 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 text-slate-500 hover:text-primary transition-colors disabled:opacity-30 disabled:hover:bg-transparent active:bg-slate-100 dark:active:bg-white/10"
                                            disabled={val <= 0}
                                        >
                                            <ChevronDown size={12} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-semibold ${isOver ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {projected.toFixed(1)} / {capacity.toFixed(1)} PT
                                </span>
                            </div>
                        );
                    })}

                    <div className="w-10 shrink-0 flex justify-end">
                        <button 
                            onClick={() => handleRemoveEmployee(employee.id)}
                            className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};