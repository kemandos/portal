import React, { useState } from 'react';
import { Search, Minus, Plus, Calendar, Tag, X, AlertTriangle } from 'lucide-react';
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
  addMonth: (month: string) => void;
  removeMonth: (month: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  ptValue: number;
  setPtValue: React.Dispatch<React.SetStateAction<number>>;
  allocations: Record<string, number>;
  setAllocations: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleAllocationChange: (month: string, val: number) => void;
  handleIncrement: () => void;
  capacityStats: { capacity: number, baseLoad: number, projectedTotal: number, isOverCapacity: boolean };
  capacityStatsByMonth: Record<string, any>;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onUnassign: () => void;
  hideFooter?: boolean;
  compactMode?: boolean;
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  mode, viewMode, isCapacityEdit, searchRef, searchTerm, setSearchTerm, isSearchOpen, setIsSearchOpen,
  filteredItems, setSelectedItemType, setSelectedSearchResult, selectedItemType,
  selectedMonth, setSelectedMonth, isMultiMonth, selectedMonths, addMonth, removeMonth,
  selectedRole, setSelectedRole, ptValue, setPtValue, allocations, handleAllocationChange, handleIncrement, capacityStats, capacityStatsByMonth,
  onClose, onSave, onDelete, onUnassign, hideFooter = false, compactMode = false
}) => {
  
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const dynamicLabel = viewMode === 'People' ? 'Project' : 'Employee';
  const showCapacityBar = true;
  
  const containerPadding = compactMode ? "p-4" : "p-6";
  const spaceY = compactMode ? "space-y-5" : "space-y-6";
  const inputPy = compactMode ? "py-2.5" : "py-3";
  const gap = compactMode ? "gap-4" : "gap-6";
  
  const shouldShowRoleSelector = () => {
      if (isCapacityEdit) return false;
      if (mode === 'edit') return true;
      if (mode === 'add' && searchTerm) return true; // Show when searching/selected
      return false;
  };

  const showRoleSelector = shouldShowRoleSelector();

  return (
    <>
      <div className={`${containerPadding} overflow-y-auto ${spaceY} min-h-[300px]`}>
        
        {/* Search Field */}
        <div className="space-y-2 relative" ref={searchRef}>
            <label className="text-sm font-bold text-slate-900">{isCapacityEdit ? 'Project Name' : dynamicLabel}</label>
            <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
                type="text" 
                className={`w-full pl-10 pr-24 ${inputPy} bg-slate-100/50 border border-gray-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm ${mode === 'edit' ? 'text-slate-500 cursor-not-allowed' : ''}`}
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
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 rounded border shadow-sm pointer-events-none transition-colors
                    ${selectedItemType === 'Project' ? 'text-primary bg-primary/5 border-primary/20' : 'text-primary bg-primary/5 border-primary/20'}`}>
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
            <label className="text-sm font-bold text-slate-900 block">Select Months</label>
            
            {/* Multi-Month UI */}
            <div className="flex flex-wrap gap-2">
                {selectedMonths.map(month => (
                    <div key={month} className="flex items-center gap-1 bg-primary/5 text-primary border border-primary/20 rounded-lg px-2 py-1.5 text-xs font-bold animate-in zoom-in-95 duration-200">
                        <Calendar size={12} />
                        <span>{month}</span>
                        {selectedMonths.length > 1 && (
                            <button onClick={() => removeMonth(month)} className="ml-1 p-0.5 rounded hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                ))}
                
                <div className="relative">
                    <button 
                        onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                        className="flex items-center gap-1 bg-white text-slate-500 border border-dashed border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold hover:border-primary hover:text-primary transition-colors"
                    >
                        <Plus size={12} /> Add
                    </button>
                    {isMonthPickerOpen && (
                        <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-48 overflow-y-auto custom-scrollbar p-1">
                            {MONTHS.filter(m => !selectedMonths.includes(m)).map(m => (
                                <button 
                                    key={m}
                                    onClick={() => { addMonth(m); setIsMonthPickerOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Role Selection */}
        {showRoleSelector && (
            <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                <label className="text-sm font-bold text-slate-900 block">Project Role</label>
                <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select 
                        value={selectedRole} 
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className={`w-full pl-10 pr-4 ${inputPy} bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all appearance-none cursor-pointer hover:bg-slate-100`}
                    >
                        <option value="Engineer">Engineer</option>
                        <option value="Analyst">Analyst</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Project Lead">Project Lead</option>
                        <option value="Senior Engineer">Senior Engineer</option>
                        <option value="Managing Consultant">Managing Consultant</option>
                    </select>
                </div>
            </div>
        )}

        {/* Allocation Controls */}
        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 block">
                Allocations <span className="text-xs font-normal text-slate-400 ml-1">(Step 0.5 PT)</span>
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50/80 px-4 py-2 border-b border-gray-200 flex text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    <div className="w-20">Month</div>
                    <div className="w-32 text-center">PT</div>
                    <div className="flex-1 text-right">Load</div>
                </div>
                <div className="divide-y divide-gray-100">
                    {(isMultiMonth ? selectedMonths : [selectedMonth]).map(month => {
                        const val = allocations[month] || 0;
                        const stats = capacityStatsByMonth[month] || capacityStats;
                        return (
                            <div key={month} className="flex items-center px-4 py-3 bg-white hover:bg-slate-50/50 transition-colors">
                                <div className="w-20 text-sm font-bold text-slate-900">{month}</div>
                                <div className="w-32 flex items-center justify-center">
                                    <div className="flex items-center border border-gray-200 rounded-lg bg-white h-9">
                                        <button onClick={() => handleAllocationChange(month, val - 0.5)} className="px-2.5 hover:bg-slate-50 text-slate-500 h-full flex items-center justify-center border-r border-gray-100"><Minus size={14} /></button>
                                        <div className="w-12 text-center text-sm font-bold text-slate-900">{val.toFixed(1)}</div>
                                        <button onClick={() => handleAllocationChange(month, val + 0.5)} className="px-2.5 hover:bg-slate-50 text-slate-500 h-full flex items-center justify-center border-l border-gray-100"><Plus size={14} /></button>
                                    </div>
                                </div>
                                <div className="flex-1 text-right flex flex-col justify-center">
                                    <span className="text-xs font-bold text-slate-700">
                                        {stats?.projectedTotal.toFixed(1)} / {stats?.capacity.toFixed(1)} PT
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wide ${stats?.isOverCapacity ? 'text-emerald-500' : 'text-emerald-500'}`}>
                                        OK
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
        
        {/* Capacity Warning */}
        {!isCapacityEdit && viewMode === 'Projects' && capacityStats.baseLoad >= capacityStats.capacity && !isMultiMonth && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="shrink-0 mt-0.5">
                    <AlertTriangle size={18} className="text-amber-500" />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-amber-900">Over Capacity Warning</h4>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                        Adding this assignment will overbook this employee.
                    </p>
                </div>
            </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900">Notes</label>
            <textarea 
            className={`w-full ${compactMode ? 'p-3' : 'p-4'} bg-slate-50 border border-gray-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none shadow-sm`}
            rows={compactMode ? 2 : 3}
            placeholder="Add details (optional)..."
            />
        </div>

      </div>
    </>
  );
};