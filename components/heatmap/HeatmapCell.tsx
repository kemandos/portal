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
  onInlineBlur
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
        under: '#cbd5e1', 
        balanced: '#ee3a5e', 
        optimal: '#ee3a5e', 
        over: '#be123c'
    };
    const thresholds = themeSettings.thresholds || { under: 50, balanced: 90, over: 110 };

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
    
    if (percentage > thresholds.over) return { backgroundColor: applyOpacity(colors.over), color: '#ffffff', boxShadow: '0 4px 14px rgba(190, 18, 60, 0.25)' }; 
    if (percentage > thresholds.balanced) return { backgroundColor: applyOpacity(colors.optimal), color: '#ffffff', boxShadow: '0 4px 14px rgba(238, 58, 94, 0.25)' }; 
    if (percentage > thresholds.under) return { backgroundColor: applyOpacity(colors.balanced), color: '#ffffff', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)' }; 
    if (percentage > 0) return { backgroundColor: applyOpacity(colors.under), color: '#475569' }; 
    
    return { backgroundColor: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(0, 0, 0, 0.05)', color: '#94a3b8' };
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
  
  // Logic for what value to display/edit
  // Project Root -> Capacity
  // Everyone else -> Allocation PT
  const displayValue = isProjectRoot ? ptCapacity : ptAllocated;

  return (
    <td 
        className={`p-1 relative cursor-pointer border-l border-slate-200/50 transition-all duration-300 align-middle ${isSelected ? 'bg-primary/5' : ''}`}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseUp={() => onMouseUp(displayValue)}
    >
        <div className={`w-full ${cellHeight} rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 relative group/cell 
            ${isSelected ? 'scale-100' : 'hover:scale-105 hover:brightness-110 hover:shadow-liquid hover:-translate-y-0.5'}
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
                            <span className="text-[11px]">
                                {Number.isInteger(ptAllocated) ? ptAllocated : ptAllocated.toFixed(1)} 
                                {!isProjectChild && ` / ${Number.isInteger(ptCapacity) ? ptCapacity : ptCapacity.toFixed(1)}`}
                            </span>
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