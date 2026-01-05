import React from 'react';
import { LayoutGrid, Settings, User } from 'lucide-react';

interface BottomNavProps {
  onOpenSettings: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenSettings }) => {
  const NavItem = ({ icon: Icon, active = false, onClick, label }: { icon: any, active?: boolean, onClick?: () => void, label: string }) => (
    <button 
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors active:scale-95
        ${active ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}
      `}
    >
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-[100] pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        <NavItem icon={LayoutGrid} label="Dashboard" />
        <NavItem icon={Settings} label="Settings" onClick={onOpenSettings} />
        <NavItem icon={User} label="Profile" />
      </div>
    </nav>
  );
};