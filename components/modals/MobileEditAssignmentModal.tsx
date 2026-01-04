import React from 'react';
import { X, ArrowLeft, Check, Trash2, UserMinus } from 'lucide-react';
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
  
  const anyMonthOverCapacity = isMultiMonth 
    ? selectedMonths.some(m => state.capacityStatsByMonth[m]?.isOverCapacity) 
    : state.capacityStats.isOverCapacity;

  return (
    <>
    <div className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
    <div className="fixed inset-x-0 bottom-0 z-[100] flex flex-col bg-white rounded-t-[32px] animate-in slide-in-from-bottom duration-300 max-h-[90dvh] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Mobile Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white sticky top-0 z-10 rounded-t-[32px] shrink-0">
          <div className="flex items-center gap-3">
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
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30 custom-scrollbar">
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
                        hideFooter={true}
                        compactMode={true}
                    />
                </div>
            )}
        </div>

        {/* Sticky Footer for Form Actions */}
        {internalMode === 'form' && (
            <div className="px-4 py-3 bg-slate-50 border-t border-gray-200 flex items-center justify-between shrink-0 pb-safe z-20">
                    <div className="flex items-center gap-2">
                        {mode === 'edit' && !isCapacityEdit && (
                            <>
                                <button 
                                    onClick={actions.handleDeleteClick}
                                    className="p-3 rounded-xl bg-white border border-gray-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95"
                                    title={isMultiMonth ? "Clear value for selected months" : "Clear value for this month"}
                                >
                                    <Trash2 size={20} />
                                </button>
                                
                                <button 
                                    onClick={actions.handleUnassignClick}
                                    className="p-3 rounded-xl bg-white border border-gray-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95"
                                    title="Unassign / Remove Assignment Permanently"
                                >
                                    <UserMinus size={20} />
                                </button>
                            </>
                        )}
                    </div>

                    <div className={`flex gap-3 ${mode === 'add' || (mode === 'edit' && isCapacityEdit) ? 'w-full justify-end' : ''}`}>
                        <button 
                            onClick={onClose}
                            className="p-3 rounded-xl bg-white border border-gray-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            title="Cancel"
                        >
                            <X size={20} />
                        </button>
                        <button 
                            onClick={actions.handleSaveClick}
                            disabled={anyMonthOverCapacity}
                            className="px-6 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Check size={20} />
                            {mode === 'add' ? 'Add' : 'Save'}
                        </button>
                    </div>
            </div>
        )}
    </div>
    </>
  );
};