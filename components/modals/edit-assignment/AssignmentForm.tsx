import React from 'react';
import { Search, Minus, Plus, Trash2, Check, UserMinus, User, Briefcase, Calendar, Tag, X } from 'lucide-react';
import { MONTHS } from '../../../constants';

interface AssignmentFormProps {
  mode: 'edit' | 'add';
  viewMode: 'People' | 'Projects';
  isCapacityEdit: boolean;
  searchRef: React.RefObject<HTMLDivElement | null>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  filteredItems: any[];
  setSelectedItemType: (type: 'Project' | 'Employee') => void;
  setSelectedSearchResult: (item: any) => void;
  selectedItemType: 'Project' | 'Employee';
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  isMultiMonth: boolean;
  selectedMonths: string[];
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  ptValue: number;
  setPtValue: React.Dispatch<React.SetStateAction<number>>;
  handleIncrement: () => void;
  capacityStats: { capacity: number, baseLoad: number, projectedTotal: number, isOverCapacity: boolean };
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onUnassign: () => void;
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  mode, viewMode, isCapacityEdit, searchRef, searchTerm, setSearchTerm, isSearchOpen, setIsSearchOpen,
  filteredItems, setSelectedItemType, setSelectedSearchResult, selectedItemType,
  selectedMonth, setSelectedMonth, isMultiMonth, selectedMonths,
  selectedRole, setSelectedRole, ptValue, setPtValue, handleIncrement, capacityStats,
  onClose, onSave, onDelete, onUnassign
}) => {
  
  const dynamicLabel = viewMode === 'People' ? 'Project' : 'Employee';
  const showCapacityBar = true;
  
  const shouldShowRoleSelector = () => {
      if (isCapacityEdit) return false;
      if (mode === 'edit') return true;
      if (mode === 'add' && searchTerm) return true; // Show when searching/selected
      return false;
  };

  const showRoleSelector = shouldShowRoleSelector();

  return (
    <>
      <div className="p-6 overflow-y-auto space-y-6 min-h-[300px]">
        
        {/* Search Field */}
        <div className="space-y-2 relative" ref={searchRef}>
            <label className="text-sm font-semibold text-slate-900">{isCapacityEdit ? 'Project Name' : dynamicLabel}</label>
            <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
                type="text" 
                className={`w-full pl-10 pr-24 py-3 border border-gray-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm ${mode === 'edit' ? 'bg-gray-50 text-slate-500 cursor-not-allowed' : 'bg-slate-50'}`}
                value={searchTerm}
                onChange={(e) => {
                    if (mode === 'add') {
                        setSearchTerm(e.target.value);
                        setIsSearchOpen(true);
                    }
                }}
                onFocus={() => {
                    if (mode === 'add') setIsSearchOpen(true);
                }}
                disabled={mode === 'edit'}
                placeholder={`Search for a ${dynamicLabel.toLowerCase()}...`}
            />
            {!isCapacityEdit && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded border shadow-sm pointer-events-none transition-colors
                    ${selectedItemType === 'Project' ? 'text-primary bg-primary/5 border-primary/20' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}>
                    {selectedItemType}
                </span>
            )}
            </div>

            {isSearchOpen && mode === 'add' && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setSearchTerm(item.name);
                                    setSelectedItemType(item.type);
                                    setSelectedSearchResult(item);
                                    setIsSearchOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-gray-50 last:border-0 transition-colors group flex items-center gap-3"
                            >
                                <div className={`p-1.5 rounded-lg shrink-0 transition-colors 
                                    ${item.type === 'Project' 
                                        ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' 
                                        : 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                                    {item.type === 'Project' ? <Briefcase size={16} /> : <User size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-slate-900 truncate">{item.name}</div>
                                    <div className="text-xs text-slate-500 truncate">{item.subtext || item.type}</div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center italic">
                            No {selectedItemType === 'Project' ? 'projects' : 'employees'} found
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Month Selection */}
        <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900 block">Select Month</label>
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                {isMultiMonth ? (
                    <div className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-900 cursor-not-allowed">
                        {selectedMonths.join(', ')}
                    </div>
                ) : (
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all appearance-none cursor-pointer hover:bg-slate-100"
                    >
                        {MONTHS.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                )}
                {!isMultiMonth && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-gray-300 pl-4 text-xs font-bold text-slate-500">
                        2024
                    </div>
                )}
            </div>
        </div>

        {/* Role Selection */}
        {showRoleSelector && (
            <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                <label className="text-sm font-semibold text-slate-900 block">Project Role</label>
                <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select 
                        value={selectedRole} 
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all appearance-none cursor-pointer hover:bg-slate-100"
                    >
                        <option value="Engineer">Engineer</option>
                        <option value="Analyst">Analyst</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Project Lead">Project Lead</option>
                    </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-gray-300 pl-4 text-xs font-bold text-slate-500">
                        Select
                    </div>
                </div>
            </div>
        )}

        {/* Allocation Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900 block truncate">
                {isCapacityEdit ? 'Monthly Budget' : 'PT Assignment'} <span className="text-xs font-normal text-slate-400 ml-1">(Step 0.5 PT)</span>
            </label>
            <div className="flex items-center h-12">
                <button 
                onClick={() => setPtValue(prev => Math.max(0, prev - 0.5))}
                className="w-12 h-full flex items-center justify-center bg-slate-50 border border-gray-200 rounded-l-xl hover:bg-white active:bg-slate-100 transition-colors text-slate-600 active:scale-95"
                >
                <Minus size={18} />
                </button>
                <div className="h-full flex-1 border-y border-gray-200 flex items-center justify-center bg-white text-lg font-bold text-slate-900">
                {ptValue.toFixed(1)} PT
                </div>
                <button 
                onClick={handleIncrement}
                disabled={!isCapacityEdit && (viewMode === 'People' ? capacityStats.projectedTotal >= capacityStats.capacity : ptValue >= 20)}
                className="w-12 h-full flex items-center justify-center bg-slate-50 border border-gray-200 rounded-r-xl hover:bg-white active:bg-slate-100 transition-colors text-slate-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-50"
                >
                <Plus size={18} />
                </button>
            </div>
            </div>

            <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900 block">{isCapacityEdit ? 'Budget Utilization' : 'Current Load'} <span className="text-slate-400 font-normal">({selectedMonth})</span></label>
            <div className="px-4 bg-slate-50 rounded-xl border border-gray-200 flex flex-col justify-center h-12 gap-1">
                <div className="flex justify-between text-[10px] font-medium text-slate-500">
                {isCapacityEdit ? (
                    <span>Usage: {capacityStats.projectedTotal.toFixed(1)} / {ptValue.toFixed(1)} PT</span>
                ) : showCapacityBar ? (
                    <span>Total: {capacityStats.projectedTotal.toFixed(1)} / {capacityStats.capacity.toFixed(1)} PT</span>
                ) : (
                    <span>Assignment: {ptValue.toFixed(1)} PT</span>
                )}
                <span className={`${capacityStats.isOverCapacity ? 'text-red-500' : 'text-emerald-600'} font-bold`}>
                    {capacityStats.isOverCapacity ? (isCapacityEdit ? 'Over Budget' : 'Over Capacity') : 'Available'}
                </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full shadow-sm transition-all duration-500 ${capacityStats.isOverCapacity ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, (isCapacityEdit ? (capacityStats.projectedTotal / (ptValue || 1)) : (capacityStats.projectedTotal / (capacityStats.capacity || 1))) * 100)}%` }}
                ></div>
                </div>
            </div>
            </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">Notes</label>
            <textarea 
            className="w-full p-4 bg-slate-50 border border-gray-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none shadow-sm"
            rows={3}
            placeholder="Add details about this assignment (optional)..."
            defaultValue={mode === 'edit' ? "Frontend development focus for the Q3 sprint cycle." : ""}
            />
        </div>

      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {mode === 'edit' && !isCapacityEdit && (
                    <>
                        <button 
                            onClick={onDelete}
                            className="p-2.5 rounded-lg bg-white border border-gray-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95"
                            title={isMultiMonth ? "Clear value for selected months" : "Clear value for this month"}
                        >
                            <Trash2 size={18} />
                        </button>
                        
                        <button 
                            onClick={onUnassign}
                            className="p-2.5 rounded-lg bg-white border border-gray-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95"
                            title="Unassign / Remove Assignment Permanently"
                        >
                            <UserMinus size={18} />
                        </button>
                    </>
                )}
            </div>

            <div className={`flex gap-3 ${mode === 'add' || (mode === 'edit' && isCapacityEdit) ? 'w-full justify-end' : ''}`}>
                <button 
                onClick={onClose}
                className="p-2.5 rounded-lg bg-white border border-gray-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                title="Cancel"
                >
                <X size={18} />
                </button>
                <button 
                onClick={onSave}
                disabled={capacityStats.isOverCapacity && viewMode === 'People'}
                className="p-2.5 rounded-lg bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                title={mode === 'edit' ? (isMultiMonth ? 'Save All' : 'Save Changes') : (mode === 'add' ? 'Add Assignment' : 'Create')}
                >
                <Check size={18} />
                </button>
            </div>
        </div>
    </>
  );
};