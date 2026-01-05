import React, { useState } from 'react';
import { Resource } from '../../types';
import { MONTHS } from '../../constants';
import { Briefcase, Check, Plus, Users, Edit2, ArrowLeft } from 'lucide-react';

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
      if (onEditMonth) {
          onEditMonth(resource.id, month);
      }
  };

  const toggleMonthSelection = (month: string) => {
      setSelectedMonths(prev => 
          prev.includes(month)
              ? prev.filter(m => m !== month)
              : [...prev, month]
      );
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Full Screen Modal - Slide from Right */}
      <div className="absolute inset-0 bg-white dark:bg-[#0c0c0e] flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto">
        
        {/* Header */}
        <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-white/10 flex-none bg-white dark:bg-[#0c0c0e] z-10 gap-4">
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors -ml-1"
            >
                <ArrowLeft size={24} />
            </button>
            <div className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {viewMode === 'People' ? 'Employee Details' : 'Project Details'}
            </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-24 pt-6 custom-scrollbar relative">
            {/* Header Info - Centered */}
            <div className="flex flex-col items-center text-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{resource.name}</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{resource.subtext}</p>
                  {resource.skills && resource.skills.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                      {resource.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                          {skill}
                        </span>
                      ))}
                      {resource.skills.length > 3 && (
                        <span className="text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
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
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Month Details
                        <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(6 Months)</span>
                    </h3>
                    <button
                        onClick={() => {
                            if (isSelectionMode) {
                                setSelectedMonths([]);
                                setIsSelectionMode(false);
                            } else {
                                setIsSelectionMode(true);
                            }
                        }}
                        className={`text-xs font-bold transition-colors ${isSelectionMode ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
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
                                        toggleMonthSelection(month);
                                    } else {
                                        handleMonthClick(month);
                                    }
                                }}
                                className={`
                                    relative bg-white dark:bg-[#151515] border-2 rounded-2xl p-4 text-left flex flex-col gap-1 transition-all duration-200 active:scale-[0.98]
                                    ${isSelected 
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md' 
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                    }
                                `}
                            >
                                {/* Selection Indicator */}
                                <div className="absolute top-3 right-3 z-10">
                                    <div className={`
                                        size-5 rounded-full flex items-center justify-center transition-colors
                                        ${isSelected 
                                            ? 'bg-primary border-primary' 
                                            : 'border-2 border-slate-200 dark:border-slate-700 bg-transparent'
                                        }
                                    `}>
                                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                    </div>
                                </div>

                                <div className="flex justify-between items-start w-full mb-1">
                                    <span className="font-bold text-slate-900 dark:text-white text-sm">{month}</span>
                                </div>
                                
                                <div className="flex items-baseline gap-1 mt-0">
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{Number.isInteger(pt) ? pt : pt.toFixed(1)}</span>
                                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">/ {cap} PT</span>
                                </div>
                                
                                {/* Assigned Projects Preview */}
                                {resource.children && resource.children.length > 0 && (
                                     <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-white/5 space-y-1.5 w-full">
                                         {resource.children.filter(c => (c.allocations[month]?.pt || 0) > 0).slice(0, 2).map(child => (
                                             <div key={child.id} className="flex justify-between items-center text-[10px] w-full">
                                                 <span className="truncate text-slate-500 dark:text-slate-400 font-medium max-w-[80px]">{child.name}</span>
                                                 <span className="font-bold text-slate-900 dark:text-slate-200">{child.allocations[month]?.pt}</span>
                                             </div>
                                         ))}
                                         {resource.children.filter(c => (c.allocations[month]?.pt || 0) > 0).length > 2 && (
                                             <div className="text-[9px] text-slate-400 dark:text-slate-600 italic">
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
        </div>
            
        {/* Action Buttons (Sticky Footer) */}
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#0c0c0e] border-t border-gray-200 dark:border-white/10 p-4 pb-safe z-20">
            {isSelectionMode && selectedMonths.length > 0 ? (
                <div className="flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
                    <button 
                        onClick={() => {
                            if (onEditMonth) {
                                onEditMonth(resource.id, selectedMonths);
                            }
                        }}
                        className="flex-[2] py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all"
                    >
                        Edit {selectedMonths.length} Months
                    </button>
                    <button 
                        onClick={() => setSelectedMonths([])}
                        className="flex-1 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
                    >
                        Clear
                    </button>
                </div>
            ) : (
                <div className="flex gap-3">
                    {viewMode === 'Projects' ? (
                        <>
                            <button 
                                onClick={() => onEditBudget && project && onEditBudget(project.id)}
                                className="flex-1 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center"
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
                                className="flex-1 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center"
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
  );
};