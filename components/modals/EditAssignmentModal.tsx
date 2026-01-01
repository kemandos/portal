import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, Minus, Plus, Trash2, CheckCircle, Lightbulb, Briefcase } from 'lucide-react';
import { MOCK_PROJECTS } from '../../constants';

interface EditAssignmentModalProps {
  onClose: () => void;
  isOpen: boolean;
  initialData?: { resourceId?: string; month?: string };
}

export const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({ onClose, isOpen, initialData }) => {
  const [searchTerm, setSearchTerm] = useState('Redesign - Q3 Marketing');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Defaulting to 1.0 PT (8 hours) for initial view
  const [ptValue, setPtValue] = useState(1.0); 
  const searchRef = useRef<HTMLDivElement>(null);

  const searchableProjects = useMemo(() => {
    const list: { id: string, name: string, subtext: string }[] = [];
    const traverse = (nodes: any[]) => {
        nodes.forEach(node => {
            if (node.type === 'project') {
                list.push({ id: node.id, name: node.name, subtext: node.subtext });
            }
            if (node.children) traverse(node.children);
        });
    };
    traverse(MOCK_PROJECTS);
    return list;
  }, []);

  const filteredProjects = searchableProjects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-[500px] bg-[#FDFBF7]/90 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-glass overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 ease-spring">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/30">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Assignment</h2>
            <p className="text-xs text-slate-500 mt-0.5">Allocation ID: #88234-AX</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/40 transition-colors text-slate-500 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 min-h-[300px]">
          
          <div className="space-y-2 relative" ref={searchRef}>
            <label className="text-sm font-semibold text-slate-900">Project / Employee</label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                className="w-full pl-10 pr-20 py-3 bg-white/50 border border-white/50 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm backdrop-blur-sm"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search projects..."
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 bg-white/60 px-2 py-1 rounded border border-white/50 shadow-sm pointer-events-none">
                Project
              </span>
            </div>

            {isSearchOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map(project => (
                            <button
                                key={project.id}
                                onClick={() => {
                                    setSearchTerm(project.name);
                                    setIsSearchOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50/50 border-b border-gray-50/50 last:border-0 transition-colors group flex items-start gap-3"
                            >
                                <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Briefcase size={14} />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">{project.name}</div>
                                    <div className="text-xs text-slate-500">{project.subtext || 'Active Project'}</div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center italic">
                            No projects found
                        </div>
                    )}
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 block truncate">
                PT Assignment <span className="text-xs font-normal text-slate-400 ml-1">(Step 0.5 PT)</span>
              </label>
              <div className="flex items-center h-12">
                <button 
                  onClick={() => setPtValue(prev => Math.max(0, prev - 0.5))}
                  className="w-12 h-full flex items-center justify-center bg-white/50 border border-white/50 rounded-l-xl hover:bg-white active:bg-slate-100 transition-colors text-slate-600 active:scale-95"
                >
                  <Minus size={18} />
                </button>
                <div className="h-full flex-1 border-y border-white/50 flex items-center justify-center bg-white/30 text-lg font-bold text-slate-900">
                  {ptValue.toFixed(1)} PT
                </div>
                <button 
                  onClick={() => setPtValue(prev => prev + 0.5)}
                  className="w-12 h-full flex items-center justify-center bg-white/50 border border-white/50 rounded-r-xl hover:bg-white active:bg-slate-100 transition-colors text-slate-600 active:scale-95"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 block">Current Load</label>
              <div className="px-4 bg-white/40 rounded-xl border border-white/50 flex flex-col justify-center h-12 gap-1">
                <div className="flex justify-between text-[10px] font-medium text-slate-500">
                  <span>Total: {ptValue} / 20.0 PT</span>
                  <span className="text-emerald-600">Available</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200/50 rounded-full overflow-hidden">
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
              className="w-full p-4 bg-white/50 border border-white/50 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none shadow-sm backdrop-blur-sm"
              rows={3}
              placeholder="Add details about this assignment (optional)..."
              defaultValue="Frontend development focus for the Q3 sprint cycle."
            />
          </div>

        </div>

        <div className="px-6 py-4 bg-white/30 border-t border-white/40 flex items-center justify-between backdrop-blur-sm">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50/50 rounded-lg transition-colors active:scale-95">
            <Trash2 size={18} />
            <span>Delete</span>
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white/60 border border-white/60 rounded-lg hover:bg-white transition-all shadow-sm active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-lg shadow-primary/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <CheckCircle size={18} />
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};