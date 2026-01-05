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
  
  const SegmentItem = ({ active, onClick, label, className = "" }: { active: boolean, onClick: () => void, label: string, className?: string }) => (
    <button 
      onClick={onClick}
      className={`
        relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ease-out z-10
        hover:scale-105 active:scale-95 3xl:text-sm 3xl:px-6 3xl:py-2.5
        ${active ? 'text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
        ${className}
      `}
    >
      {/* Active Background Liquid Effect */}
      {active && (
        <div className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg -z-10 animate-in fade-in zoom-in-95 duration-200 shadow-sm" />
      )}
      {/* Hover Light Effect */}
      {!active && (
         <div className="absolute inset-0 bg-white/0 rounded-lg -z-10 hover:bg-white/40 dark:hover:bg-white/10 transition-colors duration-200" />
      )}
      {label}
    </button>
  );

  const TimeRangeItem = ({ range }: { range: string }) => (
    <button 
        onClick={() => setViewState(prev => ({ ...prev, timeRange: range as any }))}
        className={`
            relative px-3 py-1.5 md:py-1 rounded-lg text-xs font-semibold transition-all duration-300 ease-out z-10 flex-1 md:flex-none
            hover:scale-105 active:scale-95 text-center 3xl:text-sm 3xl:px-4 3xl:py-2
            ${viewState.timeRange === range ? 'text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
        `}
    >
        {viewState.timeRange === range && (
                <div className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg -z-10 animate-in fade-in zoom-in-95 duration-200 shadow-sm" />
        )}
        {viewState.timeRange !== range && (
                <div className="absolute inset-0 bg-white/0 rounded-lg -z-10 hover:bg-white/40 dark:hover:bg-white/10 transition-colors duration-200" />
        )}
        {range}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 px-3 py-2 md:px-6 md:py-4 transition-all w-full pointer-events-none">
        {/* Floating Glass Container - Enable pointer events for content */}
        <div className="pointer-events-auto max-w-[1920px] 3xl:max-w-none mx-auto bg-[#FDFBF7]/60 dark:bg-[#151515]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-none px-3 py-2 md:px-4 md:py-2 3xl:px-6 3xl:py-3">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
              
              {/* Row 1: Logo, Toggle, Settings (Mobile) */}
              <div className="flex items-center justify-between w-full md:w-auto gap-4">
                  {/* Logo - Text Only for consistency with sidebar */}
                  <div className="flex items-center gap-3 md:hidden">
                    <div className="size-8 bg-gradient-to-br from-white/80 to-white/20 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center text-primary shadow-lg ring-1 ring-white/60 dark:ring-white/10">
                      <Users size={18} />
                    </div>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900/90 dark:text-slate-100 drop-shadow-sm">Staffing</h1>
                  </div>
                  
                  {/* Desktop Label */}
                  <div className="hidden md:flex items-center gap-2">
                       <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Staffing</h1>
                  </div>

                  {/* Desktop/Tablet View Toggle */}
                  <div className="hidden md:flex bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl border border-white/20 dark:border-white/5 shadow-inner gap-1">
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
                  <div className="md:hidden flex bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl border border-white/20 dark:border-white/5 shadow-inner gap-1 flex-1 max-w-[240px]">
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
                      className="md:hidden size-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:text-primary transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-glow active:scale-95 border border-transparent hover:border-white/50"
                  >
                      <Settings size={20} />
                  </button>
              </div>

              {/* Row 2 (Mobile): Time Range */}
              <div className="flex md:hidden w-full items-center bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl border border-white/20 dark:border-white/5 shadow-inner gap-1">
                  {['3M', '6M', '9M'].map(range => <TimeRangeItem key={range} range={range} />)}
              </div>

              {/* Desktop Right Actions */}
              <div className="hidden md:flex items-center gap-2 justify-end">
                  {/* Time Horizon */}
                  <div className="flex items-center bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl gap-1 mr-2 border border-white/20 dark:border-white/5 shadow-inner">
                      {['3M', '6M', '9M'].map(range => <TimeRangeItem key={range} range={range} />)}
                  </div>
                  
                  <div className="flex items-center gap-1">
                      <button 
                          onClick={onOpenSettings}
                          className="size-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:text-primary transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-glow hover:scale-110 active:scale-95 border border-transparent hover:border-white/50 3xl:size-11"
                      >
                          <Settings size={20} className="3xl:w-6 3xl:h-6" />
                      </button>
                  </div>
              </div>
          </div>
        </div>
    </header>
  );
};