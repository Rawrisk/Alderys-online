import React, { useState } from 'react';
import { SKILLS, LEVEL_2_SKILLS, INITIAL_QUESTS, NORMAL_ADVENTURES, ADVANCED_ADVENTURES, MONSTER_STATS, MONSTER_LEVEL_2_STATS, MONSTER_LEVEL_3_STATS, BOSS_STATS } from '../constants';

interface DevMenuProps {
  onClose: () => void;
}

const DevMenu: React.FC<DevMenuProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('SKILLS');
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');

  // Load initial JSON based on tab
  React.useEffect(() => {
    setError('');
    if (activeTab === 'SKILLS') setJsonText(JSON.stringify(SKILLS, null, 2));
    else if (activeTab === 'LEVEL_2_SKILLS') setJsonText(JSON.stringify(LEVEL_2_SKILLS, null, 2));
    else if (activeTab === 'QUESTS') setJsonText(JSON.stringify(INITIAL_QUESTS, null, 2));
    else if (activeTab === 'NORMAL_ADVENTURES') setJsonText(JSON.stringify(NORMAL_ADVENTURES, null, 2));
    else if (activeTab === 'ADVANCED_ADVENTURES') setJsonText(JSON.stringify(ADVANCED_ADVENTURES, null, 2));
    else if (activeTab === 'MONSTER_STATS') setJsonText(JSON.stringify(MONSTER_STATS, null, 2));
    else if (activeTab === 'MONSTER_LEVEL_2') setJsonText(JSON.stringify(MONSTER_LEVEL_2_STATS, null, 2));
    else if (activeTab === 'MONSTER_LEVEL_3') setJsonText(JSON.stringify(MONSTER_LEVEL_3_STATS, null, 2));
    else if (activeTab === 'BOSS_STATS') setJsonText(JSON.stringify(BOSS_STATS, null, 2));
  }, [activeTab]);

  const [status, setStatus] = useState('');

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (activeTab === 'SKILLS') localStorage.setItem('dev_skills', JSON.stringify(parsed));
      else if (activeTab === 'LEVEL_2_SKILLS') localStorage.setItem('dev_level2_skills', JSON.stringify(parsed));
      else if (activeTab === 'QUESTS') localStorage.setItem('dev_quests', JSON.stringify(parsed));
      else if (activeTab === 'NORMAL_ADVENTURES') localStorage.setItem('dev_normal_adventures', JSON.stringify(parsed));
      else if (activeTab === 'ADVANCED_ADVENTURES') localStorage.setItem('dev_advanced_adventures', JSON.stringify(parsed));
      else if (activeTab === 'MONSTER_STATS') localStorage.setItem('dev_monster_stats', JSON.stringify(parsed));
      else if (activeTab === 'MONSTER_LEVEL_2') localStorage.setItem('dev_monster_level_2_stats', JSON.stringify(parsed));
      else if (activeTab === 'MONSTER_LEVEL_3') localStorage.setItem('dev_monster_level_3_stats', JSON.stringify(parsed));
      else if (activeTab === 'BOSS_STATS') localStorage.setItem('dev_boss_stats', JSON.stringify(parsed));
      
      setStatus('Saved successfully! Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      setError(e.message || 'Invalid JSON');
    }
  };

  const handleReset = () => {
    if (status === 'CONFIRM_RESET') {
      if (activeTab === 'SKILLS') localStorage.removeItem('dev_skills');
      else if (activeTab === 'LEVEL_2_SKILLS') localStorage.removeItem('dev_level2_skills');
      else if (activeTab === 'QUESTS') localStorage.removeItem('dev_quests');
      else if (activeTab === 'NORMAL_ADVENTURES') localStorage.removeItem('dev_normal_adventures');
      else if (activeTab === 'ADVANCED_ADVENTURES') localStorage.removeItem('dev_advanced_adventures');
      else if (activeTab === 'MONSTER_STATS') localStorage.removeItem('dev_monster_stats');
      else if (activeTab === 'MONSTER_LEVEL_2') localStorage.removeItem('dev_monster_level_2_stats');
      else if (activeTab === 'MONSTER_LEVEL_3') localStorage.removeItem('dev_monster_level_3_stats');
      else if (activeTab === 'BOSS_STATS') localStorage.removeItem('dev_boss_stats');
      
      setStatus('Reset successfully! Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setStatus('CONFIRM_RESET');
    }
  };

  const tabs = ['SKILLS', 'LEVEL_2_SKILLS', 'QUESTS', 'NORMAL_ADVENTURES', 'ADVANCED_ADVENTURES', 'MONSTER_STATS', 'MONSTER_LEVEL_2', 'MONSTER_LEVEL_3', 'BOSS_STATS'];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-2xl fantasy-font text-yellow-500">Developer Menu</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <div className="flex border-b border-slate-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === tab ? 'bg-slate-800 text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-400 hover:bg-slate-800/50'}`}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex-1 p-4 flex flex-col gap-2 min-h-0">
          <p className="text-sm text-slate-400">Edit the JSON below to modify game data. Changes are saved to your browser's local storage.</p>
          {error && <div className="p-2 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm">{error}</div>}
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="flex-1 w-full bg-slate-950 border border-slate-700 rounded p-4 text-emerald-400 font-mono text-sm resize-none focus:outline-none focus:border-yellow-500"
            spellCheck={false}
          />
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleReset} 
              className={`px-4 py-2 rounded transition-colors ${status === 'CONFIRM_RESET' ? 'bg-red-600 text-white' : 'bg-red-900/50 text-red-200 hover:bg-red-800/50'}`}
            >
              {status === 'CONFIRM_RESET' ? 'Click again to confirm reset' : 'Reset to Defaults'}
            </button>
            {status && status !== 'CONFIRM_RESET' && (
              <span className="text-emerald-400 text-sm font-medium animate-pulse">{status}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded transition-colors font-medium">
              Save & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevMenu;
