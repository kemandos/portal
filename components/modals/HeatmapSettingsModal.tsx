import React, { useState, useEffect } from 'react';
import { X, Sliders, Palette, Check } from 'lucide-react';
import { ThemeSettings } from '../../types';

interface HeatmapSettingsModalProps {
  onClose: () => void;
  isOpen: boolean;
  peopleSettings: ThemeSettings;
  setPeopleSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  projectSettings: ThemeSettings;
  setProjectSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  initialView: 'People' | 'Projects';
}

export const HeatmapSettingsModal: React.FC<HeatmapSettingsModalProps> = ({ 
  onClose, 
  isOpen, 
  peopleSettings, 
  setPeopleSettings, 
  projectSettings, 
  setProjectSettings,
  initialView
}) => {
  const [activeViewSettings, setActiveViewSettings] = useState<'People' | 'Projects'>(initialView);
  
  // -- Heatmap Settings State --
  const [thresholdColors, setThresholdColors] = useState({
      under: '#f1f5f9',
      low: '#38bdf8',
      balanced: '#10b981',
      optimal: '#f59e0b',
      over: '#dc2626'
  });
  const [thresholds, setThresholds] = useState({
      under: 25,
      low: 75,
      balanced: 95,
      over: 100
  });
  const [opacity, setOpacity] = useState(1);

  // Sync state on open and view change
  useEffect(() => {
    if (isOpen) {
        const currentSettings = activeViewSettings === 'People' ? peopleSettings : projectSettings;
        setThresholdColors({
            under: currentSettings.thresholdColors?.under || '#f1f5f9',
            low: currentSettings.thresholdColors?.low || '#38bdf8',
            balanced: currentSettings.thresholdColors?.balanced || '#10b981',
            optimal: currentSettings.thresholdColors?.optimal || '#f59e0b',
            over: currentSettings.thresholdColors?.over || '#dc2626'
        });
        setThresholds({
            under: currentSettings.thresholds?.under || 25,
            low: currentSettings.thresholds?.low || 75,
            balanced: currentSettings.thresholds?.balanced || 95,
            over: currentSettings.thresholds?.over || 100
        });
        setOpacity(currentSettings.heatmapOpacity !== undefined ? currentSettings.heatmapOpacity : 1);
    }
  }, [isOpen, activeViewSettings, peopleSettings, projectSettings]);

  const handleSave = () => {
      const setter = activeViewSettings === 'People' ? setPeopleSettings : setProjectSettings;
      setter(prev => ({ 
          ...prev, 
          thresholdColors,
          thresholds,
          heatmapOpacity: opacity
      }));
      onClose();
  };

  const handleThresholdColorChange = (key: string, val: string) => {
      setThresholdColors(prev => ({ ...prev, [key]: val }));
  };
  const handleThresholdValueChange = (key: string, val: string) => {
      setThresholds(prev => ({ ...prev, [key]: parseInt(val, 10) }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/30 dark:bg-black/60 backdrop-blur-[4px] transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-xl bg-[#FDFBF7] dark:bg-[#1e1e20] rounded-3xl shadow-2xl border border-white/50 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100/50 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Heatmap & Display</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Customize thresholds and appearance</p>
            </div>
            
            <button onClick={onClose} className="p-2 bg-white dark:bg-white/10 rounded-full shadow-sm hover:bg-slate-50 dark:hover:bg-white/20 transition-colors">
                <X size={20} className="text-slate-500 dark:text-slate-300" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white/40 dark:bg-black/20">
            
            <div className="flex justify-center mb-8">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveViewSettings('People')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeViewSettings === 'People' ? 'bg-white dark:bg-[#1e1e20] shadow-sm text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        People
                    </button>
                    <button 
                        onClick={() => setActiveViewSettings('Projects')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeViewSettings === 'Projects' ? 'bg-white dark:bg-[#1e1e20] shadow-sm text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        Projects
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* Opacity Slider */}
                 <section>
                    <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                        <Sliders size={18} className="text-slate-400 dark:text-slate-500" />
                        Heatmap Opacity
                    </label>
                    <div className="flex items-center gap-4 bg-white dark:bg-[#151515] p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                        <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            value={opacity * 100} 
                            onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
                            className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary" 
                        />
                        <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-300 w-12 text-right">
                            {Math.round(opacity * 100)}%
                        </span>
                    </div>
                </section>

                {/* Thresholds */}
                <section>
                     <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                        <Palette size={18} className="text-slate-400 dark:text-slate-500" />
                        Utilization Thresholds
                    </label>
                    
                    <div className="space-y-4 bg-white dark:bg-[#151515] p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                        {/* Under */}
                        <div className="flex items-center gap-4">
                            <div className="w-24 text-xs font-bold text-slate-500 dark:text-slate-400">Under Utilized</div>
                            <input 
                                type="color" 
                                value={thresholdColors.under}
                                onChange={(e) => handleThresholdColorChange('under', e.target.value)} 
                                className="size-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                            />
                            <div className="flex-1 flex items-center gap-3">
                                <input 
                                    type="range" min="0" max="100" value={thresholds.under}
                                    onChange={(e) => handleThresholdValueChange('under', e.target.value)}
                                    className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
                                />
                                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-10 text-right">{thresholds.under}%</span>
                            </div>
                        </div>

                        {/* Low */}
                        <div className="flex items-center gap-4">
                            <div className="w-24 text-xs font-bold text-slate-500 dark:text-slate-400">Low</div>
                            <input 
                                type="color" 
                                value={thresholdColors.low}
                                onChange={(e) => handleThresholdColorChange('low', e.target.value)} 
                                className="size-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                            />
                            <div className="flex-1 flex items-center gap-3">
                                <input 
                                    type="range" min={thresholds.under} max="100" value={thresholds.low}
                                    onChange={(e) => handleThresholdValueChange('low', e.target.value)}
                                    className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                                />
                                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-10 text-right">{thresholds.low}%</span>
                            </div>
                        </div>

                        {/* Balanced */}
                        <div className="flex items-center gap-4">
                            <div className="w-24 text-xs font-bold text-slate-500 dark:text-slate-400">Balanced</div>
                            <input 
                                type="color" 
                                value={thresholdColors.balanced}
                                onChange={(e) => handleThresholdColorChange('balanced', e.target.value)} 
                                className="size-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                            />
                            <div className="flex-1 flex items-center gap-3">
                                <input 
                                    type="range" min={thresholds.low} max="120" value={thresholds.balanced}
                                    onChange={(e) => handleThresholdValueChange('balanced', e.target.value)}
                                    className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-10 text-right">{thresholds.balanced}%</span>
                            </div>
                        </div>

                        {/* Optimal / Warning */}
                        <div className="flex items-center gap-4">
                            <div className="w-24 text-xs font-bold text-slate-500 dark:text-slate-400">Warning</div>
                            <input 
                                type="color" 
                                value={thresholdColors.optimal}
                                onChange={(e) => handleThresholdColorChange('optimal', e.target.value)} 
                                className="size-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                            />
                            <div className="flex-1 flex items-center gap-3">
                                <input 
                                    type="range" min={thresholds.balanced} max="150" value={thresholds.over}
                                    onChange={(e) => handleThresholdValueChange('over', e.target.value)}
                                    className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-10 text-right">{thresholds.over}%</span>
                            </div>
                        </div>

                        {/* Over */}
                        <div className="flex items-center gap-4">
                            <div className="w-24 text-xs font-bold text-slate-500 dark:text-slate-400">Critical</div>
                            <input 
                                type="color" 
                                value={thresholdColors.over}
                                onChange={(e) => handleThresholdColorChange('over', e.target.value)} 
                                className="size-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                            />
                            <div className="flex-1 flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                                    <div className="h-full bg-red-500 w-full opacity-30"></div>
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-10 text-right">&gt;{thresholds.over}%</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white dark:bg-[#1e1e20] border-t border-gray-100 dark:border-white/5 flex justify-end">
             <button 
                onClick={handleSave}
                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg shadow-slate-900/20 flex items-center gap-2 active:scale-95 transform"
            >
                <Check size={18} />
                Apply Changes
            </button>
        </div>

      </div>
    </div>
  );
};