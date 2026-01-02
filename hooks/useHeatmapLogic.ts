import { useState, useRef, useMemo, useEffect } from 'react';
import { Resource, ViewState, ThemeSettings, CellCoordinate, SelectionRange } from '../types';
import { MONTHS } from '../constants';

interface UseHeatmapLogicProps {
  data: Resource[];
  viewMode: ViewState['mode'];
  timeRange: ViewState['timeRange'];
  expandedRows: Record<string, boolean>;
  selectedMonthIndices: number[];
  selectionRange: SelectionRange | null;
  onSelectionRangeChange: (range: SelectionRange | null) => void;
  onCellClick: (resourceId: string, month: string) => void;
  onInlineSave?: (resourceId: string, month: string, value: number, isCapacity: boolean) => void;
  onMonthSelectionChange?: (indices: number[]) => void;
}

export interface RowItem {
  type: 'resource' | 'action';
  resource?: Resource;
  parentId?: string;
  depth: number;
  isGroupHeader: boolean;
  key: string;
}

export const useHeatmapLogic = ({
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
}: UseHeatmapLogicProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<CellCoordinate | null>(null);
  const isHeaderDrag = useRef(false);
  const hasDragged = useRef(false);
  
  // Inline Edit State
  const [editingCell, setEditingCell] = useState<{resourceId: string, month: string, value: string} | null>(null);
  
  // Tooltip State
  const [tooltipState, setTooltipState] = useState<{
    content: React.ReactNode;
    position: { x: number; y: number };
  } | null>(null);

  const visibleMonths = useMemo(() => 
    MONTHS.slice(0, timeRange === '3M' ? 3 : timeRange === '6M' ? 6 : 9), 
  [timeRange]);

  // Calculate all selectable IDs (excluding groups and secondary items) recursively
  const allSelectableIds = useMemo(() => {
      const ids: string[] = [];
      const traverse = (nodes: Resource[]) => {
          nodes.forEach(node => {
              const isSelectable = viewMode === 'People' 
                  ? node.type === 'employee' 
                  : node.type === 'project';

              if (isSelectable) {
                  ids.push(node.id);
              }
              if (node.children && node.children.length > 0) {
                  traverse(node.children);
              }
          });
      };
      traverse(data);
      return ids;
  }, [data, viewMode]);

  const flattenedRows = useMemo(() => {
    const rows: RowItem[] = [];
    const traverse = (nodes: Resource[], depth = 0) => {
        nodes.forEach(node => {
            const hasChildren = node.children && node.children.length > 0;
            const isGroupHeader = node.type === 'group'; 
            
            rows.push({ 
                type: 'resource',
                resource: node, 
                depth, 
                isGroupHeader,
                key: node.id
            });

            const shouldHideChildren = viewMode === 'People' && node.type === 'employee';
            
            const isExpanded = shouldHideChildren ? false : (expandedRows[node.id] ?? node.isExpanded);

            if (isExpanded) {
                 if (hasChildren) {
                     let childrenToRender = node.children!;

                     // FILTER: In People view, if months are selected, only show children 
                     // that have active assignments (PT > 0) in the selected months.
                     if (viewMode === 'People' && selectedMonthIndices.length > 0) {
                         const selectedMonthKeys = selectedMonthIndices.map(i => visibleMonths[i]).filter(Boolean);
                         childrenToRender = childrenToRender.filter(child => {
                             return selectedMonthKeys.some(m => (child.allocations[m]?.pt || 0) > 0);
                         });
                     }

                     traverse(childrenToRender, depth + 1);
                 }
                 
                 // Add Action Row (Add Project) 
                 const showActionRow = (viewMode === 'Projects' && node.type === 'project');

                 if (showActionRow) {
                     rows.push({
                         type: 'action',
                         parentId: node.id,
                         depth: depth + 1,
                         isGroupHeader: false,
                         key: `action-${node.id}`
                     });
                 }
            }
        });
    };
    traverse(data);
    return rows;
  }, [data, expandedRows, viewMode, selectedMonthIndices, visibleMonths]);

  const bounds = useMemo(() => {
      if (!selectionRange) return null;
      return {
          minRow: Math.min(selectionRange.start.rowIndex, selectionRange.end.rowIndex),
          maxRow: Math.max(selectionRange.start.rowIndex, selectionRange.end.rowIndex),
          minCol: Math.min(selectionRange.start.monthIndex, selectionRange.end.monthIndex),
          maxCol: Math.max(selectionRange.start.monthIndex, selectionRange.end.monthIndex)
      };
  }, [selectionRange]);

  // --- Handlers ---

  const handleMouseDown = (resourceId: string, monthIndex: number, rowIndex: number) => {
      if (editingCell) return;
      
      const coord = { resourceId, monthIndex, rowIndex };
      dragStartRef.current = coord;
      setIsDragging(false);
      onSelectionRangeChange({ start: coord, end: coord });
  };

  const handleMouseEnter = (resourceId: string, monthIndex: number, rowIndex: number) => {
      if (dragStartRef.current && !editingCell) {
          setIsDragging(true);
          
          let endRowIndex = rowIndex;
          let endResourceId = resourceId;

          if (isHeaderDrag.current) {
             endRowIndex = flattenedRows.length - 1;
             const lastRow = flattenedRows[flattenedRows.length - 1];
             if (lastRow.type === 'resource') {
                 endResourceId = lastRow.resource!.id;
             }
          }

          onSelectionRangeChange({
              start: dragStartRef.current,
              end: { resourceId: endResourceId, monthIndex, rowIndex: endRowIndex }
          });
      }
  };

  const handleMouseUp = (resourceId: string, monthIndex: number, initialValue: string | number, isRootRow: boolean) => {
      if (!isDragging && dragStartRef.current && !editingCell) {
          // Inline Editing condition
          if (viewMode === 'Projects' && isRootRow) {
              const month = visibleMonths[monthIndex];
              setEditingCell({
                  resourceId,
                  month,
                  value: initialValue.toString()
              });
          } else {
              onCellClick(resourceId, visibleMonths[monthIndex]);
          }
      }
      dragStartRef.current = null;
      setIsDragging(false);
  };

  const handleHeaderMouseDown = (e: React.MouseEvent, index: number) => {
      if (flattenedRows.length === 0) return;
      if (e.shiftKey || e.metaKey || e.ctrlKey) return; 

      isHeaderDrag.current = true;
      setIsDragging(true);
      hasDragged.current = false;

      const firstRow = flattenedRows.find(r => r.type === 'resource');
      if (!firstRow || !firstRow.resource) return;

      const startCoord = { 
          resourceId: firstRow.resource.id, 
          rowIndex: 0, 
          monthIndex: index 
      };
      dragStartRef.current = startCoord;
      
      const reversedRows = [...flattenedRows].reverse();
      const lastRow = reversedRows.find(r => r.type === 'resource');
      if (!lastRow || !lastRow.resource) return;

      const endCoord = {
          resourceId: lastRow.resource.id,
          rowIndex: flattenedRows.indexOf(lastRow),
          monthIndex: index
      };
      
      onSelectionRangeChange({ start: startCoord, end: endCoord });
  };

  const handleHeaderMouseEnter = (index: number) => {
      if (!isDragging || !dragStartRef.current) return;
      
      if (isHeaderDrag.current) {
          hasDragged.current = true;
          const start = dragStartRef.current;
          const reversedRows = [...flattenedRows].reverse();
          const lastRow = reversedRows.find(r => r.type === 'resource');
          if (!lastRow || !lastRow.resource) return;

          const end = {
              resourceId: lastRow.resource.id,
              rowIndex: flattenedRows.indexOf(lastRow),
              monthIndex: index
          };
          onSelectionRangeChange({ start, end });
      }
  };

  const handleMonthHeaderClick = (e: React.MouseEvent, monthIndex: number) => {
      if (!onMonthSelectionChange) return;
      if (flattenedRows.length === 0) return;
      if (hasDragged.current) return;

      const isSelected = selectedMonthIndices.includes(monthIndex);
      let newIndices: number[];

      if (isSelected) {
          newIndices = selectedMonthIndices.filter(i => i !== monthIndex);
      } else {
          newIndices = [...selectedMonthIndices, monthIndex];
      }
      onMonthSelectionChange(newIndices);
      onSelectionRangeChange(null);
  };
  
  const handleInlineInputBlur = () => {
      if (editingCell && onInlineSave) {
          const val = parseFloat(editingCell.value);
          const isAssignment = editingCell.resourceId.includes('::');
          let isCapacity = false;
          
          if (!isAssignment) {
              isCapacity = true;
          }
          
          if (!isNaN(val)) {
              onInlineSave(editingCell.resourceId, editingCell.month, val, isCapacity);
          }
      }
      setEditingCell(null);
  };

  const stopDragging = () => {
       dragStartRef.current = null; 
       setIsDragging(false); 
       isHeaderDrag.current = false;
  };

  return {
    state: {
      visibleMonths,
      allSelectableIds,
      flattenedRows,
      editingCell,
      tooltipState,
      isDragging,
      bounds
    },
    actions: {
      setEditingCell,
      setTooltipState,
      handleMouseDown,
      handleMouseEnter,
      handleMouseUp,
      handleHeaderMouseDown,
      handleHeaderMouseEnter,
      handleMonthHeaderClick,
      handleInlineInputBlur,
      stopDragging
    }
  };
};