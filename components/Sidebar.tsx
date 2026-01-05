import React from 'react';
import { LayoutGrid, Users, PieChart, FileText, Settings, Sun, Moon, LogOut, Command } from 'lucide-react';

interface SidebarProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isDarkMode, toggleTheme, onOpenSettings }) => {
  const NavItem = ({ icon: Icon, active = false, onClick }: { icon: any, active?: boolean, onClick?: () => void }) => (
    <button 
      onClick={onClick}
      className={`
        relative rounded-2xl transition-all duration-300 group w-10 h-10 flex items-center justify-center
        ${active 
          ? 'text-primary shadow-[0_0_20px_-5px_rgba(238,58,94,0.5)] bg-white/10 dark:bg-white/5' 
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/20 dark:hover:bg-white/5'
        }
      `}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
      
      {/* Active Indicator - Liquid Dot */}
      {active && (
        <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary/80 to-primary rounded-r-full shadow-[0_0_12px_rgba(238,58,94,0.8)] animate-in fade-in slide-in-from-left-2 duration-300" />
      )}
    </button>
  );

  return (
    <aside className="hidden lg:flex flex-col items-center w-[68px] h-screen py-6 z-50 shrink-0 relative transition-all duration-300">
      
      {/* Liquid Glass Background - Darker for Dark Mode */}
      <div className="absolute inset-0 bg-white/40 dark:bg-[#080808] backdrop-blur-2xl border-r border-white/20 dark:border-white/5 shadow-[4px_0_24px_-8px_rgba(0,0,0,0.1)] dark:shadow-none transition-colors duration-300" />
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center h-full w-full">
        
        {/* Logo Area */}
        <div className="mb-12 flex flex-col items-center gap-1 cursor-pointer group">
          {/* Abstract SVG Logo */}
          <div className="relative size-8 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary drop-shadow-lg filter">
                <path d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2ZM16 26C10.477 26 6 21.523 6 16C6 10.477 10.477 6 16 6C21.523 6 26 10.477 26 16C26 21.523 21.523 26 16 26Z" fill="url(#paint0_linear)" fillOpacity="0.2"/>
                <path d="M16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24C20.4183 24 24 20.4183 24 16C24 11.5817 20.4183 8 16 8ZM16 21C13.2386 21 11 18.7614 11 16C11 13.2386 13.2386 11 16 11C18.7614 11 21 13.2386 21 16C21 18.7614 18.7614 21 16 21Z" fill="url(#paint1_linear)"/>
                <defs>
                <linearGradient id="paint0_linear" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EE3A5E"/>
                <stop offset="1" stopColor="#E11D48"/>
                </linearGradient>
                <linearGradient id="paint1_linear" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EE3A5E"/>
                <stop offset="1" stopColor="#E11D48"/>
                </linearGradient>
                </defs>
            </svg>
          </div>
          
          {/* Text */}
          <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 tracking-[0.1em] opacity-80 group-hover:opacity-100 transition-opacity">TAOD</span>
        </div>

        {/* Main Apps */}
        <div className="flex-1 flex flex-col w-full px-2 items-center justify-center -mt-20 gap-4">
          <NavItem icon={LayoutGrid} />
          <NavItem icon={Users} active={true} />
          <NavItem icon={PieChart} />
          <NavItem icon={FileText} />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-4 w-full px-2 items-center mb-4">
          
          <button 
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-white/20 dark:hover:bg-white/5 transition-all duration-300 active:scale-95 group"
          >
              {isDarkMode ? 
                <Sun size={20} className="group-hover:scale-110 transition-transform duration-300" /> : 
                <Moon size={20} className="group-hover:scale-110 transition-transform duration-300" />
              }
          </button>

          <NavItem icon={Settings} onClick={onOpenSettings} />
          
          <div className="h-px w-8 bg-gradient-to-r from-transparent via-slate-300 dark:via-white/10 to-transparent my-1" />
          
          <button className="size-9 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 overflow-hidden hover:border-primary transition-all duration-300 relative group shadow-lg">
              <img src="https://i.pravatar.cc/150?u=admin" alt="User" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                   <LogOut size={12} className="text-white" />
               </div>
          </button>
        </div>
      </div>
    </aside>
  );
};