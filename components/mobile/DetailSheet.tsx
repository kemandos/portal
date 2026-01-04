import React, { useState } from 'react';
import { Resource } from '../../types';
import { MONTHS } from '../../constants';
import { Briefcase, User, Check, Plus, Users, Edit2 } from 'lucide-react';

interface DetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Resource | null;
  project?: Resource | null;
  viewMode: 'People' | 'Projects';
  onEditAllocations: () => void;
  onEditBudget?: (projectId: string) => void;
  onAddChild: () => void;
  onEditMonth?: (resourceId: string, month: string | string[], intent?: 'budget' | 'assignments') => void;
}

export const DetailSheet: React.FC<DetailSheetProps> = ({ 
  isOpen, 
  onClose, 
  employee, 
  project, 
  viewMode,
  onEditAllocations,
  onEditBudget,
  onAddChild,
  onEditMonth
}) => {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  if (!isOpen) return null;
  
  const resource = viewMode === 'People' ? employee : project;
  if (!resource) return null;

  const handleMonthClick = (month: string) => {
      onClose();
      if (onEditMonth) {
          onEditMonth(resource.id, month);
      }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-2 flex-none" onClick={onClose}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto px-6 pb-6 pt-2 custom-scrollbar relative">
            {/* Header */}
            <div className="flex items-center gap-4 py-4">
                <div className="shrink-0">
                    {viewMode === 'People' ? (
                        <div className="size-16 rounded-2xl bg-white overflow-hidden border border-white shadow-sm ring-1 ring-black/5">
                             <img src={resource.avatar || `https://i.pravatar.cc/150?u=${resource.id}`} alt={resource.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="size-16 rounded-2xl flex items-center justify-center border shadow-sm bg-white border-white/60">
                             {resource.avatar ? (
                                <img src={resource.avatar} alt="icon" className="w-10 h-10 object-contain" />
                             ) : (
                                <Briefcase size={32} className="text-slate-400" />
                             )}
                        </div>
                    )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">{resource.name}</h2>
                  <p className="text-slate-500 font-medium">{resource.subtext}</p>
                  {resource.skills && resource.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {resource.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                          {skill}
                        </span>
                      ))}
                      {resource.skills.length > 3 && (
                        <span className="text-[10px] font-bold bg-slate-50 text-slate-400 px-2 py-1 rounded-md border border-slate-200">
                           +{resource.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
            </div>
              
            {/* Month Details Grid */}
            <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        Month Details
                        <span className="text-xs font-normal text-slate-400">(6 Months)</span>
                    </h3>
                    <button
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setSelectedMonths([]);
                        }}
                        className={`text-xs font-bold px-2 py-1 rounded hover:bg-slate-100 transition-colors ${isSelectionMode ? 'text-primary' : 'text-slate-500'}`}
                    >
                        {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {MONTHS.slice(0, 6).map(month => {
                        const alloc = resource.allocations[month];
                        const pt = alloc ? alloc.pt : 0;
                        const cap = alloc ? alloc.capacity : 20;
                        const isOver = pt > cap;
                        const isSelected = selectedMonths.includes(month);
                        
                        return (
                            <button
                                key={month}
                                onClick={() => {
                                    if (isSelectionMode) {
                                        setSelectedMonths(prev => 
                                            prev.includes(month)
                                                ? prev.filter(m => m !== month)
                                                : [...prev, month]
                                        );
                                    } else {
                                        handleMonthClick(month);
                                    }
                                }}
                                className={`
                                    relative bg-white border-2 rounded-xl p-3 text-left flex flex-col gap-1 transition-all duration-200 active:scale-[0.98]
                                    ${isSelected 
                                        ? 'border-primary bg-primary/5 shadow-lg' 
                                        : (pt > 0 ? 'border-slate-200 hover:border-primary hover:shadow-md' : 'border-slate-100 hover:border-slate-200')
                                    }
                                `}
                            >
                                {isSelectionMode && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <div className={`
                                            size-5 rounded-full border-2 flex items-center justify-center transition-colors
                                            ${isSelected 
                                                ? 'bg-primary border-primary' 
                                                : 'bg-white border-slate-200'
                                            }
                                        `}>
                                            {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center w-full">
                                    <span className="font-bold text-slate-700 text-sm">{month}</span>
                                    {!isSelectionMode && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isOver ? 'bg-red-100 text-red-600' : (pt > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400')}`}>
                                            {pt > 0 ? (isOver ? 'Over' : 'OK') : 'Empty'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-xl font-bold text-slate-900">{Number.isInteger(pt) ? pt : pt.toFixed(1)}</span>
                                    <span className="text-xs font-medium text-slate-400">/ {cap} PT</span>
                                </div>
                                
                                {/* Assigned Projects Preview */}
                                {resource.children && resource.children.length > 0 && (
                                     <div className="mt-2 pt-2 border-t border-slate-200/50 space-y-1 w-full">
                                         {resource.children.filter(c => (c.allocations[month]?.pt || 0) > 0).slice(0, 2).map(child => (
                                             <div key={child.id} className="flex justify-between text-[10px] w-full">
                                                 <span className="truncate text-slate-500 max-w-[80px]">{child.name}</span>
                                                 <span className="font-mono text-slate-700 font-bold">{child.allocations[month]?.pt}</span>
                                             </div>
                                         ))}
                                         {resource.children.filter(c => (c.allocations[month]?.pt || 0) > 0).length > 2 && (
                                             <div className="text-[9px] text-slate-400 italic">
                                                 +{resource.children.filter(c => (c.allocations[month]?.pt || 0) > 0).length - 2} more...
                                             </div>
                                         )}
                                     </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {/* Spacer for sticky footer */}
            <div className="h-20" />

            {/* Action Buttons */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe">
                {isSelectionMode && selectedMonths.length > 0 ? (
                    <div className="flex gap-3">
                        {viewMode === 'Projects' ? (
                            <>
                                <button 
                                    onClick={() => {
                                        if (onEditMonth) {
                                            onEditMonth(resource.id, selectedMonths, 'budget');
                                            onClose();
                                        }
                                    }}
                                    className="flex-1 py-3.5 bg-white border border-gray-200 text-slate-900 font-bold rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                                >
                                    Edit Budget ({selectedMonths.length})
                                </button>
                                <button 
                                    onClick={() => {
                                        if (onEditMonth) {
                                            onEditMonth(resource.id, selectedMonths, 'assignments');
                                            onClose();
                                        }
                                    }}
                                    className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Users size={18} strokeWidth={2.5} />
                                    Manage Team
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={() => {
                                        if (onEditMonth) {
                                            onEditMonth(resource.id, selectedMonths);
                                            onClose();
                                        }
                                    }}
                                    className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all"
                                >
                                    Edit {selectedMonths.length} Months
                                </button>
                                <button 
                                    onClick={() => setSelectedMonths([])}
                                    className="px-6 py-3.5 bg-white border border-gray-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all"
                                >
                                    Clear
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex gap-3">
                        {viewMode === 'Projects' ? (
                            <>
                                <button 
                                    onClick={() => onEditBudget && project && onEditBudget(project.id)}
                                    className="flex-1 py-3.5 bg-white border border-gray-200 text-slate-900 font-bold rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center"
                                    title="Edit Budget"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button 
                                    onClick={onEditAllocations}
                                    className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center"
                                    title="Manage Team"
                                >
                                    <Users size={20} strokeWidth={2.5} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={onEditAllocations}
                                    className="flex-1 py-3.5 bg-white border border-gray-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center"
                                    title="Edit Allocations"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button 
                                    onClick={onAddChild}
                                    className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center"
                                    title="Add Project"
                                >
                                    <Plus size={24} strokeWidth={3} />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};