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
  setTooltipState?: (state: any) => void;
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
  className,
  setTooltipState
}) => {
  
  const renderIcon = (resource: Resource) => {
      const hasChildren = resource.children && resource.children.length > 0;
      const sizeClass = isCompact ? "w-8 h-8" : "w-10 h-10 3xl:w-12 3xl:h-12 4xl:w-14 4xl:h-14";
      const iconSizeClass = isCompact ? "size-8" : "size-10 3xl:size-12 4xl:size-14";
      
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
          else if (avgUtil > 0.95) statusColor = 'bg-amber-500'; // Warning
          else if (avgUtil > 0.75) statusColor = 'bg-emerald-500'; // Balanced
          else if (avgUtil > 0.25) statusColor = 'bg-sky-400'; // Low
          else statusColor = 'bg-slate-400'; // Under

          return (
            <div className={`relative ${sizeClass} rounded-full bg-gray-100 flex-shrink-0 border-2 border-white shadow-sm transition-transform duration-300 ease-spring hover:scale-110 hover:shadow-glow group/avatar`}>
                <div className="w-full h-full rounded-full overflow-hidden relative z-10">
                    <img src={resource.avatar || `https://i.pravatar.cc/150?u=${resource.id}`} alt={resource.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Availability Badge */}
                <div className={`absolute bottom-0 right-0 size-3 3xl:size-4 rounded-full border-2 border-white z-20 ${statusColor} shadow-sm`}></div>
                
                {/* SVG Heatmap Ring */}
                <svg className="absolute -inset-[6px] w-[calc(100%+12px)] h-[calc(100%+12px)] z-0 rotate-[-90deg]" viewBox="0 0 52 52">
                   {visibleMonths.map((month, index) => {
                       const alloc = resource.allocations[month];
                       const pt = alloc ? alloc.pt : 0;
                       const cap = alloc ? alloc.capacity : 20;
                       const pct = cap > 0 ? (pt / cap) * 100 : 0;
                       
                       let color = '#e2e8f0'; // slate-200 (empty/default)
                       const thresholds = themeSettings.thresholds || { under: 25, low: 75, balanced: 95, over: 100 };
                       const colors = themeSettings.thresholdColors || { under: '#94a3b8', low: '#38bdf8', balanced: '#10b981', optimal: '#f59e0b', over: '#ef4444' };

                       if (pt > 0) {
                           if (pct > thresholds.over) color = colors.over; 
                           else if (pct > thresholds.balanced) color = colors.optimal; 
                           else if (pct > thresholds.low) color = colors.balanced; 
                           else if (pct > thresholds.under) color = colors.low; 
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
            <Icon size={isCompact ? 14 : 18} strokeWidth={2.5} className="3xl:w-6 3xl:h-6 4xl:w-8 4xl:h-8" />
        </div>
      );
  };

  const handleSkillHover = (e: React.MouseEvent, skills: string[]) => {
      e.stopPropagation();
      if (!setTooltipState) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipState({
          content: (
              <div className="flex flex-col gap-1">
                  <span className="font-bold text-white mb-1 text-xs">More Skills</span>
                  <div className="flex flex-wrap gap-1">
                      {skills.map(s => (
                          <span key={s} className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{s}</span>
                      ))}
                  </div>
              </div>
          ),
          position: { x: rect.left + rect.width / 2, y: rect.bottom }
      });
  };

  const handleMouseLeave = () => {
      if (setTooltipState) setTooltipState(null);
  };

  const isSelectedRow = selectedIds.includes(resource.id);
  
  // FIXED: Opaque background and proper shadow/z-index for sticky columns
  const defaultClass = `sticky left-[48px] z-20 ${isSelectedRow ? 'bg-rose-50' : 'bg-[#FDFBF7]'} shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] ${paddingClass} transition-colors cursor-pointer align-middle border-r border-slate-200`;

  return (
    <td 
        colSpan={colSpan}
        className={className || defaultClass}
        onClick={(e) => handleResourceClick(e, resource)}
    >
        <div className="flex items-center">
            <div style={{ width: depth * 24 }} className="shrink-0 transition-all 3xl:w-[calc(var(--depth)*32px)]" />
            <div className="flex items-center gap-3 min-w-0 flex-1 group/item 3xl:gap-4">
                
                {resource.type !== 'group' && renderIcon(resource)}
                
                <div className="min-w-0 flex-1 transition-transform duration-300 ease-spring group-hover/item:translate-x-1">
                    {resource.type === 'group' ? (
                        <div className="flex flex-col justify-center pl-2 border-l-2 border-primary/20 3xl:gap-1">
                            <span className="text-sm font-bold text-slate-900 leading-tight 3xl:text-base">{resource.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 3xl:text-xs">{resource.subtext}</span>
                        </div>
                    ) : resource.type === 'employee' ? (
                        <div className="flex flex-col justify-center">
                            <span className={`${isCompact ? 'text-xs 3xl:text-sm' : 'text-sm 3xl:text-base'} font-bold truncate text-slate-900 ${selectedIds.includes(resource.id) ? 'text-primary' : ''}`}>
                                {resource.name}
                            </span>
                            {!isCompact && (
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-slate-500 truncate leading-tight 3xl:text-xs">
                                        {resource.subtext ? resource.subtext.split('•')[0].trim() : ''}
                                    </span>
                                    {resource.skills && resource.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1 cursor-default" onClick={(e) => e.stopPropagation()}>
                                            {resource.skills.slice(0, 2).map(skill => (
                                                <span key={skill} className="text-[9px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/50 cursor-default 3xl:text-[10px] 3xl:px-2 3xl:py-1">{skill}</span>
                                            ))}
                                            {resource.skills.length > 2 && (
                                                <span 
                                                    className="text-[9px] text-slate-400 hover:text-primary transition-colors cursor-default 3xl:text-[10px]"
                                                    onMouseEnter={(e) => handleSkillHover(e, resource.skills!.slice(2))}
                                                    onMouseLeave={handleMouseLeave}
                                                >
                                                    +{resource.skills.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                             <div className="flex items-center gap-2">
                                <span className={`${depth > 0 ? 'text-xs 3xl:text-sm font-semibold text-slate-700' : 'text-sm 3xl:text-base font-bold truncate text-slate-900'} ${selectedIds.includes(resource.id) ? 'text-primary' : ''}`}>
                                    {resource.name}
                                </span>
                            </div>
                            {depth === 0 && <div className="text-xs text-slate-500 font-medium truncate 3xl:text-sm">{resource.subtext}</div>}
                        </>
                    )}
                </div>
            </div>
        </div>
    </td>
  );
};