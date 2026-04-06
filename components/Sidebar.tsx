
import React, { useState } from 'react';
import { Player, Unit, Building, HexTile, TileType, Skill, MAX_GOLD, MAX_XP } from '../types';
import { MAX_UNITS, UNIT_STATS, MONSTER_STATS, BOSS_STATS, FACTION_UNIT_IMAGES, FACTION_CAPITAL_IMAGES, DICE, getDiceFromSkill, FACTIONS } from '../constants';
import { ASSETS } from '../assets';

interface SidebarProps {
  players: Player[];
  currentIndex: number;
  units: Unit[];
  buildings: Building[];
  board: HexTile[];
  gameId: string;
  aiSpeed: number;
  isPaused: boolean;
  pauseOnAICombat: boolean;
  isChroniclesVisible: boolean;
  activeYearlyEffects: string[];
  onUpdateSettings: (settings: { aiSpeed?: number; isPaused?: boolean; isChroniclesVisible?: boolean; pauseOnAICombat?: boolean }) => void;
  onSaveGame: () => Promise<void>;
  onGoToMainMenu: () => void;
  onShowLeaderboard: () => void;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ players, currentIndex, units, buildings, board, gameId, aiSpeed, isPaused, pauseOnAICombat, isChroniclesVisible, activeYearlyEffects, onUpdateSettings, onSaveGame, onGoToMainMenu, onShowLeaderboard, onHover, onClearHover }) => {
  const [activeView, setActiveView] = useState<'FACTIONS' | 'UNITS' | 'MONSTERS' | 'SETTINGS' | 'LEADERBOARD'>('FACTIONS');
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const handleSave = async () => {
    setSaveStatus('SAVING');
    try {
      await onSaveGame();
      setSaveStatus('SUCCESS');
      setTimeout(() => setSaveStatus('IDLE'), 3000);
    } catch (error) {
      setSaveStatus('ERROR');
      setTimeout(() => setSaveStatus('IDLE'), 3000);
    }
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('gameId', gameId);
    navigator.clipboard.writeText(url.toString());
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  const getAncientCityVP = (playerId: number) => {
    const playerHexes = new Set<string>();
    units.filter(u => u.playerId === playerId).forEach(u => playerHexes.add(`${u.q},${u.r}`));
    buildings.filter(b => b.playerId === playerId).forEach(b => playerHexes.add(`${b.q},${b.r}`));
    
    let count = 0;
    playerHexes.forEach(hexStr => {
      const [q, r] = hexStr.split(',').map(Number);
      const tile = board.find(t => t.q === q && t.r === r);
      if (tile && tile.type === TileType.ANCIENT_CITY) {
        count++;
      }
    });
    return count;
  };

  const getProductionValues = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { gold: 0, xp: 0, tokenBonus: 0 };

    const playerHexes = new Set<string>();
    units.filter(u => u.playerId === playerId).forEach(u => playerHexes.add(`${u.q},${u.r}`));
    buildings.filter(b => b.playerId === playerId).forEach(b => playerHexes.add(`${b.q},${b.r}`));

    let producedGold = 0;
    let producedXP = 0;
    let goldLostToReduction = 0;

    playerHexes.forEach(hexStr => {
      const [hq, hr] = hexStr.split(',').map(Number);
      const tile = board.find(t => t.q === hq && t.r === hr);
      if (tile) {
        let gold = tile.productionGold || 0;
        if (tile.type === TileType.PLAINS && activeYearlyEffects.includes('PLAINS_GOLD_REDUCTION')) {
          const originalGold = gold;
          gold = Math.ceil(gold / 2);
          goldLostToReduction += (originalGold - gold);
        }
        producedGold += gold;
        producedXP += tile.productionXP || 0;
      }
    });

    let tokenBonus = 0;
    Object.values(player.actionSlots).forEach(count => {
      tokenBonus += (count as number);
    });

    return { gold: producedGold, xp: producedXP, tokenBonus, goldLostToReduction };
  };

  return (
    <div className="w-full md:w-80 shrink-0 bg-slate-900 border-r border-white/10 flex flex-col h-full overflow-hidden">
      <div className="p-4 bg-slate-800/50 border-b border-white/5 flex justify-between items-center">
        <h2 className="fantasy-font text-2xl text-slate-200">
          {activeView === 'FACTIONS' ? 'Factions' : activeView === 'UNITS' ? 'Units' : 'Monsters'}
        </h2>
        <div className="flex flex-wrap justify-end gap-1.5">
          <button 
            onClick={() => setActiveView(activeView === 'LEADERBOARD' ? 'FACTIONS' : 'LEADERBOARD')}
            className={`p-1.5 rounded-lg border transition-all ${activeView === 'LEADERBOARD' ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-800 border-white/10 text-slate-400'}`}
            title="Leaderboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          </button>
          <button 
            onClick={() => setActiveView(activeView === 'SETTINGS' ? 'FACTIONS' : 'SETTINGS')}
            className={`p-1.5 rounded-lg border transition-all ${activeView === 'SETTINGS' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-white/10 text-slate-400'}`}
            title="Game Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button 
            onClick={handleShare}
            className="p-1.5 rounded-lg border bg-slate-800 border-white/10 text-slate-400 hover:text-white hover:border-yellow-500/50 transition-all relative"
            title="Share Game Link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
            {showShareTooltip && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-yellow-600 text-white text-[10px] rounded whitespace-nowrap animate-in fade-in zoom-in duration-200">
                Link Copied!
              </span>
            )}
          </button>
          <button 
            onClick={() => onUpdateSettings({ isChroniclesVisible: !isChroniclesVisible })}
            className={`p-1.5 rounded-lg border transition-all ${isChroniclesVisible ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-800 border-white/10 text-slate-400'}`}
            title={isChroniclesVisible ? "Hide Chronicles" : "Show Chronicles"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </button>
          <button 
            onClick={() => setActiveView(activeView === 'UNITS' ? 'FACTIONS' : 'UNITS')}
            className={`p-1.5 rounded-lg border transition-all ${activeView === 'UNITS' ? 'bg-yellow-600 border-yellow-400 text-white' : 'bg-slate-800 border-white/10 text-slate-400'}`}
            title="Unit Reference"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
          </button>
          <button 
            onClick={() => setActiveView(activeView === 'MONSTERS' ? 'FACTIONS' : 'MONSTERS')}
            className={`p-1.5 rounded-lg border transition-all ${activeView === 'MONSTERS' ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-800 border-white/10 text-slate-400'}`}
            title="Monster Reference"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        {activeView === 'LEADERBOARD' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="fantasy-font text-lg text-amber-500">Leaderboard</h3>
              <button onClick={() => setActiveView('FACTIONS')} className="text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-widest">Back</button>
            </div>
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-1">
              {/* We'll import the Leaderboard component in App.tsx and pass it down or just render it here if we want */}
              {/* For simplicity, I'll just add a placeholder or use the component if I can */}
              <p className="text-[10px] text-slate-400 p-4 text-center italic">View the Hall of Legends to see the greatest conquerors of Alderys.</p>
              <button 
                onClick={onShowLeaderboard}
                className="w-full py-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/30 transition-all"
              >
                Open Full Leaderboard
              </button>
            </div>
          </div>
        ) : activeView === 'SETTINGS' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="fantasy-font text-lg text-indigo-400">Game Settings</h3>
              <button onClick={() => setActiveView('FACTIONS')} className="text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-widest">Back</button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Chronicles Area</span>
                  <button 
                    onClick={() => onUpdateSettings({ isChroniclesVisible: !isChroniclesVisible })}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${isChroniclesVisible ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-700 border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    {isChroniclesVisible ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Pause on AI Combat</span>
                  <button 
                    onClick={() => onUpdateSettings({ pauseOnAICombat: !pauseOnAICombat })}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${pauseOnAICombat ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-700 border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    {pauseOnAICombat ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">AI Game Pace</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUpdateSettings({ isPaused: !isPaused })}
                      className={`p-2 rounded-lg border transition-all ${isPaused ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-700 border-white/10 text-slate-400 hover:text-white'}`}
                      title={isPaused ? "Resume Game" : "Pause Game"}
                    >
                      {isPaused ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase text-slate-500">
                    <span>AI Turn Speed</span>
                    <span className="text-indigo-400 font-bold">
                      {aiSpeed === 2000 ? 'Slow' : aiSpeed === 1000 ? 'Normal' : 'Fast'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => onUpdateSettings({ aiSpeed: 2000 })}
                      className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all ${aiSpeed === 2000 ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-700 border-white/10 text-slate-400 hover:text-white'}`}
                    >
                      SLOW
                    </button>
                    <button 
                      onClick={() => onUpdateSettings({ aiSpeed: 1000 })}
                      className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all ${aiSpeed === 1000 ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-700 border-white/10 text-slate-400 hover:text-white'}`}
                    >
                      NORMAL
                    </button>
                    <button 
                      onClick={() => onUpdateSettings({ aiSpeed: 300 })}
                      className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all ${aiSpeed === 300 ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-700 border-white/10 text-slate-400 hover:text-white'}`}
                    >
                      FAST
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Persistence</h4>
                <button 
                  onClick={handleSave}
                  disabled={saveStatus === 'SAVING'}
                  className={`w-full py-2.5 text-white text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-2 shadow-lg ${
                    saveStatus === 'SUCCESS' 
                      ? 'bg-emerald-600 border-emerald-400' 
                      : saveStatus === 'ERROR'
                        ? 'bg-red-600 border-red-400'
                        : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 shadow-indigo-900/20'
                  }`}
                >
                  {saveStatus === 'SAVING' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : saveStatus === 'SUCCESS' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  )}
                  {saveStatus === 'SAVING' ? 'Saving...' : saveStatus === 'SUCCESS' ? 'Game correctly saved' : 'Save Current Game'}
                </button>
                
                <button 
                  onClick={onGoToMainMenu}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-lg border border-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  Main Menu
                </button>
                <p className="text-[9px] text-slate-500 italic text-center">Manage your game sessions and progress.</p>
              </div>

              <div className="bg-slate-900/50 border border-dashed border-white/10 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                  Adjust the speed of AI decision-making. "Fast" is recommended for quick simulations, while "Slow" helps in understanding the AI's strategic choices.
                </p>
              </div>
            </div>
          </div>
        ) : activeView === 'UNITS' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="fantasy-font text-lg text-yellow-500">Unit Reference</h3>
              <button onClick={() => setActiveView('FACTIONS')} className="text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-widest">Back</button>
            </div>
            
            {Object.entries(UNIT_STATS).map(([type, stats]) => {
              const currentPlayer = players[currentIndex];
              if (!currentPlayer) return null;
              
              const playerFaction = currentPlayer.faction;
              const unitLevel = currentPlayer.unitLevels[type as 'warrior' | 'mage' | 'knight'];
              const currentSkills = currentPlayer.unitTypeSkills[type as 'warrior' | 'mage' | 'knight'] || [];
              
              const skillDice = currentSkills.reduce((acc, s) => {
                if (!s) return acc;
                const dicePool = getDiceFromSkill(s, false);
                dicePool.forEach(d => {
                  if (d.type === 'MELEE') acc.melee += d.count;
                  if (d.type === 'MANA') acc.mana += d.count;
                  if (d.type === 'DEFENSE') acc.defense += d.count;
                });
                return acc;
              }, { melee: 0, mana: 0, defense: 0 });

              const meleeDice = skillDice.melee;
              const manaDice = skillDice.mana;
              const defenseDice = skillDice.defense;
              
              let maxHp = stats.hp;
              if (type === 'warrior' && unitLevel === 2) maxHp = 2;
              if (type === 'mage' && unitLevel === 2) maxHp = 2;
              if (type === 'mage' && unitLevel === 3) maxHp = 3;
              if (type === 'knight' && unitLevel === 2) maxHp = 3;
              if (type === 'knight' && unitLevel === 3) maxHp = 5;

              let maxRange = stats.move;
              if (type === 'warrior' && unitLevel === 2) maxRange = 2;
              if (type === 'mage' && unitLevel === 2) maxRange = 2;
              if (type === 'mage' && unitLevel === 3) maxRange = 3;
              if (type === 'knight' && unitLevel === 2) maxRange = 3;
              if (type === 'knight' && unitLevel === 3) maxRange = 4;
              
              const unitImage = (playerFaction && FACTION_UNIT_IMAGES[playerFaction]) 
                ? FACTION_UNIT_IMAGES[playerFaction][type] 
                : (ASSETS.FACTIONS[playerFaction as keyof typeof ASSETS.FACTIONS] || 'https://picsum.photos/seed/unit/200/200');
              
              return (
                <div 
                  key={type} 
                  className="bg-slate-800/50 border border-white/10 rounded-xl p-3 space-y-2 relative overflow-hidden group"
                  onMouseEnter={(e) => onHover('UNIT', { type, level: unitLevel, stats, skills: currentSkills, faction: playerFaction }, e.clientX, e.clientY)}
                  onMouseLeave={onClearHover}
                >
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <img src={unitImage} alt={type} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  {unitLevel > 1 && (
                    <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-300 text-[8px] font-bold px-2 py-0.5 rounded-bl-lg border-b border-l border-indigo-500/30">
                      LVL {unitLevel}
                    </div>
                  )}
                  <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-700 border border-white/10 overflow-hidden">
                        <img src={unitImage} alt={type} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <h4 className="font-bold text-slate-100 capitalize">{type}</h4>
                    </div>
                    <span className="text-[10px] bg-yellow-900/30 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">
                      {type === 'warrior' ? '4g' : type === 'mage' ? '6g' : '8g'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
                      <span className="text-slate-400">HP</span>
                      <span className="text-red-400 font-bold">{maxHp} {maxHp > stats.hp && <span className="text-indigo-400 text-[8px]">(+{maxHp - stats.hp})</span>}</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
                      <span className="text-slate-400">Move</span>
                      <span className="text-blue-400 font-bold">{maxRange} {maxRange > stats.move && <span className="text-indigo-400 text-[8px]">(+{maxRange - stats.move})</span>}</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
                      <span className="text-slate-400">Melee Dice</span>
                      <div className="flex flex-col items-end">
                        <span className="text-orange-400 font-bold">{meleeDice}</span>
                        {meleeDice > 0 && (
                          <div className="flex gap-0.5 mt-0.5">
                            {(playerFaction === 'orc' ? DICE.ORC_MELEE : DICE.MELEE).map((face, i) => (
                              <div key={i} className={`w-3 h-3 rounded-sm flex items-center justify-center text-[7px] font-bold ${face > 0 ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-500'}`} title={`Face ${i+1}: ${face}`}>
                                {face > 0 ? face : ''}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
                      <span className="text-slate-400">Mana Dice</span>
                      <div className="flex flex-col items-end">
                        <span className="text-purple-400 font-bold">{manaDice}</span>
                        {manaDice > 0 && (
                          <div className="flex gap-0.5 mt-0.5">
                            {DICE.MANA.map((face, i) => (
                              <div key={i} className={`w-3 h-3 rounded-sm flex items-center justify-center text-[7px] font-bold ${face !== 0 ? (face === -1 ? 'bg-red-500 text-white' : 'bg-purple-500 text-white') : 'bg-slate-700 text-slate-500'}`} title={`Face ${i+1}: ${face === -1 ? 'Explosion' : face}`}>
                                {face === -1 ? '!' : (face !== 0 ? face : '')}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
                      <span className="text-slate-400">Defense Dice</span>
                      <div className="flex flex-col items-end">
                        <span className="text-emerald-400 font-bold">{defenseDice}</span>
                        {defenseDice > 0 && (
                          <div className="flex gap-0.5 mt-0.5">
                            {DICE.DEFENSE.map((face, i) => (
                              <div key={i} className={`w-3 h-3 rounded-sm flex items-center justify-center text-[7px] font-bold ${face > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500'}`} title={`Face ${i+1}: ${face}`}>
                                {face > 0 ? face : ''}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
                      <span className="text-slate-400">Skill Slots</span>
                      <span className="text-yellow-500 font-bold">{currentSkills.length}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="bg-slate-900/50 border border-dashed border-white/10 rounded-xl p-3">
              <h4 className="text-[10px] uppercase text-slate-500 mb-2 tracking-widest">Dice Legend</h4>
              <div className="space-y-1.5 text-[9px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-orange-500"></div>
                  <span className="text-slate-400">Melee: (0,0,1,1,1,1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-orange-700"></div>
                  <span className="text-slate-400">Orc Melee: (1,1,1,1,1,2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-purple-500"></div>
                  <span className="text-slate-400">Mana: (0,1,1,1,1,*) *Explosion</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-emerald-500"></div>
                  <span className="text-slate-400">Defense: (0,1,0,1,0,1)</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeView === 'MONSTERS' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="fantasy-font text-lg text-red-500">Monster Reference</h3>
              <button onClick={() => setActiveView('FACTIONS')} className="text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-widest">Back</button>
            </div>
            
            {/* Regular Monster */}
            <div 
              className="bg-slate-800/50 border border-white/10 rounded-xl p-3 space-y-2"
              onMouseEnter={(e) => onHover('MONSTER', { name: 'Monster', ...MONSTER_STATS[0] }, e.clientX, e.clientY)}
              onMouseLeave={onClearHover}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-2">
                <h4 className="font-bold text-slate-100">Monster</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
                  <span className="text-slate-400">HP</span>
                  <span className="text-red-400 font-bold">{MONSTER_STATS[0]?.hp}</span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-1.5 rounded col-span-2">
                  <span className="text-slate-400">Dice</span>
                  <span className="text-slate-200 font-bold">{MONSTER_STATS[0]?.dice.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Boss Dragon */}
            <div 
              className="bg-slate-800/50 border border-red-500/30 rounded-xl p-3 space-y-2 relative overflow-hidden"
              onMouseEnter={(e) => onHover('MONSTER', { ...BOSS_STATS[0] }, e.clientX, e.clientY)}
              onMouseLeave={onClearHover}
            >
              <div className="absolute top-0 right-0 bg-red-500/20 text-red-300 text-[8px] font-bold px-2 py-0.5 rounded-bl-lg border-b border-l border-red-500/30">
                BOSS
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-2">
                <h4 className="font-bold text-slate-100">{BOSS_STATS[0]?.name}</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
                  <span className="text-slate-400">HP</span>
                  <span className="text-red-400 font-bold">{BOSS_STATS[0]?.hp}</span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
                  <span className="text-slate-400">Rerolls</span>
                  <span className="text-yellow-400 font-bold">{BOSS_STATS[0]?.rerolls}</span>
                </div>
                <div className="col-span-2 bg-black/20 p-1.5 rounded space-y-1">
                  <span className="text-slate-400 block mb-1">Dice Pool</span>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="flex justify-between">
                      <span className="text-orange-400">Melee:</span>
                      <span className="font-bold text-slate-200">{BOSS_STATS[0]?.dice.MELEE}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-400">Mana:</span>
                      <span className="font-bold text-slate-200">{BOSS_STATS[0]?.dice.MANA}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400">Defense:</span>
                      <span className="font-bold text-slate-200">{BOSS_STATS[0]?.dice.DEFENSE}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-400" title="Rolls Mana dice, generates Defense">Def/Mana:</span>
                      <span className="font-bold text-slate-200">{BOSS_STATS[0]?.dice.DEFENSE_MANA}</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 bg-black/20 p-1.5 rounded space-y-1">
                  <span className="text-slate-400 block mb-1">Rewards</span>
                  <div className="flex justify-between">
                    <span className="text-yellow-500">{BOSS_STATS[0]?.rewards.gold} Gold</span>
                    <span className="text-blue-400">{BOSS_STATS[0]?.rewards.xp} XP</span>
                    <span className="text-yellow-300">{BOSS_STATS[0]?.rewards.vp} VP</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-dashed border-white/10 rounded-xl p-3">
              <h4 className="text-[10px] uppercase text-slate-500 mb-2 tracking-widest">Dice Legend</h4>
              <div className="space-y-1.5 text-[9px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-orange-500"></div>
                  <span className="text-slate-400">Melee: (0,0,1,1,1,1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-orange-700"></div>
                  <span className="text-slate-400">Orc Melee: (1,1,1,1,1,2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-purple-500"></div>
                  <span className="text-slate-400">Mana: (0,1,1,1,1,*) *Explosion</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-emerald-500"></div>
                  <span className="text-slate-400">Defense: (0,1,0,1,0,1)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          (() => {
            const reorderedPlayers = [
              ...players.slice(currentIndex),
              ...players.slice(0, currentIndex)
            ];

            return reorderedPlayers.map((player) => {
              const playerUnits = units.filter(u => u.playerId === player.id);
              const playerBuildings = buildings.filter(b => b.playerId === player.id);
              
              const deployedWarriors = playerUnits.filter(u => u.type === 'warrior').length;
              const deployedMages = playerUnits.filter(u => u.type === 'mage').length;
              const deployedKnights = playerUnits.filter(u => u.type === 'knight').length;
              const deployedCastles = playerBuildings.filter(b => b.type === 'castle').length;

              const isCurrent = player.id === players[currentIndex].id;
              
              // Determine display name: use faction race if name is generic
              const factionName = FACTIONS.find(f => f.id === player.faction)?.name || player.faction;
              const displayName = (player.name.startsWith('Faction ') || !player.name) ? factionName : player.name;

              return (
                <div 
                  key={player.id}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-slate-800 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500' 
                      : 'bg-slate-900/50 border-white/5 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center fantasy-font text-white relative"
                      style={{ backgroundColor: player.color }}
                    >
                      {displayName[0]}
                      {player.faction === 'elf' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-600 rounded-full border border-slate-900 flex items-center justify-center text-[8px]" title="Elf Faction">
                          🌿
                        </div>
                      )}
                      {player.faction === 'orc' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-700 rounded-full border border-slate-900 flex items-center justify-center text-[8px]" title="Orc Faction">
                          🪓
                        </div>
                      )}
                      {player.faction === 'ooze' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-700 rounded-full border border-slate-900 flex items-center justify-center text-[8px]" title="Ooze Faction">
                          🧪
                        </div>
                      )}
                      {player.faction === 'flying' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border border-slate-900 flex items-center justify-center text-[8px]" title="Flying Folks Faction">
                          🦅
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 leading-tight flex items-center gap-1">
                        {displayName}
                        {player.faction && (
                          <span className="text-[8px] bg-slate-700 text-slate-400 px-1 rounded border border-white/5 uppercase">
                            {player.faction}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-yellow-500 uppercase">
                        VP: {player.score + getAncientCityVP(player.id)} / 10
                        {getAncientCityVP(player.id) > 0 && (
                          <span className="ml-1 text-[10px] text-yellow-600/80">
                            (+{getAncientCityVP(player.id)} City)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs mt-2 text-slate-400">
                    <span>Gold: <span className="text-yellow-500 font-bold">{player.gold}/{MAX_GOLD}</span></span>
                    <span>XP: <span className="text-blue-400 font-bold">{player.xp}/{MAX_XP}</span></span>
                  </div>
                  
                  {/* Production Info */}
                  <div className="flex flex-col gap-1 bg-black/20 p-2 rounded border border-white/5">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="opacity-50 uppercase tracking-tighter">Production:</span>
                        <span className="text-yellow-600 font-bold">
                          +{getProductionValues(player.id).gold + getProductionValues(player.id).tokenBonus}g
                          {getProductionValues(player.id).goldLostToReduction > 0 && (
                            <span className="text-red-500 text-[8px] ml-1" title={`Plains Gold Reduction: -${getProductionValues(player.id).goldLostToReduction}g`}>
                              (-{getProductionValues(player.id).goldLostToReduction}g)
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="text-blue-500 font-bold">+{getProductionValues(player.id).xp}xp</span>
                    </div>
                    {getProductionValues(player.id).tokenBonus > 0 && (
                      <div className="flex justify-between text-[8px] text-slate-600 border-t border-white/5 pt-1">
                        <span>Tiles: +{getProductionValues(player.id).gold}g</span>
                        <span>Tokens: +{getProductionValues(player.id).tokenBonus}g</span>
                      </div>
                    )}
                    {getProductionValues(player.id).goldLostToReduction > 0 && (
                      <div className="text-[8px] text-red-400/70 italic mt-1 border-t border-white/5 pt-1">
                        -{getProductionValues(player.id).goldLostToReduction}g due to Plains Gold Reduction
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-300 mt-1">
                    Actions Remaining: <span className="font-bold text-white">{player.actionsRemaining}/2</span>
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-white/5 pt-2">
                    {(['warrior', 'mage', 'knight'] as const).map(type => {
                      const level = player.unitLevels[type];
                      const allSkills = player.unitTypeSkills[type] || [];
                      const unitImage = FACTION_UNIT_IMAGES[player.faction as keyof typeof FACTION_UNIT_IMAGES]?.[type] || ASSETS.UNITS[type as keyof typeof ASSETS.UNITS];
                      
                      const deployedCount = type === 'warrior' ? deployedWarriors : type === 'mage' ? deployedMages : deployedKnights;
                      const maxCount = type === 'warrior' ? MAX_UNITS.warriors : type === 'mage' ? MAX_UNITS.mages : MAX_UNITS.knights;

                      return (
                        <div 
                          key={type} 
                          className="bg-black/20 p-2 rounded border border-white/5 flex flex-col gap-2"
                          onMouseEnter={(e) => onHover('UNIT', { type, level, stats: UNIT_STATS[type], skills: allSkills.filter(Boolean), faction: player.faction }, e.clientX, e.clientY)}
                          onMouseLeave={onClearHover}
                        >
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded bg-slate-800 border border-white/10 overflow-hidden flex-shrink-0">
                              <img 
                                src={unitImage} 
                                alt={type} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] capitalize font-bold text-slate-300 truncate">
                                  {type} <span className="text-indigo-400 ml-1">Lvl {level}</span>
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {deployedCount}/{maxCount}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-1.5">
                                {/* Skill Slots */}
                                {allSkills.map((skill, i) => {
                                  const isSharedSlot = type === 'mage' && i === 1 && allSkills.some(s => s?.id === 'ORC_MAGE_UNIQUE');
                                  const rangedDice = skill ? getDiceFromSkill(skill, true) : [];
                                  const meleeDice = skill ? getDiceFromSkill(skill, false) : [];
                                  const hasReroll = skill?.effect?.toLowerCase().includes('reroll') || skill?.type === 'LUCKY';

                                  return (
                                    <div 
                                      key={i}
                                      className={`flex flex-col p-1 rounded border min-w-[55px] min-h-[36px] max-w-[80px] ${
                                        skill?.isUnique 
                                          ? 'bg-indigo-900/30 border-indigo-500/30' 
                                          : isSharedSlot
                                            ? 'bg-yellow-900/30 border-yellow-500/50 shadow-[0_0_5px_rgba(234,179,8,0.1)]'
                                            : 'bg-black/40 border-white/5'
                                      }`}
                                      title={skill?.effect}
                                    >
                                      <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[6px] text-slate-500 uppercase leading-none">Slot {i + 1}</span>
                                        <div className="flex gap-0.5">
                                          {isSharedSlot && <span className="text-[7px]" title="Shared Slot">📢</span>}
                                          {skill?.isUnique && <span className="text-[7px] text-indigo-400">★</span>}
                                        </div>
                                      </div>
                                      
                                      {skill ? (
                                        <div className="flex flex-col gap-0.5">
                                          <div className="text-[8px] font-bold text-slate-300 truncate leading-tight">
                                            {skill.name}
                                          </div>
                                          <div className="flex flex-wrap gap-0.5">
                                            {rangedDice.map((d, di) => (
                                              <div key={`r-${di}`} className="flex items-center gap-0.5 bg-blue-950/40 px-0.5 rounded border border-blue-400/30" title="Ranged">
                                                <div className={`w-1 h-1 rounded-sm ${d.type === 'MANA' ? 'bg-purple-400' : 'bg-blue-400'}`}></div>
                                                <span className="text-[7px] text-blue-200 font-bold">{d.count}</span>
                                              </div>
                                            ))}
                                            {meleeDice.map((d, di) => {
                                              const isDefense = d.purpose === 'DEFENSE';
                                              const colorClass = d.type === 'MANA' ? 'bg-purple-500' : isDefense ? 'bg-emerald-500' : 'bg-orange-500';
                                              const borderColor = d.type === 'MANA' ? 'border-purple-500/30' : isDefense ? 'border-emerald-500/30' : 'border-orange-500/30';
                                              const textColor = d.type === 'MANA' ? 'text-purple-300' : isDefense ? 'text-emerald-300' : 'text-orange-300';
                                              
                                              return (
                                                <div key={`m-${di}`} className={`flex items-center gap-0.5 bg-black/40 px-0.5 rounded border ${borderColor}`} title={isDefense ? 'Defense' : 'Melee'}>
                                                  <div className={`w-1 h-1 rounded-sm ${colorClass}`}></div>
                                                  <span className={`text-[7px] ${textColor} font-bold`}>{d.count}</span>
                                                </div>
                                              );
                                            })}
                                            {hasReroll && (
                                              <div className="flex items-center gap-0.5 bg-yellow-950/40 px-0.5 rounded border border-yellow-500/30" title="Reroll">
                                                <div className="w-1 h-1 rounded-sm bg-yellow-500"></div>
                                                <span className="text-[7px] text-yellow-500 font-bold">1</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex-1 flex items-center justify-center">
                                          <div className="w-1 h-1 bg-slate-700 rounded-full opacity-20"></div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Castles Display */}
                    <div className="bg-black/20 p-2 rounded border border-white/5 flex gap-3 items-center">
                      <div className="w-10 h-10 rounded bg-slate-800 border border-white/10 overflow-hidden flex-shrink-0 p-1">
                        <img 
                          src={FACTION_CAPITAL_IMAGES[player.faction as keyof typeof FACTION_CAPITAL_IMAGES] || ASSETS.BUILDINGS.castle} 
                          alt="Castle" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex justify-between items-center">
                        <span className="text-[10px] capitalize font-bold text-slate-300">
                          Castles
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {deployedCastles}/{MAX_UNITS.castles}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {player.secretQuest && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] uppercase text-slate-600 mb-1">Secret Quest</p>
                    <p className="text-[10px] text-indigo-400 italic">
                      {isCurrent ? player.secretQuest.description : 'Hidden Objective'}
                    </p>
                  </div>
                )}

                {player.passives && player.passives.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] uppercase text-slate-600 mb-1">Passives</p>
                    <div className="flex flex-wrap gap-1">
                      {player.passives.map((item, i) => (
                        <span key={i} className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                          {item === 'DWARF_PASSIVE' ? 'Mountain Dweller' : item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {player.skills.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] uppercase text-slate-600 mb-1">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {player.skills.map((item, i) => (
                        <span key={i} className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-white/10">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        })()
      )}
      </div>
    </div>
  );
};

const StatBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div className="w-full">
    <div className="flex justify-between text-[10px] uppercase text-slate-500 mb-0.5">
      <span>{label}</span>
      <span>{Math.round(value)}/{max}</span>
    </div>
    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-500`} 
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  </div>
);

export default Sidebar;


