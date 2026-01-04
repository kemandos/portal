import React, { useRef, useState } from 'react';
import { Resource, ViewState, ThemeSettings } from '../types';
import { MONTHS } from '../constants';
import { ChevronRight, ChevronDown, Plus, Briefcase, Folder, Users, User, ChevronLeft } from 'lucide-react';

interface MobileListViewProps {
  data: Resource[];
  viewMode: ViewState['mode'];
  timeRange: ViewState['timeRange'];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onItemClick: (id: string) => void;
  onCellClick: (resourceId: string, month: string) => void;
  onAddChild?: (resourceId: string) => void;
  themeSettings?: ThemeSettings;
  className?: string;
  isSelectionMode?: boolean;
  selectedMonthIndices?: number[];
  groupBy?: string;
  expandedRows?: Record<string, boolean>;
  setExpandedRows?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const MobileListView: React.FC<MobileListViewProps> = ({
  data,
  viewMode,
  onItemClick,
  onCellClick,
  onAddChild,
  themeSettings,
  className,
  expandedRows,
  setExpandedRows
}) => {
  // Mobile View Swipe Logic for Months
  const [startMonthIndex, setStartMonthIndex] = useState(0);
  const touchStartX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const visibleMonths = MONTHS.slice(startMonthIndex, startMonthIndex + 3);

  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      const diff = e.touches[0].clientX - touchStartX.current;
      setSwipeOffset(diff);
  };

  const handleTouchEnd = () => {
      if (swipeOffset < -50) {
          // Next
          if (startMonthIndex + 3 < MONTHS.length) {
              setStartMonthIndex(prev => prev + 1);
          }
      } else if (swipeOffset > 50) {
          // Prev
          if (startMonthIndex > 0) {
              setStartMonthIndex(prev => prev - 1);
          }
      }
      setSwipeOffset(0);
      touchStartX.current = 0;
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (setExpandedRows && expandedRows) {
      setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const getStatusColor = (percentage: number) => {
    const t = themeSettings?.thresholds || { under: 50, balanced: 90, over: 100 };
    if (percentage === 0) return 'bg-slate-100/60 text-slate-400 border-slate-200/50 backdrop-blur-sm';
    if (percentage > t.over) return 'bg-rose-500/10 text-rose-600 border-rose-500/20 backdrop-blur-md shadow-[0_2px_8px_rgba(244,63,94,0.15)]';
    if (percentage > t.balanced) return 'bg-amber-500/10 text-amber-600 border-amber-500/20 backdrop-blur-md shadow-[0_2px_8px_rgba(245,158,11,0.15)]';
    if (percentage > t.under) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 backdrop-blur-md shadow-[0_2px_8px_rgba(16,185,129,0.15)]';
    return 'bg-slate-500/5 text-slate-500 border-slate-500/10 backdrop-blur-sm';
  };

  const renderResource = (resource: Resource, depth: number = 0) => {
    const isExpanded = expandedRows ? expandedRows[resource.id] : false;
    const hasChildren = resource.children && resource.children.length > 0;
    const isGroup = resource.type === 'group';
    const isProject = resource.type === 'project';
    const isEmployee = resource.type === 'employee';
    const isAssignment = depth > 0;
    
    if (isGroup) {
        return (
            <div key={resource.id} className="mb-4 mt-4 first:mt-2">
                <button 
                    onClick={(e) => toggleExpand(e, resource.id)}
                    className="flex items-center gap-3 w-full text-left px-2 py-2 group"
                >
                    <div className="size-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center transition-transform group-active:scale-95">
                         {isExpanded ? <ChevronDown size={14} className="text-slate-600" /> : <ChevronRight size={14} className="text-slate-600" />}
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{resource.name}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-200/50 text-slate-500 px-2.5 py-1 rounded-full backdrop-blur-sm ml-auto">{resource.subtext}</span>
                </button>
                
                {isExpanded && (
                    <div className="space-y-4 mt-3">
                        {resource.children?.map(child => renderResource(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div key={resource.id} className={`
            relative mb-5 rounded-[24px] border transition-all duration-300 ease-spring overflow-hidden
            ${isAssignment 
                ? 'ml-4 mt-2 border-l-4 border-l-primary/30 bg-white/40 border-y-white/40 border-r-white/40 backdrop-blur-md shadow-none' 
                : 'bg-white/80 border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
            }
        `}>
            {/* Header */}
            <div 
                className={`p-5 flex items-center gap-4 ${hasChildren ? 'cursor-pointer' : ''}`}
                onClick={(e) => hasChildren ? toggleExpand(e, resource.id) : onItemClick(resource.id)}
            >
                <div className="shrink-0">
                    {isEmployee ? (
                        <div className="size-12 rounded-2xl bg-slate-100 overflow-hidden border border-white/50 shadow-sm ring-1 ring-black/5">
                             <img src={resource.avatar || `https://i.pravatar.cc/150?u=${resource.id}`} alt={resource.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className={`size-12 rounded-2xl flex items-center justify-center border shadow-sm ${isProject ? 'bg-white border-white/60' : 'bg-primary/5 border-primary/10 text-primary'}`}>
                            {isProject && resource.avatar ? (
                                <img src={resource.avatar} alt="icon" className="w-7 h-7 object-contain" />
                            ) : (
                                <Briefcase size={22} className="text-slate-400" />
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                         <h3 className="text-[15px] font-bold text-slate-900 truncate leading-tight">{resource.name}</h3>
                         {hasChildren && (
                             <div className="text-slate-400 bg-white/50 p-1.5 rounded-full border border-white/50 shadow-sm">
                                 {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                             </div>
                         )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 truncate">{resource.subtext}</p>
                </div>
            </div>

            {/* Allocation Grid with Swipe Support */}
            <div 
                className="px-5 pb-5 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                 {/* Visual Month Navigator Indicators */}
                 <div className="flex justify-between items-center mb-2 px-1">
                      <ChevronLeft size={14} className={`text-slate-400 ${startMonthIndex === 0 ? 'opacity-20' : ''}`} />
                      <div className="flex gap-1">
                          {MONTHS.map((_, idx) => (
                              <div key={idx} className={`h-1 rounded-full transition-all ${idx >= startMonthIndex && idx < startMonthIndex + 3 ? 'w-4 bg-primary' : 'w-1 bg-slate-200'}`} />
                          ))}
                      </div>
                      <ChevronRight size={14} className={`text-slate-400 ${startMonthIndex + 3 >= MONTHS.length ? 'opacity-20' : ''}`} />
                 </div>

                 <div 
                    className="grid grid-cols-3 gap-3 transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(${swipeOffset}px)` }}
                 >
                     {visibleMonths.map((month) => {
                         const alloc = resource.allocations[month];
                         const pt = alloc ? alloc.pt : 0;
                         const capacity = alloc ? alloc.capacity : 20;
                         
                         const percentage = capacity > 0 ? (pt / capacity) * 100 : 0;
                         const statusClass = getStatusColor(percentage);
                         
                         return (
                             <button 
                                key={month}
                                onClick={(e) => { e.stopPropagation(); onCellClick(resource.id, month); }}
                                className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border transition-all duration-300 active:scale-95 hover:brightness-105 ${statusClass}`}
                             >
                                 <span className="text-[10px] font-bold uppercase opacity-60 mb-0.5 tracking-wide">{month}</span>
                                 <div className="flex items-baseline gap-0.5">
                                    <span className="text-sm font-extrabold tracking-tight leading-none">
                                        {Number.isInteger(pt) ? pt : pt.toFixed(1)}
                                    </span>
                                    {depth === 0 && <span className="text-[10px] font-semibold opacity-50">/{Number.isInteger(capacity) ? capacity : capacity.toFixed(0)}</span>}
                                 </div>
                             </button>
                         );
                     })}
                 </div>
            </div>

            {isExpanded && !isAssignment && onAddChild && (
                <div className="mx-5 mb-5 mt-1">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onAddChild(resource.id); }}
                        className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-dashed border-rose-200 bg-white/40 shadow-sm"
                     >
                         <Plus size={16} strokeWidth={2.5} />
                         Add {viewMode === 'People' ? 'Project' : 'Employee'}
                     </button>
                </div>
            )}
            
            {isExpanded && resource.children && (
                <div className="border-t border-slate-200/40 bg-slate-50/30 p-4 space-y-4">
                    {resource.children.map(child => renderResource(child, depth + 1))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className={`overflow-y-auto pb-32 ${className}`}>
        <div className="px-5 pt-2 pb-10">
            {data.map(node => renderResource(node))}
        </div>
    </div>
  );
};