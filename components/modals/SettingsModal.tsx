import React, { useState, useEffect } from 'react';
import { X, Sliders, Droplet, Palette, Users, Briefcase } from 'lucide-react';
import { ThemeSettings } from '../../types';

interface SettingsModalProps {
  onClose: () => void;
  isOpen: boolean;
  peopleSettings: ThemeSettings;
  setPeopleSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  projectSettings: ThemeSettings;
  setProjectSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  initialView: 'People' | 'Projects';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  isOpen, 
  peopleSettings, 
  setPeopleSettings, 
  projectSettings, 
  setProjectSettings,
  initialView
}) => {
  const [activeTab, setActiveTab] = useState<'People' | 'Projects'>(initialView);

  // Local state for the form
  const [thresholdColors, setThresholdColors] = useState({
      under: '#f1f5f9',
      balanced: '#10b981',
      optimal: '#f59e0b',
      over: '#dc2626'
  });

  const [thresholds, setThresholds] = useState({
      under: 50,
      balanced: 90,
      over: 100
  });

  const [opacity, setOpacity] = useState(1);

  // Sync local state when tab or isOpen changes
  useEffect(() => {
    if (isOpen) {
        // Determine which settings to load based on active tab
        const currentSettings = activeTab === 'People' ? peopleSettings : projectSettings;

        setThresholdColors({
            under: currentSettings.thresholdColors?.under || '#f1f5f9',
            balanced: currentSettings.thresholdColors?.balanced || '#10b981',
            optimal: currentSettings.thresholdColors?.optimal || '#f59e0b',
            over: currentSettings.thresholdColors?.over || '#dc2626'
        });
        setThresholds({
            under: currentSettings.thresholds?.under || 50,
            balanced: currentSettings.thresholds?.balanced || 90,
            over: currentSettings.thresholds?.over || 100
        });
        setOpacity(currentSettings.heatmapOpacity !== undefined ? currentSettings.heatmapOpacity : 1);
    }
  }, [isOpen, activeTab, peopleSettings, projectSettings]);

  // Handle Tab Switch (reset state to new tab's settings)
  const handleTabChange = (tab: 'People' | 'Projects') => {
      setActiveTab(tab);
      // Effect will handle loading data
  };

  const handleThresholdColorChange = (key: 'under' | 'balanced' | 'optimal' | 'over', val: string) => {
      setThresholdColors(prev => ({ ...prev, [key]: val }));
  };

  const handleThresholdValueChange = (key: 'under' | 'balanced' | 'over', val: string) => {
      const numVal = parseInt(val, 10);
      setThresholds(prev => ({ ...prev, [key]: numVal }));
  };

  const handleSave = () => {
      const setter = activeTab === 'People' ? setPeopleSettings : setProjectSettings;
      
      setter(prev => ({ 
          ...prev, 
          thresholdColors: thresholdColors,
          thresholds: thresholds,
          heatmapOpacity: opacity
      }));
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-[420px] bg-[#FDFBF7]/90 backdrop-blur-2xl rounded-2xl shadow-glass border border-white/50 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/30">
          <h2 className="text-lg font-bold text-slate-900">Heatmap Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/50 transition-colors text-slate-500 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            {/* View Toggle */}
            <div className="flex p-1 bg-slate-200/50 rounded-xl">
                <button 
                    onClick={() => handleTabChange('People')} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'People' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Users size={14} />
                    People View
                </button>
                <button 
                    onClick={() => handleTabChange('Projects')} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'Projects' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Briefcase size={14} />
                    Projects View
                </button>
            </div>

            <div className="space-y-3 pb-4 border-b border-gray-100/30">
                 <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Droplet size={16} className="text-slate-500" />
                    Color Transparency
                </label>
                <div className="flex items-center gap-4">
                    <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={opacity * 100} 
                        onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
                        className="flex-1 h-2 bg-gray-200/50 rounded-lg appearance-none cursor-pointer accent-slate-900" 
                    />
                    <span className="text-xs font-mono font-medium text-slate-600 w-10 text-right">
                        {Math.round(opacity * 100)}%
                    </span>
                </div>
            </div>

            <div className="space-y-5">
                 <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sliders size={16} className="text-slate-500" />
                    Capacity Thresholds ({activeTab})
                </label>
                
                <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-white/40 border border-white/50 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full shadow-sm ring-1 ring-black/5 flex items-center justify-center bg-white/70">
                                    <div className="size-4 rounded-full" style={{ backgroundColor: thresholdColors.under }}></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-700">Under Utilized</span>
                                    <span className="text-[10px] text-slate-400">Below {thresholds.under}%</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    value={thresholds.under}
                                    onChange={(e) => handleThresholdValueChange('under', e.target.value)}
                                    className="w-14 px-2 py-1 text-right text-xs font-bold text-slate-900 bg-white/70 border border-white/60 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                />
                                <span className="text-xs text-slate-500">%</span>
                                <div className="relative size-6 ml-1">
                                    <input 
                                        type="color" 
                                        value={thresholdColors.under} 
                                        onChange={(e) => handleThresholdColorChange('under', e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    <div className="pointer-events-none size-6 rounded border border-white/60 flex items-center justify-center bg-white/70 text-slate-400 hover:text-slate-600 shadow-sm">
                                        <Palette size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={thresholds.under} 
                            onChange={(e) => handleThresholdValueChange('under', e.target.value)}
                            className="w-full h-1.5 bg-gray-200/50 rounded-lg appearance-none cursor-pointer accent-slate-400" 
                        />
                    </div>

                    <div className="p-3 rounded-xl bg-white/40 border border-white/50 space-y-3 shadow-sm">
                         <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full shadow-sm ring-1 ring-black/5 flex items-center justify-center bg-white/70">
                                    <div className="size-4 rounded-full" style={{ backgroundColor: thresholdColors.balanced }}></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-700">Balanced</span>
                                    <span className="text-[10px] text-slate-400">{thresholds.under}% - {thresholds.balanced}%</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    value={thresholds.balanced}
                                    onChange={(e) => handleThresholdValueChange('balanced', e.target.value)}
                                    className="w-14 px-2 py-1 text-right text-xs font-bold text-slate-900 bg-white/70 border border-white/60 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                />
                                <span className="text-xs text-slate-500">%</span>
                                <div className="relative size-6 ml-1">
                                    <input 
                                        type="color" 
                                        value={thresholdColors.balanced} 
                                        onChange={(e) => handleThresholdColorChange('balanced', e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    <div className="pointer-events-none size-6 rounded border border-white/60 flex items-center justify-center bg-white/70 text-slate-400 hover:text-slate-600 shadow-sm">
                                        <Palette size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <input 
                            type="range" 
                            min={thresholds.under} 
                            max="120" 
                            value={thresholds.balanced} 
                            onChange={(e) => handleThresholdValueChange('balanced', e.target.value)}
                            className="w-full h-1.5 bg-gray-200/50 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                        />
                    </div>
                    
                    <div className="p-3 rounded-xl bg-white/40 border border-white/50 space-y-3 shadow-sm">
                         <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full shadow-sm ring-1 ring-black/5 flex items-center justify-center bg-white/70">
                                    <div className="size-4 rounded-full" style={{ backgroundColor: thresholdColors.optimal }}></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-700">Warning</span>
                                    <span className="text-[10px] text-slate-400">{thresholds.balanced}% - {thresholds.over}%</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    value={thresholds.over}
                                    onChange={(e) => handleThresholdValueChange('over', e.target.value)}
                                    className="w-14 px-2 py-1 text-right text-xs font-bold text-slate-900 bg-white/70 border border-white/60 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                />
                                <span className="text-xs text-slate-500">%</span>
                                <div className="relative size-6 ml-1">
                                    <input 
                                        type="color" 
                                        value={thresholdColors.optimal} 
                                        onChange={(e) => handleThresholdColorChange('optimal', e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    <div className="pointer-events-none size-6 rounded border border-white/60 flex items-center justify-center bg-white/70 text-slate-400 hover:text-slate-600 shadow-sm">
                                        <Palette size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <input 
                            type="range" 
                            min={thresholds.balanced} 
                            max="150" 
                            value={thresholds.over} 
                            onChange={(e) => handleThresholdValueChange('over', e.target.value)}
                            className="w-full h-1.5 bg-gray-200/50 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                        />
                    </div>

                     <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/40 border border-white/50 shadow-sm">
                         <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full shadow-sm ring-1 ring-black/5 flex items-center justify-center bg-white/70">
                                <div className="size-4 rounded-full" style={{ backgroundColor: thresholdColors.over }}></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700">Critical</span>
                                <span className="text-[10px] text-slate-400">Above {thresholds.over}%</span>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">&gt;</span>
                            <div className="w-14 px-2 py-1 text-right text-xs font-bold text-slate-400 bg-transparent border border-transparent">
                                {thresholds.over}
                            </div>
                            <span className="text-xs text-slate-500">%</span>
                            <div className="relative size-6 ml-1">
                                <input 
                                    type="color" 
                                    value={thresholdColors.over} 
                                    onChange={(e) => handleThresholdColorChange('over', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <div className="pointer-events-none size-6 rounded border border-white/60 flex items-center justify-center bg-white/70 text-slate-400 hover:text-slate-600 shadow-sm">
                                    <Palette size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <button 
                    onClick={handleSave}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                >
                    Save {activeTab} Preferences
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};