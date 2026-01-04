import React from 'react';
import { Resource, ViewState, ThemeSettings, SelectionRange } from '../types';
import { Tooltip } from './Tooltip';
import { useHeatmapLogic } from '../hooks/useHeatmapLogic';
import { HeatmapHeader } from './heatmap/HeatmapHeader';
import { HeatmapRow } from './heatmap/HeatmapRow';

interface HeatmapProps {
  data: Resource[];
  viewMode: ViewState['mode'];
  timeRange: ViewState['timeRange'];
  onItemClick: (id: string) => void;
  onSelectionChange: (ids: string[]) => void;
  selectedIds: string[];
  themeSettings?: ThemeSettings;
  density?: 'comfortable' | 'compact';
  selectionRange: SelectionRange | null;
  onSelectionRangeChange: (range: SelectionRange | null) => void;
  onCellClick: (resourceId: string, month: string) => void;
  expandedRows: Record<string, boolean>;
  setExpandedRows: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedMonthIndices?: number[];
  onMonthSelectionChange?: (indices: number[]) => void;
  onAddChild?: (resourceId: string) => void;
  onInlineSave?: (resourceId: string, month: string, value: number, isCapacity: boolean) => void;
  isPortraitTablet?: boolean;
}

export const Heatmap: React.FC<HeatmapProps> = ({ 
  data, 
  viewMode, 
  timeRange,
  onItemClick, 
  onSelectionChange, 
  selectedIds,
  themeSettings = { colorTheme: 'rose', cellStyle: 'modern' } as ThemeSettings,
  density = 'comfortable',
  selectionRange,
  onSelectionRangeChange,
  onCellClick,
  expandedRows,
  setExpandedRows,
  selectedMonthIndices = [],
  onMonthSelectionChange,
  onAddChild,
  onInlineSave,
  isPortraitTablet = false
}) => {
  const { state, actions } = useHeatmapLogic({
      data,
      viewMode,
      timeRange,
      expandedRows,
      selectedMonthIndices,
      selectionRange,
      onSelectionRangeChange,
      onCellClick,
      onInlineSave,
      onMonthSelectionChange
  });

  const { visibleMonths, allSelectableIds, flattenedRows, editingCell, tooltipState, bounds } = state;
  const isCompact = density === 'compact';
  const headerPaddingClass = isCompact || isPortraitTablet ? 'px-2 py-2.5 3xl:px-3 3xl:py-3.5' : 'px-4 py-3 3xl:px-6 3xl:py-4';

  return (
    <div className="bg-[#FDFBF7]/60 backdrop-blur-2xl rounded-3xl shadow-glass border border-white/50 overflow-hidden flex flex-col h-full w-full select-none"
         onMouseUp={actions.stopDragging}>
        
        <Tooltip content={tooltipState?.content} position={tooltipState?.position || null} />

        <div className="flex-1 relative w-full overflow-auto hide-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0 table-fixed">
                <colgroup>
                    {viewMode === 'People' && (
                        <col className={isCompact || isPortraitTablet ? "w-[40px] 3xl:w-[48px]" : "w-[48px] 3xl:w-[56px]" } />
                    )}
                    <col className={isPortraitTablet ? "w-[180px]" : "w-[240px] 3xl:w-[320px] 4xl:w-[400px]"} />
                    {visibleMonths.map(m => <col key={m} className={isPortraitTablet ? "w-[90px]" : ""} />)}
                </colgroup>
                
                <HeatmapHeader 
                    visibleMonths={visibleMonths}
                    allSelectableIds={allSelectableIds}
                    selectedIds={selectedIds}
                    onSelectionChange={onSelectionChange}
                    viewMode={viewMode}
                    headerPaddingClass={headerPaddingClass}
                    selectedMonthIndices={selectedMonthIndices}
                    bounds={bounds}
                    flattenedRowsLength={flattenedRows.length}
                    handleHeaderMouseDown={actions.handleHeaderMouseDown}
                    handleHeaderMouseEnter={actions.handleHeaderMouseEnter}
                    handleMonthHeaderClick={actions.handleMonthHeaderClick}
                    density={density}
                    isPortraitTablet={isPortraitTablet}
                    setTooltipState={actions.setTooltipState}
                />

                <tbody className="divide-y divide-slate-200">
                    {flattenedRows.map((row, rowIndex) => (
                        <HeatmapRow 
                            key={row.key}
                            row={row}
                            rowIndex={rowIndex}
                            viewMode={viewMode}
                            selectedIds={selectedIds}
                            visibleMonths={visibleMonths}
                            bounds={bounds}
                            selectedMonthIndices={selectedMonthIndices}
                            editingCell={editingCell}
                            expandedRows={expandedRows}
                            themeSettings={themeSettings}
                            onSelectionChange={onSelectionChange}
                            onAddChild={onAddChild}
                            onItemClick={onItemClick}
                            setExpandedRows={setExpandedRows}
                            actions={actions}
                            density={density}
                            isPortraitTablet={isPortraitTablet}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};