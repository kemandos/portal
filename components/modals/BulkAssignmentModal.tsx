import React from 'react';
import { X, FolderOpen, ChevronDown, Users, Tag } from 'lucide-react';
import { Resource } from '../../types';
import { useBulkAssignmentLogic } from '../../hooks/useBulkAssignmentLogic';
import { BulkMonthSelector } from './bulk-assignment/BulkMonthSelector';
import { BulkAllocationTable } from './bulk-assignment/BulkAllocationTable';
import { BulkEmployeeSearch } from './bulk-assignment/BulkEmployeeSearch';

interface BulkAssignmentModalProps {
  onClose: () => void;
  isOpen: boolean;
  selectedIds: string[];
  currentData: Resource[];
  initialMonths?: string[];
}

export const BulkAssignmentModal: React.FC<BulkAssignmentModalProps> = ({ onClose, isOpen, selectedIds, currentData, initialMonths }) => {
  
  const { state, actions } = useBulkAssignmentLogic(isOpen, selectedIds, currentData, initialMonths);
  const { 
    activeMonths, allocations, searchTerm, isSearchOpen, isMonthPickerOpen, 
    selectedEmployees, searchResults, availableMonths, visibleTotal, searchRef, monthPickerRef,
    employeeRoles
  } = state;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-4xl bg-[#FDFBF7]/90 backdrop-blur-2xl rounded-2xl shadow-glass border border-white/50 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 ease-spring">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100/30 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/10">
               <Users size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Bulk Assignment</h3>
              <p className="text-xs text-slate-500">Assign multiple employees to a project</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            
            {/* Project Select - Full Width */}
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 block">Project</label>
                <div className="relative group">
                    <FolderOpen className="absolute left-3 top-3 text-gray-400" size={18} />
                    <select className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 rounded-lg text-sm font-medium text-slate-900 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-white/80 transition-colors outline-none backdrop-blur-sm">
                        <option>E-Commerce Platform Redesign</option>
                        <option>Internal HR Dashboard</option>
                        <option>Mobile App Migration</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
                </div>
            </div>

            {/* Month Selector */}
            <BulkMonthSelector 
                activeMonths={activeMonths}
                availableMonths={availableMonths}
                isMonthPickerOpen={isMonthPickerOpen}
                setIsMonthPickerOpen={actions.setIsMonthPickerOpen}
                removeMonth={actions.removeMonth}
                addMonth={actions.addMonth}
                monthPickerRef={monthPickerRef}
            />

            {/* Allocations Section */}
            <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Allocations</label>
                    <span className="text-[10px] text-slate-500 bg-gray-100/50 px-2 py-0.5 rounded-full border border-gray-200/50 font-medium">Step: 0.5 PT</span>
                </div>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                    <BulkAllocationTable 
                        selectedEmployees={selectedEmployees}
                        activeMonths={activeMonths}
                        allocations={allocations}
                        employeeRoles={employeeRoles}
                        handleAllocationChange={actions.handleAllocationChange}
                        handleRemoveEmployee={actions.handleRemoveEmployee}
                        handleRoleChange={actions.handleRoleChange}
                    />
                    <BulkEmployeeSearch 
                        searchTerm={searchTerm}
                        setSearchTerm={actions.setSearchTerm}
                        isSearchOpen={isSearchOpen}
                        setIsSearchOpen={actions.setIsSearchOpen}
                        searchResults={searchResults}
                        handleAddEmployee={actions.handleAddEmployee}
                        searchRef={searchRef}
                    />
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white/40 border-t border-white/50 flex justify-between items-center shrink-0 backdrop-blur-md">
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Total Added:</span>
                <span className="text-sm font-bold text-slate-900">
                    {visibleTotal.toFixed(1)} PT
                </span>
            </div>
            <div className="flex gap-3">
                <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-white/50 rounded-lg transition-colors active:scale-95">
                    Cancel
                </button>
                <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-lg shadow-lg shadow-primary/30 hover:bg-primary-hover hover:shadow-primary/40 transition-all transform active:scale-95">
                    Apply Assignment
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};