import React, { useState } from 'react';
import { X, Globe, Moon, Sun, Monitor, ChevronDown, Shield, Users } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'General' | 'Team' | 'Admin'>('General');
  
  const [activeViewSettings] = useState<'People' | 'Projects'>(initialView);

  // -- General Settings State --
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Europe/Berlin (CET)');
  const [systemTheme, setSystemTheme] = useState(false);

  // Determine current effective mode
  const currentMode = activeViewSettings === 'People' ? peopleSettings.mode : projectSettings.mode;

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
      if (mode === 'system') {
          setSystemTheme(true);
          const sysMode = 'light'; // Default fallback
          setPeopleSettings(prev => ({ ...prev, mode: sysMode }));
          setProjectSettings(prev => ({ ...prev, mode: sysMode }));
      } else {
          setSystemTheme(false);
          setPeopleSettings(prev => ({ ...prev, mode: mode }));
          setProjectSettings(prev => ({ ...prev, mode: mode }));
      }
  };

  if (!isOpen) return null;

  const NavItem = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button 
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
            ${activeTab === id 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }
        `}
    >
        <Icon size={18} />
        {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-5xl bg-[#FDFBF7] dark:bg-[#0F0F0F] rounded-3xl shadow-2xl border border-white/50 dark:border-white/10 overflow-hidden flex flex-col md:flex-row h-[70vh] animate-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-50/50 dark:bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-200/60 dark:border-slate-800/60 p-6 flex flex-col gap-6 shrink-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white px-2">Settings</h2>
            <nav className="space-y-1">
                <NavItem id="General" label="General" icon={Globe} />
                <NavItem id="Team" label="Team & Roles" icon={Users} />
                <NavItem id="Admin" label="Admin Settings" icon={Shield} />
            </nav>
            <div className="mt-auto px-2">
                <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors">
                    Close Settings
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/40 dark:bg-black/20 relative">
            
            {/* Header Mobile Close */}
            <div className="absolute top-4 right-4 md:hidden z-10">
                 <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-500 dark:text-slate-400"><X size={20} /></button>
            </div>

            {/* General Settings */}
            {activeTab === 'General' && (
                <div className="p-8 max-w-3xl animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">General Settings</h3>
                    
                    {/* Appearance */}
                    <section className="mb-10 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Monitor className="text-slate-400" size={20} />
                            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Appearance</h4>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 pl-7">Customize how the application looks on your device.</p>
                        
                        <div className="pl-7 grid grid-cols-3 gap-4 max-w-md">
                            <button 
                                onClick={() => handleThemeChange('light')}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border font-bold text-sm transition-all
                                    ${!systemTheme && currentMode === 'light' 
                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <Sun size={16} /> Light
                            </button>
                            <button 
                                onClick={() => handleThemeChange('dark')}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border font-bold text-sm transition-all
                                    ${!systemTheme && currentMode === 'dark' 
                                        ? 'bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-900/20' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <Moon size={16} /> Dark
                            </button>
                            <button 
                                onClick={() => handleThemeChange('system')}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border font-bold text-sm transition-all
                                    ${systemTheme 
                                        ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <Monitor size={16} /> System
                            </button>
                        </div>
                    </section>

                    <hr className="border-slate-100 dark:border-slate-800 my-8" />

                    {/* Language */}
                    <section className="mb-10 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe className="text-slate-400" size={20} />
                            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Language</h4>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 pl-7">Select your preferred language for the interface.</p>
                        
                        <div className="pl-7 max-w-md relative">
                            <select 
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-primary focus:border-primary block p-3 pr-10 shadow-sm font-medium outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            >
                                <option>English</option>
                                <option>Deutsch</option>
                                <option>Français</option>
                                <option>Español</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </section>

                     <hr className="border-slate-100 dark:border-slate-800 my-8" />

                    {/* Timezone */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="size-5 rounded-full border-2 border-slate-400 flex items-center justify-center">
                                <div className="w-2 h-0.5 bg-slate-400 rounded-full" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Timezone</h4>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 pl-7">Your local timezone for date and time display.</p>
                        
                        <div className="pl-7 max-w-md relative">
                            <select 
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-primary focus:border-primary block p-3 pr-10 shadow-sm font-medium outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            >
                                <option>Europe/Berlin (CET)</option>
                                <option>Europe/London (GMT)</option>
                                <option>America/New_York (EST)</option>
                                <option>America/Los_Angeles (PST)</option>
                                <option>Asia/Tokyo (JST)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </section>
                </div>
            )}

            {/* Placeholder Tabs */}
            {(activeTab === 'Team' || activeTab === 'Admin') && (
                <div className="p-10 flex flex-col items-center justify-center h-full text-center animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        {activeTab === 'Team' ? <Users size={40} className="text-slate-300 dark:text-slate-600" /> : <Shield size={40} className="text-slate-300 dark:text-slate-600" />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{activeTab === 'Team' ? 'Team & Roles' : 'Admin Settings'}</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                        This section contains configuration options for {activeTab === 'Team' ? 'managing team permissions and roles.' : 'system-wide administrative tasks.'}
                    </p>
                    <button className="mt-6 px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Available in Pro Plan
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};