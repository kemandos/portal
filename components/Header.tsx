import React from 'react';
import { Users, Settings } from 'lucide-react';
import { ViewState } from '../types';

interface HeaderProps {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  onOpenSettings: () => void;
  isDesktop?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ viewState, setViewState, onOpenSettings, isDesktop = true }) => {
  
  // Helper for Segmented Control Item
  const SegmentItem = ({ active, onClick, label, className = "" }: { active: boolean, onClick: () => void, label: string, className?: string }) => (
    <button 
      onClick={onClick}
      className={`
        relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ease-out z-10
        hover:scale-105 active:scale-95
        ${active ? 'text-primary shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}
        ${className}
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

  const TimeRangeItem = ({ range }: { range: string }) => (
    <button 
        onClick={() => setViewState(prev => ({ ...prev, timeRange: range as any }))}
        className={`
            relative px-3 py-1.5 md:py-1 rounded-lg text-xs font-semibold transition-all duration-300 ease-out z-10 flex-1 md:flex-none
            hover:scale-105 active:scale-95 text-center
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
  );

  return (
    <header className="sticky top-0 z-40 px-3 py-2 md:px-6 md:py-4 transition-all w-full pointer-events-none">
        {/* Floating Glass Container - Enable pointer events for content */}
        <div className="pointer-events-auto max-w-[1920px] mx-auto bg-[#FDFBF7]/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] px-3 py-2 md:px-4 md:py-2">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
              
              {/* Row 1: Logo, Toggle, Settings (Mobile) */}
              <div className="flex items-center justify-between w-full md:w-auto gap-4">
                  {/* Logo */}
                  <div className="flex items-center gap-3">
                    <div className="size-8 md:size-9 bg-gradient-to-br from-white/80 to-white/20 rounded-xl flex items-center justify-center text-primary shadow-lg shadow-primary/10 ring-1 ring-white/60">
                      <Users size={18} />
                    </div>
                    <h1 className="text-lg font-bold tracking-tight hidden md:block text-slate-900/90 drop-shadow-sm">Staffing</h1>
                  </div>

                  {/* Desktop/Tablet View Toggle */}
                  <div className="hidden md:flex bg-gray-100/30 backdrop-blur-sm p-1 rounded-xl border border-white/20 shadow-inner gap-1">
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

                  {/* Mobile View Toggle */}
                  <div className="md:hidden flex bg-gray-100/30 backdrop-blur-sm p-1 rounded-xl border border-white/20 shadow-inner gap-1 flex-1 max-w-[240px]">
                      <SegmentItem 
                        active={viewState.mode === 'People'} 
                        onClick={() => setViewState(prev => ({ ...prev, mode: 'People', selectedIds: [] }))}
                        label="People"
                        className="flex-1"
                      />
                      <SegmentItem 
                        active={viewState.mode === 'Projects'} 
                        onClick={() => setViewState(prev => ({ ...prev, mode: 'Projects', selectedIds: [] }))}
                        label="Projects"
                        className="flex-1"
                      />
                  </div>

                  {/* Mobile Settings */}
                  <button 
                      onClick={onOpenSettings}
                      className="md:hidden size-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-primary transition-all duration-300 hover:bg-white/60 hover:shadow-glow active:scale-95 border border-transparent hover:border-white/50"
                  >
                      <Settings size={20} />
                  </button>
              </div>

              {/* Row 2 (Mobile): Time Range */}
              <div className="flex md:hidden w-full items-center bg-gray-100/30 backdrop-blur-sm p-1 rounded-xl border border-white/20 shadow-inner gap-1">
                  {['3M', '6M', '9M'].map(range => <TimeRangeItem key={range} range={range} />)}
              </div>

              {/* Desktop Right Actions */}
              <div className="hidden md:flex items-center gap-2 justify-end">
                  {/* Time Horizon */}
                  <div className="flex items-center bg-gray-100/30 backdrop-blur-sm p-1 rounded-xl gap-1 mr-2 border border-white/20 shadow-inner">
                      {['3M', '6M', '9M'].map(range => <TimeRangeItem key={range} range={range} />)}
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
        </div>
    </header>
  );
};