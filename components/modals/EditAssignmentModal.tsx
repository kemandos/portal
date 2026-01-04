import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Resource } from '../../types';
import { useEditAssignmentLogic } from '../../hooks/useEditAssignmentLogic';
import { AssignmentList } from './edit-assignment/AssignmentList';
import { AssignmentForm } from './edit-assignment/AssignmentForm';

interface EditAssignmentModalProps {
  onClose: () => void;
  isOpen: boolean;
  initialData?: { resourceId?: string; month?: string; months?: string[]; isAddMode?: boolean };
  viewMode: 'People' | 'Projects';
  currentData: Resource[];
  onSave: (data: { mode: 'edit' | 'add', resourceId: string, parentId?: string, month: string, months?: string[], pt: number, newItem?: any, isCapacityEdit?: boolean, role?: string, allocations?: Record<string, number> }) => void;
  onDelete: (resourceId: string, parentId?: string, month?: string, months?: string[]) => void;
}

export const EditAssignmentModal: React.FC<EditAssignmentModalProps> = (props) => {
  const { onClose, isOpen } = props;
  
  const { state, actions } = useEditAssignmentLogic(props);
  const { 
    mode, internalMode, listAssignments, listEmployee, selectedMonths, isCapacityEdit, parentResource
  } = state;

  if (!isOpen) return null;

  const dynamicLabel = props.viewMode === 'People' ? 'Project' : 'Employee';
  const isMultiMonth = selectedMonths.length > 1;

  const getTitle = () => {
      if (internalMode === 'list') {
          if (selectedMonths.length > 0) return `${selectedMonths.length} Months Selected`;
          return `Assignments: ${state.selectedMonth}`;
      }
      if (isMultiMonth) return `Bulk Edit: ${selectedMonths.length} Months`;
      if (isCapacityEdit) return 'Edit Monthly Budget';
      if (mode === 'add') return `Add ${dynamicLabel}`;
      return 'Edit Assignment';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 ease-spring">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
             {internalMode === 'form' && listEmployee && (
                 <button onClick={actions.handleBackToList} className="p-1 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
                     <ArrowLeft size={20} className="text-slate-500" />
                 </button>
             )}
            <div>
                <h2 className="text-lg font-bold text-slate-900">{getTitle()}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{mode === 'edit' && parentResource ? `Project: ${parentResource.name}` : (mode === 'add' && parentResource ? `To: ${parentResource.name}` : '---')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {internalMode === 'list' && (
            <AssignmentList 
                assignments={listAssignments}
                selectedMonth={state.selectedMonth}
                selectedMonths={selectedMonths}
                onDelete={actions.handleListDelete}
                onEdit={actions.handleEditAssignment}
                onAdd={actions.handleAddAssignment}
                viewMode={props.viewMode}
            />
        )}

        {internalMode === 'form' && (
            <AssignmentForm 
                mode={mode}
                viewMode={props.viewMode}
                isCapacityEdit={isCapacityEdit}
                searchRef={state.searchRef}
                searchTerm={state.searchTerm}
                setSearchTerm={actions.setSearchTerm}
                isSearchOpen={state.isSearchOpen}
                setIsSearchOpen={actions.setIsSearchOpen}
                filteredItems={state.filteredItems}
                setSelectedItemType={actions.setSelectedItemType}
                setSelectedSearchResult={actions.setSelectedSearchResult}
                selectedItemType={state.selectedItemType}
                selectedMonth={state.selectedMonth}
                setSelectedMonth={actions.setSelectedMonth}
                isMultiMonth={isMultiMonth}
                selectedMonths={selectedMonths}
                addMonth={actions.addMonth}
                removeMonth={actions.removeMonth}
                selectedRole={state.selectedRole}
                setSelectedRole={actions.setSelectedRole}
                ptValue={state.ptValue}
                setPtValue={actions.setPtValue}
                allocations={state.allocations}
                setAllocations={actions.setAllocations}
                handleAllocationChange={actions.handleAllocationChange}
                handleIncrement={actions.handleIncrement}
                capacityStats={state.capacityStats}
                capacityStatsByMonth={state.capacityStatsByMonth}
                onClose={onClose}
                onSave={actions.handleSaveClick}
                onDelete={actions.handleDeleteClick}
                onUnassign={actions.handleUnassignClick}
            />
        )}

      </div>
    </div>
  );
};