import React from 'react';
import { X, ArrowLeft, Check } from 'lucide-react';
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
  onSave: (data: { mode: 'edit' | 'add', resourceId: string, parentId?: string, month: string, months?: string[], pt: number, newItem?: any, isCapacityEdit?: boolean, role?: string }) => void;
  onDelete: (resourceId: string, parentId?: string, month?: string, months?: string[]) => void;
}

export const MobileEditAssignmentModal: React.FC<EditAssignmentModalProps> = (props) => {
  const { onClose, isOpen } = props;
  
  const { state, actions } = useEditAssignmentLogic(props);
  const { 
    mode, internalMode, listAssignments, listEmployee, selectedMonths, isCapacityEdit, parentResource
  } = state;

  if (!isOpen) return null;

  const dynamicLabel = props.viewMode === 'People' ? 'Project' : 'Employee';
  const isMultiMonth = selectedMonths.length > 1;

  const getTitle = () => {
      if (internalMode === 'list') return `${state.selectedMonth}`;
      if (isMultiMonth) return `Bulk Edit`;
      if (isCapacityEdit) return 'Edit Budget';
      if (mode === 'add') return `Add ${dynamicLabel}`;
      return 'Edit Assignment';
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
        
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
             {internalMode === 'form' && listEmployee ? (
                 <button onClick={actions.handleBackToList} className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-900 transition-colors">
                     <ArrowLeft size={22} />
                 </button>
             ) : (
                 <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-900 transition-colors">
                     <X size={22} />
                 </button>
             )}
            <div className="flex flex-col">
                <h2 className="text-lg font-bold text-slate-900 leading-none">{getTitle()}</h2>
                {parentResource && (
                    <p className="text-xs font-medium text-slate-500 mt-1 truncate max-w-[200px]">{mode === 'edit' ? `For: ${parentResource.name}` : `To: ${parentResource.name}`}</p>
                )}
            </div>
          </div>
          
          {internalMode === 'form' && (
              <button 
                onClick={actions.handleSaveClick}
                disabled={props.viewMode === 'People' && state.capacityStats.isOverCapacity}
                className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all"
              >
                  Save
              </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30 pb-safe">
            {internalMode === 'list' && (
                <AssignmentList 
                    assignments={listAssignments}
                    selectedMonth={state.selectedMonth}
                    onDelete={actions.handleListDelete}
                    onEdit={actions.handleEditAssignment}
                    onAdd={actions.handleAddAssignment}
                />
            )}

            {internalMode === 'form' && (
                <div className="pb-8">
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
                        selectedRole={state.selectedRole}
                        setSelectedRole={actions.setSelectedRole}
                        ptValue={state.ptValue}
                        setPtValue={actions.setPtValue}
                        handleIncrement={actions.handleIncrement}
                        capacityStats={state.capacityStats}
                        onClose={onClose}
                        onSave={actions.handleSaveClick}
                        onDelete={actions.handleDeleteClick}
                        onUnassign={actions.handleUnassignClick}
                    />
                </div>
            )}
        </div>
    </div>
  );
};
