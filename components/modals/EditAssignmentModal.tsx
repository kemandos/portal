import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, Minus, Plus, Trash2, CheckCircle, Briefcase, User, Calendar } from 'lucide-react';
import { MOCK_PROJECTS, MOCK_PEOPLE, MONTHS } from '../../constants';
import { Resource } from '../../types';

interface EditAssignmentModalProps {
  onClose: () => void;
  isOpen: boolean;
  initialData?: { resourceId?: string; month?: string };
  viewMode: 'People' | 'Projects';
}

export const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({ onClose, isOpen, initialData, viewMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<'Project' | 'Employee'>('Project');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [ptValue, setPtValue] = useState(0.0); 
  const [mode, setMode] = useState<'edit' | 'add'>('add');
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[0]);
  const [targetResource, setTargetResource] = useState<Resource | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Combine Projects and People for search
  const searchableItems = useMemo(() => {
    const list: { id: string, name: string, subtext: string, type: 'Project' | 'Employee', avatar?: string }[] = [];
    
    // Traverse Projects
    const traverseProjects = (nodes: any[]) => {
        nodes.forEach(node => {
            if (node.type === 'project') {
                // Heuristic: Exclude folders (projects that contain other projects) from search results
                // We only want assignable projects
                const isFolder = node.children && node.children.some((c: any) => c.type === 'project');
                if (!isFolder) {
                    list.push({ id: node.id, name: node.name, subtext: node.subtext, type: 'Project' });
                }
            }
            if (node.children) traverseProjects(node.children);
        });
    };
    traverseProjects(MOCK_PROJECTS);

    // Traverse People
    const traversePeople = (nodes: any[]) => {
        nodes.forEach(node => {
            if (node.type === 'employee') {
                list.push({ id: node.id, name: node.name, subtext: node.subtext, type: 'Employee', avatar: node.avatar });
            }
            if (node.children) traversePeople(node.children);
        });
    };
    traversePeople(MOCK_PEOPLE);

    // Remove duplicates based on ID
    return Array.from(new Map(list.map(item => [item.id, item])).values());
  }, []);

  const filteredItems = searchableItems.filter(p => 
    p.type === selectedItemType && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determine context and pre-fill data when modal opens
  useEffect(() => {
    if (isOpen && initialData) {
        // Determine dataset based on current view mode
        const isPeopleView = viewMode === 'People';
        const dataset = isPeopleView ? MOCK_PEOPLE : MOCK_PROJECTS;
        
        // Initialize month
        const initialMonth = initialData.month || MONTHS[0];
        setSelectedMonth(initialMonth);

        let foundResource: Resource | null = null;
        let foundDepth = -1;

        const find = (nodes: Resource[], depth: number): boolean => {
            for (const node of nodes) {
                if (node.id === initialData.resourceId) {
                    foundResource = node;
                    foundDepth = depth;
                    return true;
                }
                if (node.children) {
                    if (find(node.children, depth + 1)) return true;
                }
            }
            return false;
        };

        if (initialData.resourceId) {
             // Search only in the dataset relevant to the current view
            find(dataset, 0);
        }

        if (foundResource) {
            const res = foundResource as Resource;
            setTargetResource(res);
            
            // Logic:
            // If Depth 2 (Child) -> Edit Mode. We are editing a specific assignment.
            // If Depth 1 (Parent) -> Add Mode. We are adding a new assignment to this parent.
            
            if (foundDepth === 2) {
                // Child Row -> Edit Assignment
                setMode('edit');
                setSearchTerm(res.name);
                setSelectedItemType(res.type === 'project' ? 'Project' : 'Employee');
                // Use PT value directly for the selected month
                const allocation = res.allocations[initialMonth];
                setPtValue(allocation ? allocation.pt : 0);
            } else {
                // Parent Row (or Group) -> Add Assignment
                setMode('add');
                setSearchTerm(''); // Empty for search
                setPtValue(0);
                
                // Determine what we are searching for based on View Mode
                if (isPeopleView) {
                    setSelectedItemType('Project');
                } else {
                    setSelectedItemType('Employee');
                }
            }
        }
    }
  }, [isOpen, initialData, viewMode]);

  // Update PT Value when selected month changes (only in Edit mode)
  useEffect(() => {
      if (mode === 'edit' && targetResource) {
          const allocation = targetResource.allocations[selectedMonth];
          setPtValue(allocation ? allocation.pt : 0);
      }
  }, [selectedMonth, mode, targetResource]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            setIsSearchOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const dynamicLabel = viewMode === 'People' ? 'Project' : 'Employee';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 ease-spring">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{mode === 'edit' ? 'Edit Assignment' : 'New Assignment'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Allocation ID: {initialData?.resourceId ? `#${initialData.resourceId.substring(0,5).toUpperCase()}-AX` : '---'}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 min-h-[300px]">
          
          <div className="space-y-2 relative" ref={searchRef}>
            <label className="text-sm font-semibold text-slate-900">{dynamicLabel}</label>
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
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded border shadow-sm pointer-events-none transition-colors
                  ${selectedItemType === 'Project' ? 'text-primary bg-primary/5 border-primary/20' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}>
                {selectedItemType}
              </span>
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

          <div className="space-y-2">
             <label className="text-sm font-semibold text-slate-900 block">Select Month</label>
             <div className="relative">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                 <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all appearance-none cursor-pointer hover:bg-slate-100"
                 >
                     {MONTHS.map(m => (
                         <option key={m} value={m}>{m}</option>
                     ))}
                 </select>
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-gray-300 pl-4 text-xs font-bold text-slate-500">
                     2024
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 block truncate">
                PT Assignment <span className="text-xs font-normal text-slate-400 ml-1">(Step 0.5 PT)</span>
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
                  onClick={() => setPtValue(prev => prev + 0.5)}
                  className="w-12 h-full flex items-center justify-center bg-slate-50 border border-gray-200 rounded-r-xl hover:bg-white active:bg-slate-100 transition-colors text-slate-600 active:scale-95"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 block">Current Load <span className="text-slate-400 font-normal">({selectedMonth})</span></label>
              <div className="px-4 bg-slate-50 rounded-xl border border-gray-200 flex flex-col justify-center h-12 gap-1">
                <div className="flex justify-between text-[10px] font-medium text-slate-500">
                  <span>Total: {ptValue} / 20.0 PT</span>
                  <span className="text-emerald-600 font-bold">Available</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full shadow-sm transition-all duration-500" 
                    style={{ width: `${Math.min(100, (ptValue / 20) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

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

        <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between">
          {mode === 'edit' && (
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95">
                <Trash2 size={18} />
                <span>Delete</span>
            </button>
          )}
          <div className={`flex gap-3 ${mode === 'add' ? 'w-full justify-end' : ''}`}>
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-lg shadow-primary/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <CheckCircle size={18} />
              {mode === 'edit' ? 'Save Changes' : 'Create Assignment'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};