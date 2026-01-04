import React from 'react';
import { Resource, ViewState, ThemeSettings } from '../types';
import { ChevronRight } from 'lucide-react';
import { Briefcase } from 'lucide-react';

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
  visibleMonths: string[];
  onCardTap: (item: Resource) => void;
}

export const MobileListView: React.FC<MobileListViewProps> = ({
  data,
  visibleMonths,
  viewMode,
  onCardTap,
  themeSettings,
  className
}) => {

  const getStatusColor = (percentage: number) => {
    const t = themeSettings?.thresholds || { under: 50, balanced: 90, over: 100 };
    if (percentage === 0) return 'bg-white/40 text-slate-400 border-slate-200/50';
    if (percentage > t.over) return 'bg-[#ef4444] text-white border-transparent shadow-[0_2px_8px_rgba(239,68,68,0.25)]';
    if (percentage > t.balanced) return 'bg-[#f59e0b] text-white border-transparent shadow-[0_2px_8px_rgba(245,158,11,0.25)]';
    if (percentage > t.under) return 'bg-[#10b981] text-white border-transparent shadow-[0_2px_8px_rgba(16,185,129,0.25)]';
    return 'bg-slate-400 text-white border-transparent shadow-[0_2px_8px_rgba(148,163,184,0.25)]';
  };

  const renderResource = (resource: Resource) => {
    const isGroup = resource.type === 'group';
    const isProject = resource.type === 'project';
    const isEmployee = resource.type === 'employee';
    
    if (isGroup) {
        // Flatten groups on mobile - just render children
        return (
            <React.Fragment key={resource.id}>
                {resource.children?.map(child => renderResource(child))}
            </React.Fragment>
        );
    }
    
    return (
        <div 
            key={resource.id} 
            onClick={() => onCardTap(resource)}
            className="relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-all"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="shrink-0">
                    {isEmployee ? (
                        <div className="size-10 rounded-full bg-white overflow-hidden border border-gray-100 shadow-sm">
                             <img src={resource.avatar || `https://i.pravatar.cc/150?u=${resource.id}`} alt={resource.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className={`size-10 rounded-xl flex items-center justify-center border shadow-sm ${isProject ? 'bg-white border-gray-100' : 'bg-primary/5 border-primary/10 text-primary'}`}>
                            {isProject && resource.avatar ? (
                                <img src={resource.avatar} alt="icon" className="w-6 h-6 object-contain" />
                            ) : (
                                <Briefcase size={18} className="text-slate-400" />
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{resource.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{resource.subtext}</p>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
            </div>

            {/* Allocation Grid (3 Months) */}
            <div className="grid grid-cols-3 gap-2">
                {visibleMonths.map((month) => {
                    const alloc = resource.allocations[month];
                    const pt = alloc ? alloc.pt : 0;
                    const capacity = alloc ? alloc.capacity : 20;
                    
                    const percentage = capacity > 0 ? (pt / capacity) * 100 : 0;
                    const statusClass = getStatusColor(percentage);
                    
                    return (
                        <div key={month} className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg ${statusClass}`}>
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-xs font-extrabold leading-none">
                                    {Number.isInteger(pt) ? pt : pt.toFixed(1)}
                                </span>
                                <span className="text-[9px] font-medium opacity-70">/{Number.isInteger(capacity) ? capacity : capacity.toFixed(0)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className={`pb-32 ${className}`}>
        <div className="px-4 pt-4 space-y-6">
            {data.map(node => renderResource(node))}
        </div>
    </div>
  );
};