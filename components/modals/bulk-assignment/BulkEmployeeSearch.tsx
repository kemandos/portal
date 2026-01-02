import React from 'react';
import { Search, User, Plus } from 'lucide-react';

interface BulkEmployeeSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  searchResults: any[];
  handleAddEmployee: (id: string) => void;
  searchRef: React.RefObject<HTMLDivElement | null>;
}

export const BulkEmployeeSearch: React.FC<BulkEmployeeSearchProps> = ({
  searchTerm,
  setSearchTerm,
  isSearchOpen,
  setIsSearchOpen,
  searchResults,
  handleAddEmployee,
  searchRef
}) => {
  return (
    <div className="px-3 py-2 bg-white border-t border-gray-200" ref={searchRef}>
        <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <input 
                className="w-full pl-9 pr-4 h-9 text-sm bg-slate-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder-gray-400 transition-colors shadow-sm text-slate-900 outline-none" 
                placeholder="Search employees to add..." 
                type="text"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
            />

            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute bottom-full left-0 w-full mb-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-48 overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
                    {searchResults.map(emp => (
                        <button
                            key={emp.id}
                            onClick={() => handleAddEmployee(emp.id)}
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-gray-100 last:border-0 transition-colors flex items-center gap-3 group"
                        >
                                <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors overflow-hidden">
                                {emp.avatar ? (
                                    <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={16} />
                                )}
                                </div>
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-slate-900 truncate">{emp.name}</div>
                                <div className="text-[11px] text-slate-500 truncate">{emp.subtext}</div>
                            </div>
                            <Plus size={16} className="ml-auto text-slate-400 group-hover:text-primary transition-colors" />
                        </button>
                    ))}
                </div>
            )}
            {isSearchOpen && searchTerm && searchResults.length === 0 && (
                <div className="absolute bottom-full left-0 w-full mb-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-3 text-center text-xs text-slate-500 italic animate-in zoom-in-95 duration-200">
                    No employees found
                </div>
            )}
        </div>
    </div>
  );
};