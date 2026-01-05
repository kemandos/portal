import React from 'react';
import { X, LayoutGrid, Users, PieChart, FileText, Settings, LogOut, Sun, Moon } from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ 
  isOpen, 
  onClose, 
  onOpenSettings,
  isDarkMode,
  toggleTheme
}) => {
  if (!isOpen) return null;

  const NavItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200
            ${active 
                ? 'bg-primary/10 text-primary font-bold shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
            }
        `}
    >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        {label}
    </button>
  );

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 left-0 z-[110] w-[280px] bg-[#FDFBF7] dark:bg-[#0c0c0e] shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col border-r border-white/20 dark:border-white/5">
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
                <div className="size-10 bg-gradient-to-br from-primary to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 text-white">
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white drop-shadow-sm">
                        <path d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2ZM16 26C10.477 26 6 21.523 6 16C6 10.477 10.477 6 16 6C21.523 6 26 10.477 26 16C26 21.523 21.523 26 16 26Z" fill="currentColor" fillOpacity="0.2"/>
                        <path d="M16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24C20.4183 24 24 20.4183 24 16C24 11.5817 20.4183 8 16 8ZM16 21C13.2386 21 11 18.7614 11 16C11 13.2386 13.2386 11 16 11C18.7614 11 21 13.2386 21 16C21 18.7614 18.7614 21 16 21Z" fill="currentColor"/>
                    </svg>
                </div>
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">TAOD</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* User Profile */}
        <div className="p-6 pb-2">
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                    <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">Admin User</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">admin@taod.com</p>
                </div>
            </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            <NavItem icon={LayoutGrid} label="Dashboard" onClick={onClose} />
            <NavItem icon={Users} label="Staffing" active={true} onClick={onClose} />
            <NavItem icon={PieChart} label="Reports" onClick={onClose} />
            <NavItem icon={FileText} label="Documents" onClick={onClose} />
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-white/50 dark:bg-black/10">
            
            <NavItem icon={Settings} label="Settings" onClick={() => { onClose(); onOpenSettings(); }} />

            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <button 
                    onClick={() => !isDarkMode && toggleTheme()}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${!isDarkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Sun size={16} /> Light
                </button>
                <button 
                    onClick={() => isDarkMode && toggleTheme()}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${isDarkMode ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Moon size={16} /> Dark
                </button>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white font-bold transition-colors">
                <LogOut size={18} />
                Log Out
            </button>
        </div>

      </div>
    </>
  );
};