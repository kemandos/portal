import React, { useRef, useEffect } from 'react';
import { Resource } from '../../types';

interface HeatmapCellProps {
  resource: Resource;
  month: string;
  monthIndex: number;
  rowIndex: number;
  viewMode: 'People' | 'Projects';
  themeSettings: any;
  isSelected: boolean;
  isEditing: boolean;
  editingValue: string;
  cellHeight: string;
  isCompactMode: boolean;
  isProjectChild: boolean;
  isProjectRoot: boolean;
  onMouseDown: () => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onMouseUp: (initialValue: number) => void;
  setEditingCell: (val: any) => void;
  onInlineBlur: () => void;
  setTooltipState?: (state: any) => void;
}

export const HeatmapCell: React.FC<HeatmapCellProps> = ({
  resource,
  month,
  monthIndex,
  rowIndex,
  viewMode,
  themeSettings,
  isSelected,
  isEditing,
  editingValue,
  cellHeight,
  isCompactMode,
  isProjectChild,
  isProjectRoot,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseUp,
  setEditingCell,
  onInlineBlur,
  setTooltipState
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          onInlineBlur();
      } else if (e.key === 'Escape') {
          setEditingCell(null);
      }
  };

  const getStatusStyle = (percentage: number, isTransparent: boolean = false) => {
    const opacity = themeSettings.heatmapOpacity !== undefined ? themeSettings.heatmapOpacity : 1;
    const colors = themeSettings.thresholdColors || {
        under: '#94a3b8', 
        balanced: '#10b981', 
        optimal: '#f59e0b', 
        over: '#ef4444'
    };
    const thresholds = themeSettings.thresholds || { under: 50, balanced: 90, over: 100 };

    const applyOpacity = (hex: string) => {
        if (!hex) return '#ee3a5e';
        if (opacity === 1) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    if (percentage === 0) return { backgroundColor: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(0, 0, 0, 0.05)', color: '#94a3b8' };

    if (isTransparent) {
        return { 
            backgroundColor: 'transparent',
            color: '#1e293b', 
            fontWeight: 700
        };
    }
    
    // Updated Logic:
    // Over > 100% -> Red
    // Warning > 90% -> Amber
    // Balanced > 50% -> Green
    // Under <= 50% -> Gray/Blue
    
    if (percentage > thresholds.over) return { backgroundColor: applyOpacity(colors.over), color: '#ffffff', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)' }; 
    if (percentage > thresholds.balanced) return { backgroundColor: applyOpacity(colors.optimal), color: '#ffffff', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.25)' }; 
    if (percentage > thresholds.under) return { backgroundColor: applyOpacity(colors.balanced), color: '#ffffff', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)' }; 
    
    // Under utilized
    return { backgroundColor: applyOpacity(colors.under), color: '#ffffff', boxShadow: '0 4px 14px rgba(148, 163, 184, 0.25)' }; 
  };

  const allocation = resource.allocations[month];
  const hasAllocation = allocation && (allocation.pt > 0 || allocation.capacity > 0);
  const percentage = (allocation && allocation.capacity > 0) 
      ? (allocation.pt / allocation.capacity) * 100 
      : (allocation && allocation.pt > 0 ? 999 : 0);
  
  const shouldRemoveBackground = viewMode === 'People' && resource.type === 'project';
  const style = getStatusStyle(percentage, shouldRemoveBackground);

  const ptAllocated = allocation ? allocation.pt : 0;
  const ptCapacity = allocation && allocation.capacity > 0 ? allocation.capacity : 20.0;
  
  const displayValue = isProjectRoot ? ptCapacity : ptAllocated;

  const handleMouseEnterCell = (e: React.MouseEvent) => {
      onMouseEnter(e);
      
      // Tooltip Logic
      if (setTooltipState && hasAllocation && !isEditing) {
          const breakdownItems: {name: string, value: number, role?: string}[] = [];
          
          if (resource.children && resource.children.length > 0) {
              resource.children.forEach(child => {
                  const val = child.allocations[month]?.pt || 0;
                  if (val > 0) {
                      breakdownItems.push({ 
                          name: child.name, 
                          value: val,
                          role: child.role
                      });
                  }
              });
          }

          const content = (
              <div className="flex flex-col gap-2 min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-1">
                      <span className="font-bold text-white">{resource.name}</span>
                      <span className="text-white/70 text-xs">{month}</span>
                  </div>
                  
                  {breakdownItems.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                          {breakdownItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                  <div className="flex flex-col">
                                      <span className="text-white font-medium">{item.name}</span>
                                      {item.role && <span className="text-white/50 text-[10px]">{item.role}</span>}
                                  </div>
                                  <span className="font-mono text-white/90">{item.value.toFixed(1)}</span>
                              </div>
                          ))}
                          <div className="h-px bg-white/10 my-1" />
                      </div>
                  ) : null}
                  
                  <div className="flex justify-between items-center font-bold text-sm">
                      <span className="text-white/80">Total</span>
                      <span className={`${percentage > 100 ? 'text-red-300' : 'text-emerald-300'}`}>
                          {ptAllocated.toFixed(1)} <span className="text-[10px] font-normal opacity-70">/ {ptCapacity} ({percentage.toFixed(0)}%)</span>
                      </span>
                  </div>
              </div>
          );
          
          const rect = e.currentTarget.getBoundingClientRect();
          setTooltipState({
              content,
              position: { x: rect.left + rect.width / 2, y: rect.bottom }
          });
      }
  };

  const handleMouseLeaveCell = () => {
      onMouseLeave();
      if (setTooltipState) setTooltipState(null);
  };

  return (
    <td 
        className={`p-1 relative cursor-pointer border-l border-slate-200/50 transition-all duration-300 align-middle ${isSelected ? 'bg-primary/5' : ''}`}
        onMouseDown={onMouseDown}
        onMouseEnter={handleMouseEnterCell}
        onMouseLeave={handleMouseLeaveCell}
        onMouseUp={() => onMouseUp(displayValue)}
    >
        <div className={`w-full ${cellHeight} rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 relative group/cell 
            ${isSelected ? 'scale-100 ring-1 ring-primary/20' : 'hover:scale-105 hover:brightness-110 hover:shadow-liquid hover:-translate-y-0.5'}
            ${isEditing ? 'bg-white ring-2 ring-primary shadow-lg z-50 scale-105' : ''}
            active:scale-95 active:duration-100 ease-spring
            `}
            style={!isEditing ? style : {}}
        >
            {isEditing ? (
                <input 
                    ref={inputRef}
                    type="number" 
                    className="w-full h-full text-center bg-transparent outline-none font-bold text-slate-900"
                    value={editingValue}
                    onChange={(e) => setEditingCell(prev => ({...prev, value: e.target.value}))}
                    onBlur={onInlineBlur}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                hasAllocation || isProjectRoot ? (
                    <div className="flex flex-col items-center justify-center leading-none gap-0.5">
                        {isCompactMode ? (
                            <span className="text-[10px] tracking-tighter">
                                {Number.isInteger(ptAllocated) ? ptAllocated : ptAllocated.toFixed(1)}
                                {!isProjectChild && `/${Number.isInteger(ptCapacity) ? ptCapacity : ptCapacity.toFixed(1)}`}
                            </span>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="text-[11px]">
                                    {Number.isInteger(ptAllocated) ? ptAllocated : ptAllocated.toFixed(1)} 
                                    {!isProjectChild && <span className="opacity-70 font-normal"> / {Number.isInteger(ptCapacity) ? ptCapacity : ptCapacity.toFixed(1)}</span>}
                                </span>
                                {!isProjectChild && !shouldRemoveBackground && percentage > 0 && (
                                    <span className="text-[9px] opacity-80 font-medium">
                                        {percentage.toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="opacity-0 group-hover/cell:opacity-100 text-slate-400 text-[10px] scale-150 font-light">+</span>
                )
            )}
        </div>
    </td>
  );
};