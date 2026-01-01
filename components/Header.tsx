import React from 'react';
import { LayoutGrid, Settings } from 'lucide-react';
import { ViewState } from '../types';

interface HeaderProps {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  onOpenSettings: () => void;
  isDesktop?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ viewState, setViewState, onOpenSettings, isDesktop = true }) => {
  
  // Helper for Segmented Control Item
  const SegmentItem = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
    <button 
      onClick={onClick}
      className={`
        relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ease-out z-10
        hover:scale-105 active:scale-95
        ${active ? 'text-primary shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}
      `}
    >
      {/* Active Background Liquid Effect */}
      {active && (
        <div className="absolute inset-0 bg-white rounded-lg -z-10 animate-in fade-in zoom-in-95 duration-200 shadow-sm" />
      )}
      {/* Hover Light Effect */}
      {!active && (
         <div className="absolute inset-0 bg-white/0 rounded-lg -z-10 hover:bg-white/40 transition-colors duration-200" />
      )}
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 px-4 md:px-6 py-4 transition-all">
        {/* Floating Glass Container */}
        <div className="max-w-[1600px] mx-auto bg-[#FDFBF7]/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] px-4 py-2 flex items-center justify-between gap-4">
          
          {/* Logo & View Toggle */}
          <div className="flex items-center gap-4 min-w-[200px]">
            <div className="size-9 bg-gradient-to-br from-white/80 to-white/20 rounded-xl flex items-center justify-center text-primary shadow-lg shadow-primary/10 ring-1 ring-white/60">
              <LayoutGrid size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden md:block text-slate-900/90 drop-shadow-sm">Capacity Planner</h1>
            
            {/* Desktop Toggle (Liquid Segmented Control) */}
            <div className={`hidden md:flex bg-gray-100/30 backdrop-blur-sm p-1 rounded-xl ml-4 border border-white/20 shadow-inner gap-1`}>
              <SegmentItem 
                active={viewState.mode === 'People'} 
                onClick={() => setViewState(prev => ({ ...prev, mode: 'People', selectedIds: [] }))}
                label="People" 
              />
              <SegmentItem 
                active={viewState.mode === 'Projects'} 
                onClick={() => setViewState(prev => ({ ...prev, mode: 'Projects', selectedIds: [] }))}
                label="Projects" 
              />
            </div>
          </div>

          {/* Mobile View Toggle */}
          <div className="md:hidden flex bg-gray-100/30 backdrop-blur-sm p-1 rounded-xl border border-white/20 shadow-inner">
              <SegmentItem 
                active={viewState.mode === 'People'} 
                onClick={() => setViewState(prev => ({ ...prev, mode: 'People', selectedIds: [] }))}
                label="People" 
              />
              <SegmentItem 
                active={viewState.mode === 'Projects'} 
                onClick={() => setViewState(prev => ({ ...prev, mode: 'Projects', selectedIds: [] }))}
                label="Projects" 
              />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 min-w-[200px] justify-end">
             {/* Time Horizon */}
             <div className="hidden lg:flex items-center bg-gray-100/30 backdrop-blur-sm p-1 rounded-xl gap-1 mr-2 border border-white/20 shadow-inner">
                {['3M', '6M', '9M'].map((range) => (
                    <button 
                        key={range}
                        onClick={() => setViewState(prev => ({ ...prev, timeRange: range as any }))}
                        className={`
                            relative px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ease-out z-10
                            hover:scale-105 active:scale-95
                            ${viewState.timeRange === range ? 'text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                        `}
                    >
                        {viewState.timeRange === range && (
                             <div className="absolute inset-0 bg-white rounded-lg -z-10 animate-in fade-in zoom-in-95 duration-200 shadow-sm" />
                        )}
                        {viewState.timeRange !== range && (
                             <div className="absolute inset-0 bg-white/0 rounded-lg -z-10 hover:bg-white/40 transition-colors duration-200" />
                        )}
                        {range}
                    </button>
                ))}
             </div>
             
             <div className="flex items-center gap-1">
                <button 
                    onClick={onOpenSettings}
                    className="size-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-primary transition-all duration-300 hover:bg-white/60 hover:shadow-glow hover:scale-110 active:scale-95 border border-transparent hover:border-white/50"
                >
                    <Settings size={20} />
                </button>
             </div>
          </div>
        </div>
    </header>
  );
};