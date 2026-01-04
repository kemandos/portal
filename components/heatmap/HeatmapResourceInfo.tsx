import React from 'react';
import { Folder, Briefcase, Users } from 'lucide-react';
import { Resource } from '../../types';

interface HeatmapResourceInfoProps {
  resource: Resource;
  depth: number;
  viewMode: 'People' | 'Projects';
  isExpanded: boolean;
  selectedIds: string[];
  paddingClass: string;
  isCompact: boolean;
  handleResourceClick: (e: React.MouseEvent, resource: Resource) => void;
  visibleMonths: string[];
  themeSettings: any;
  colSpan?: number;
  className?: string;
}

export const HeatmapResourceInfo: React.FC<HeatmapResourceInfoProps> = ({
  resource,
  depth,
  viewMode,
  isExpanded,
  selectedIds,
  paddingClass,
  isCompact,
  handleResourceClick,
  visibleMonths,
  themeSettings,
  colSpan,
  className
}) => {
  
  const renderIcon = (resource: Resource) => {
      const hasChildren = resource.children && resource.children.length > 0;
      const sizeClass = isCompact ? "w-8 h-8" : "w-10 h-10";
      const iconSizeClass = isCompact ? "size-8" : "size-10";
      
      if (resource.type === 'project' && resource.avatar) {
          return (
            <div className={`relative ${sizeClass} rounded-lg bg-white flex-shrink-0 border border-gray-100 shadow-sm transition-transform duration-300 ease-spring hover:scale-110 hover:shadow-glow overflow-hidden p-1`}>
                <div className="w-full h-full flex items-center justify-center">
                    <img 
                        src={resource.avatar} 
                        alt={resource.name} 
                        className={`max-w-full max-h-full object-contain ${viewMode === 'Projects' ? 'grayscale' : ''}`}
                    />
                </div>
            </div>
          );
      }
      if (resource.type === 'employee') {
          // Heatmap Ring Logic
          const radius = 22; 
          const circumference = 2 * Math.PI * radius;
          const strokeWidth = 3;
          
          // Calculate Availability Status for Badge
          const monthsToCheck = visibleMonths.slice(0, 3);
          let totalPct = 0;
          monthsToCheck.forEach(m => {
              const alloc = resource.allocations[m];
              if (alloc && alloc.capacity > 0) totalPct += (alloc.pt / alloc.capacity);
          });
          const avgUtil = totalPct / monthsToCheck.length;
          
          let statusColor = 'bg-slate-400'; // Available
          if (avgUtil > 1.0) statusColor = 'bg-red-500'; // Over
          else if (avgUtil > 0.9) statusColor = 'bg-amber-500'; // Warning
          else if (avgUtil > 0.5) statusColor = 'bg-emerald-500'; // Balanced
          else if (avgUtil > 0) statusColor = 'bg-slate-400'; // Under

          return (
            <div className={`relative ${sizeClass} rounded-full bg-gray-100 flex-shrink-0 border-2 border-white shadow-sm transition-transform duration-300 ease-spring hover:scale-110 hover:shadow-glow group/avatar`}>
                <div className="w-full h-full rounded-full overflow-hidden relative z-10">
                    <img src={resource.avatar || `https://i.pravatar.cc/150?u=${resource.id}`} alt={resource.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Availability Badge */}
                <div className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white z-20 ${statusColor} shadow-sm`}></div>
                
                {/* SVG Heatmap Ring */}
                <svg className="absolute -inset-[6px] w-[calc(100%+12px)] h-[calc(100%+12px)] z-0 rotate-[-90deg]" viewBox="0 0 52 52">
                   {visibleMonths.map((month, index) => {
                       const alloc = resource.allocations[month];
                       const pt = alloc ? alloc.pt : 0;
                       const cap = alloc ? alloc.capacity : 20;
                       const pct = cap > 0 ? (pt / cap) * 100 : 0;
                       
                       let color = '#e2e8f0'; // slate-200 (empty/default)
                       const thresholds = themeSettings.thresholds || { under: 50, balanced: 90, over: 100 };
                       const colors = themeSettings.thresholdColors || { under: '#94a3b8', balanced: '#10b981', optimal: '#f59e0b', over: '#ef4444' };

                       if (pt > 0) {
                           if (pct > thresholds.over) color = colors.over; 
                           else if (pct > thresholds.balanced) color = colors.optimal; 
                           else if (pct > thresholds.under) color = colors.balanced; 
                           else color = colors.under; 
                       }
                       
                       const gap = 3;
                       const effectiveLength = (circumference / visibleMonths.length) - gap;
                       const offset = -index * (circumference / visibleMonths.length);

                       return (
                           <circle 
                               key={month}
                               cx="26" cy="26" r={radius}
                               fill="none"
                               stroke={color}
                               strokeWidth={strokeWidth}
                               strokeDasharray={`${effectiveLength} ${circumference - effectiveLength}`}
                               strokeDashoffset={offset}
                               strokeLinecap="round"
                               className="transition-all duration-500"
                           />
                       );
                   })}
                </svg>
            </div>
          );
      }
      
      let Icon = Folder;
      if (resource.type === 'project') Icon = Briefcase;
      if (resource.type === 'group') Icon = Users;
      const ringClass = hasChildren ? "ring-2 ring-primary ring-offset-2 ring-offset-white/80" : "";
      return (
        <div className={`${iconSizeClass} rounded-full ${resource.color ? 'bg-white text-primary' : 'bg-white/80 text-primary'} flex items-center justify-center shadow-sm border border-white/50 backdrop-blur-sm ${ringClass} transition-transform duration-300 ease-spring hover:scale-110 hover:bg-white hover:shadow-glow`}>
            <Icon size={isCompact ? 14 : 18} strokeWidth={2.5} />
        </div>
      );
  };

  const isSelectedRow = selectedIds.includes(resource.id);
  const defaultClass = `sticky left-[48px] z-20 ${isSelectedRow ? 'bg-primary/5' : 'bg-white/20'} backdrop-blur-md group-hover:bg-white/40 ${paddingClass} transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] cursor-pointer align-middle border-r border-slate-200`;

  return (
    <td 
        colSpan={colSpan}
        className={className || defaultClass}
        onClick={(e) => handleResourceClick(e, resource)}
    >
        <div className="flex items-center">
            <div style={{ width: depth * 24 }} className="shrink-0 transition-all" />
            <div className="flex items-center gap-3 min-w-0 flex-1 group/item">
                
                {resource.type !== 'group' && renderIcon(resource)}
                
                <div className="min-w-0 flex-1 transition-transform duration-300 ease-spring group-hover/item:translate-x-1">
                    {resource.type === 'group' ? (
                        <div className="flex flex-col justify-center pl-2 border-l-2 border-primary/20">
                            <span className="text-sm font-bold text-slate-900 leading-tight">{resource.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{resource.subtext}</span>
                        </div>
                    ) : resource.type === 'employee' ? (
                        <div className="flex flex-col justify-center">
                            <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-bold truncate text-slate-900 ${selectedIds.includes(resource.id) ? 'text-primary' : ''}`}>
                                {resource.name}
                            </span>
                            {!isCompact && (
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-slate-500 truncate leading-tight">
                                        {resource.subtext ? resource.subtext.split('•')[0].trim() : ''}
                                    </span>
                                    {resource.skills && resource.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {resource.skills.slice(0, 2).map(skill => (
                                                <span key={skill} className="text-[9px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-200/50">{skill}</span>
                                            ))}
                                            {resource.skills.length > 2 && <span className="text-[9px] text-slate-400">+{resource.skills.length - 2}</span>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                             <div className="flex items-center gap-2">
                                <span className={`${depth > 0 ? 'text-xs font-semibold text-slate-700' : 'text-sm font-bold truncate text-slate-900'} ${selectedIds.includes(resource.id) ? 'text-primary' : ''}`}>
                                    {resource.name}
                                </span>
                            </div>
                            {depth === 0 && <div className="text-xs text-slate-500 font-medium truncate">{resource.subtext}</div>}
                        </>
                    )}
                </div>
            </div>
        </div>
    </td>
  );
};