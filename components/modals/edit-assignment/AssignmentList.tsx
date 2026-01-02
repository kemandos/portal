import React from 'react';
import { Plus, Trash2, Edit2, Briefcase } from 'lucide-react';
import { Resource } from '../../../types';

interface AssignmentListProps {
  assignments: Resource[];
  selectedMonth: string;
  onDelete: (child: Resource) => void;
  onEdit: (child: Resource) => void;
  onAdd: () => void;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({ 
  assignments, 
  selectedMonth, 
  onDelete, 
  onEdit, 
  onAdd 
}) => {
  return (
    <>
      <div className="p-6 overflow-y-auto space-y-4 min-h-[300px]">
          <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-900 block">Assigned Projects</label>
                {assignments.map(assignment => (
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
                      <div className="flex items-center gap-1">
                          <button onClick={() => onDelete(assignment)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white transition-colors"><Trash2 size={16} /></button>
                          <button onClick={() => onEdit(assignment)} className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-white transition-colors"><Edit2 size={16} /></button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
      <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 flex justify-end">
            <button onClick={onAdd} className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-lg shadow-primary/30 transition-all flex items-center gap-2 active:scale-95"><Plus size={18} /> Add Assignment</button>
      </div>
    </>
  );
};