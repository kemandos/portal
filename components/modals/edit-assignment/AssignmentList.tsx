import React from 'react';
import { Plus, Trash2, Edit2, Briefcase, User } from 'lucide-react';
import { Resource } from '../../../types';

interface AssignmentListProps {
  assignments: Resource[];
  selectedMonth: string;
  selectedMonths?: string[];
  onDelete: (child: Resource) => void;
  onEdit: (child: Resource) => void;
  onAdd: () => void;
  viewMode?: 'People' | 'Projects';
}

export const AssignmentList: React.FC<AssignmentListProps> = ({ 
  assignments, 
  selectedMonth, 
  selectedMonths,
  onDelete, 
  onEdit, 
  onAdd,
  viewMode
}) => {
  const isPeopleView = viewMode === 'People';
  const title = isPeopleView ? 'Assigned Projects' : 'Team Members';
  const Icon = isPeopleView ? Briefcase : User;
  
  const monthsToDisplay = selectedMonths && selectedMonths.length > 0 ? selectedMonths : [selectedMonth];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e20]">
      <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="space-y-4">
              <label className="text-sm font-bold text-slate-900 dark:text-white block">{title}</label>
                {assignments.map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#252528] shadow-sm hover:border-rose-100 dark:hover:border-primary/30 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4 min-w-0">
                              <div className="size-11 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0 self-start mt-1">
                                  <Icon size={20} />
                              </div>
                              <div className="min-w-0 flex-1">
                                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{assignment.name}</div>
                                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                      {monthsToDisplay.length === 1 ? (
                                          `${assignment.allocations[monthsToDisplay[0]]?.pt.toFixed(1) || '0.0'} PT`
                                      ) : (
                                          <div className="flex flex-col gap-1 mt-1">
                                              {monthsToDisplay.map(m => (
                                                  <div key={m} className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                      <span className="opacity-70 w-14">{m}:</span>
                                                      <span className={`font-mono font-bold ${(assignment.allocations[m]?.pt || 0) > 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>
                                                          {(assignment.allocations[m]?.pt || 0).toFixed(1)} PT
                                                      </span>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2 self-start mt-1">
                          <button 
                            onClick={() => onDelete(assignment)} 
                            className="p-2.5 rounded-xl text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button 
                            onClick={() => onEdit(assignment)} 
                            className="p-2.5 rounded-xl text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                      </div>
                  </div>
              ))}
              
              {assignments.length === 0 && (
                  <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm bg-slate-50/50 dark:bg-black/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      No {isPeopleView ? 'projects' : 'employees'} assigned for {monthsToDisplay.length > 1 ? 'selected months' : selectedMonth}
                  </div>
              )}
          </div>
      </div>
      
      {/* Footer Button */}
      <div className="p-6 pt-2 bg-white/50 dark:bg-[#1e1e20]/50 backdrop-blur-sm shrink-0 pb-safe">
            <button 
                onClick={onAdd} 
                className="w-full py-4 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] ring-1 ring-white/20 dark:ring-black/20"
            >
                <Plus size={18} strokeWidth={3} /> 
                Add {isPeopleView ? 'Project' : 'Employee'}
            </button>
      </div>
    </div>
  );
};