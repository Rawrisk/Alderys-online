
import React, { useState, useEffect, useRef } from 'react';
import DevMenu from './DevMenu';
import DiceTestModal from './DiceTestModal';
import { FACTIONS, FACTION_THEMES } from '../constants';
import { MapMode } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SetupProps {
  onStart: (players: { name: string, isAI: boolean, faction: string }[], isTutorial?: boolean, gameMode?: 'NORMAL' | 'SKILL_DRAFT' | 'MONSTERS_OUT', mapMode?: MapMode, isLowStart?: boolean, isExplorationMode?: boolean) => void;
  onShowAssets: () => void;
  onLoadGame: () => void;
  intro: string;
  roomCode?: string | null;
  channel?: RealtimeChannel | null;
  isCreator: boolean;
  myPresenceId: string;
}

const Setup: React.FC<SetupProps> = ({ onStart, onShowAssets, onLoadGame, intro, roomCode, channel, isCreator, myPresenceId }) => {
  const [numPlayers, setNumPlayers] = useState(2);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showDiceTests, setShowDiceTests] = useState(false);
  const [gameMode, setGameMode] = useState<'NORMAL' | 'SKILL_DRAFT' | 'MONSTERS_OUT'>('NORMAL');
  const [isLowStart, setIsLowStart] = useState(false);
  const [isExplorationMode, setIsExplorationMode] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('NORMAL');
  const [players, setPlayers] = useState([
    { name: 'Human', isAI: false, faction: 'human', id: '' },
    { name: 'Human', isAI: true, faction: 'human', id: 'ai-1' },
  ]);

  // Use refs to keep listeners stable without re-binding on every setting change
  const stateRef = useRef({
    numPlayers,
    gameMode,
    mapMode,
    isLowStart,
    isExplorationMode,
    players
  });

  useEffect(() => {
    stateRef.current = { numPlayers, gameMode, mapMode, isLowStart, isExplorationMode, players };
  }, [numPlayers, gameMode, mapMode, isLowStart, isExplorationMode, players]);

  useEffect(() => {
    if (channel && roomCode) {
      console.log('Setup Lobby: Initializing listeners for room:', roomCode);
      
      const lobbyUpdateHandler = (payload: any) => {
        const data = payload.payload;
        console.log('Setup Lobby: Received broadcast lobby-update', data);
        
        if (!isCreator) {
          setPlayers(data.players);
          setNumPlayers(data.settings.numPlayers);
          setGameMode(data.settings.gameMode);
          setMapMode(data.settings.mapMode);
          setIsLowStart(data.settings.isLowStart);
          setIsExplorationMode(data.settings.isExplorationMode);
        }
      };

      const presenceHandler = () => {
        const state = channel.presenceState();
        console.log('Setup Lobby: Presence sync event', state);
        
        if (isCreator) {
          const presences = Object.values(state).flat() as any[];
          console.log(`Setup Lobby: Host auditing ${presences.length} active presences.`);
          
          setPlayers(prev => {
            let changed = false;
            const newPlayers = [...prev];
            
            presences.forEach(pres => {
              const existingIdx = newPlayers.findIndex(p => p.id === pres.id);
              if (existingIdx === -1) {
                // Find first AI or empty slot to replace
                const slotIdx = newPlayers.findIndex(p => p.isAI || !p.id);
                if (slotIdx !== -1) {
                  console.log(`Setup Lobby: Assigning slot ${slotIdx + 1} to joined player: ${pres.name}`);
                  newPlayers[slotIdx] = { 
                    ...newPlayers[slotIdx], 
                    name: pres.name, 
                    isAI: false, 
                    id: pres.id 
                  };
                  changed = true;
                }
              }
            });
            
            if (changed || true) { // Always broadcast on presence sync to ensure new joiners get current state
              console.log('Setup Lobby: Host broadcasting current lobby state to all.');
              channel.send({
                type: 'broadcast',
                event: 'lobby-update',
                payload: {
                  players: newPlayers,
                  settings: {
                    numPlayers: stateRef.current.numPlayers,
                    gameMode: stateRef.current.gameMode,
                    mapMode: stateRef.current.mapMode,
                    isLowStart: stateRef.current.isLowStart,
                    isExplorationMode: stateRef.current.isExplorationMode
                  }
                }
              });
            }
            
            return newPlayers;
          });
        }
      };

      // Listener for when someone requests explicit info (useful for late joiners)
      const requestHandler = (payload: any) => {
        if (isCreator) {
          console.log('Setup Lobby: Received info request from player. Responding with state.');
          channel.send({
            type: 'broadcast',
            event: 'lobby-update',
            payload: {
              players: stateRef.current.players,
              settings: {
                numPlayers: stateRef.current.numPlayers,
                gameMode: stateRef.current.gameMode,
                mapMode: stateRef.current.mapMode,
                isLowStart: stateRef.current.isLowStart,
                isExplorationMode: stateRef.current.isExplorationMode
              }
            }
          });
        }
      };

      channel.on('broadcast', { event: 'lobby-update' }, lobbyUpdateHandler);
      channel.on('broadcast', { event: 'request-lobby-info' }, requestHandler);
      channel.on('broadcast', { event: 'game-started' }, (payload) => {
        console.log('Setup Lobby: Host started the game! Transitioning...');
        // The App.tsx handler will also fire, but we log here for diagnostics
      });
      channel.on('presence', { event: 'sync' }, presenceHandler);

      // If not creator, explicitly ask for the state once joined
      if (!isCreator) {
        console.log('Setup Lobby: Guest requesting current state from host...');
        const requestState = () => {
          channel.send({
            type: 'broadcast',
            event: 'request-lobby-info',
            payload: { from: myPresenceId }
          });
        };
        
        requestState();
        // Retry once after 1.5s if still no players (other than default)
        const retryTimeout = setTimeout(() => {
          if (stateRef.current.players.length <= 2 && stateRef.current.players[0].id === '') {
             console.log('Setup Lobby: Guest retrying state request...');
             requestState();
          }
        }, 1500);
        
        return () => clearTimeout(retryTimeout);
      }
    }
  }, [channel, roomCode, isCreator, myPresenceId]);

  const handlePlayerChange = (idx: number, field: 'name' | 'isAI' | 'faction', value: any) => {
    // Only allow changing own player info if not creator, or any if creator
    if (!isCreator && players[idx].id !== myPresenceId) return;

    const newPlayers = [...players];
    const oldFaction = newPlayers[idx].faction;
    newPlayers[idx] = { ...newPlayers[idx], [field]: value };
    
    // If faction changed and name was the old faction's name or generic, update it
    if (field === 'faction') {
      const oldFactionName = FACTIONS.find(f => f.id === oldFaction)?.name;
      if (newPlayers[idx].name === oldFactionName || newPlayers[idx].name === `Faction ${idx + 1}`) {
        const newFactionName = FACTIONS.find(f => f.id === value)?.name;
        if (newFactionName) newPlayers[idx].name = newFactionName;
      }
    }
    
    setPlayers(newPlayers);

    if (channel && roomCode) {
      channel.send({
        type: 'broadcast',
        event: 'lobby-update',
        payload: {
          players: newPlayers,
          settings: {
            numPlayers,
            gameMode,
            mapMode,
            isLowStart,
            isExplorationMode
          }
        }
      });
    }
  };

  const handleNumChange = (n: number) => {
    if (!isCreator) return;
    setNumPlayers(n);
    const newArr = Array(n).fill(0).map((_, i) => players[i] || { name: 'Human', isAI: i > 0, faction: 'human', id: `ai-${i}` });
    setPlayers(newArr);

    if (channel && roomCode) {
      channel.send({
        type: 'broadcast',
        event: 'lobby-update',
        payload: {
          players: newArr,
          settings: {
            numPlayers: n,
            gameMode,
            mapMode,
            isLowStart,
            isExplorationMode
          }
        }
      });
    }
  };

  const syncSettings = (newSettings: any) => {
    if (!isCreator) return;
    if (channel && roomCode) {
      console.log('Setup Lobby: Broadcasting settings update', newSettings);
      channel.send({
        type: 'broadcast',
        event: 'lobby-update',
        payload: {
          players: stateRef.current.players,
          settings: {
            numPlayers: stateRef.current.numPlayers,
            gameMode: stateRef.current.gameMode,
            mapMode: stateRef.current.mapMode,
            isLowStart: stateRef.current.isLowStart,
            isExplorationMode: stateRef.current.isExplorationMode,
            ...newSettings
          }
        }
      });
    }
  };

  const handleModeChange = (mode: 'NORMAL' | 'SKILL_DRAFT' | 'MONSTERS_OUT') => {
    if (!isCreator) return;
    console.log('Setup Lobby: Setting game mode to', mode);
    setGameMode(mode);
    syncSettings({ gameMode: mode });
  };

  const handleMapModeChange = (mode: MapMode) => {
    if (!isCreator) return;
    console.log('Setup Lobby: Setting map mode to', mode);
    setMapMode(mode);
    syncSettings({ mapMode: mode });
  };

  const handleToggleLowStart = () => {
    if (!isCreator) return;
    const newVal = !isLowStart;
    console.log('Setup Lobby: Setting low start to', newVal);
    setIsLowStart(newVal);
    syncSettings({ isLowStart: newVal });
  };

  const handleToggleExploration = () => {
    if (!isCreator) return;
    const newVal = !isExplorationMode;
    console.log('Setup Lobby: Setting exploration to', newVal);
    setIsExplorationMode(newVal);
    syncSettings({ isExplorationMode: newVal });
  };

  return (
    <div className="w-full flex flex-col items-center justify-start py-8 md:py-12 pb-16 md:pb-12 px-4 md:px-6 relative">
      {/* Decorative background elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 p-4 md:p-8 rounded-2xl shadow-2xl relative z-10 my-4 md:my-auto flex flex-col">
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-3xl md:text-6xl fantasy-font text-yellow-500 mb-1 md:mb-4 drop-shadow-lg">ALDERYS</h1>
          <p className="text-slate-400 italic font-light max-w-md mx-auto text-[10px] md:text-base">{intro}</p>
          {roomCode && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-full">
              <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Room Code:</span>
              <span className="text-xl font-mono text-blue-500 tracking-widest">{roomCode}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 overflow-y-auto md:overflow-visible pr-1 md:pr-0 custom-scrollbar max-h-[70vh] md:max-h-none">
          <section className="space-y-4 md:space-y-6">
            <h2 className="text-xl md:text-2xl fantasy-font text-slate-200 border-b border-white/10 pb-2">Faction Selection</h2>
            <div className="flex flex-wrap gap-2 md:gap-4">
               {[2, 3, 4, 5, 6].map(n => (
                 <button
                    key={n}
                    onClick={() => handleNumChange(n)}
                    disabled={!isCreator}
                    className={`flex-1 md:flex-none px-4 py-2 rounded transition-all text-sm md:text-base ${numPlayers === n ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'} ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   {n} Factions
                 </button>
               ))}
            </div>

            <div className="space-y-3 md:space-y-4 max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar pr-1 md:pr-2">
              {players.map((p, idx) => {
                const theme = FACTION_THEMES[p.faction];
                return (
                  <div 
                    key={idx} 
                    className={`bg-slate-800/50 p-3 md:p-4 rounded-lg border-2 transition-all duration-500 space-y-2 md:space-y-3`}
                    style={{ borderColor: theme?.color ? `${theme.color}44` : 'rgba(255,255,255,0.05)', boxShadow: theme?.color ? `0 0 20px ${theme.color}11` : 'none' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] md:text-xs uppercase font-bold tracking-widest" style={{ color: theme?.color || '#64748b' }}>Faction {idx + 1}</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[9px] md:text-[10px] uppercase text-slate-500">Computer</span>
                        <input 
                          type="checkbox" 
                          checked={p.isAI} 
                          disabled={!isCreator}
                          onChange={(e) => handlePlayerChange(idx, 'isAI', e.target.checked)}
                          className={`w-3 h-3 accent-yellow-600 ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={p.name}
                      disabled={!isCreator && players[idx].id !== myPresenceId}
                      onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
                      className={`w-full bg-slate-900 border border-white/10 rounded px-3 py-1.5 md:py-2 text-sm md:text-base text-white focus:outline-none focus:border-yellow-500 ${(!isCreator && players[idx].id !== myPresenceId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Faction Name"
                    />
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase text-slate-500">Faction Type</span>
                      <div className="flex flex-wrap gap-2">
                        {FACTIONS.map(f => {
                          const fTheme = FACTION_THEMES[f.id];
                          return (
                            <button
                              key={f.id}
                              disabled={!isCreator && players[idx].id !== myPresenceId}
                              onClick={() => handlePlayerChange(idx, 'faction', f.id)}
                              className={`flex-1 py-1 px-2 rounded text-[10px] border transition-all ${
                                p.faction === f.id 
                                  ? 'bg-yellow-600 border-yellow-500 text-white' 
                                  : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-slate-800'
                              } ${(!isCreator && players[idx].id !== myPresenceId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              style={p.faction === f.id ? { 
                                backgroundColor: fTheme?.color || '#eab308',
                                borderColor: fTheme?.color || '#eab308',
                                boxShadow: fTheme?.glow || 'none'
                              } : {}}
                              title={f.description}
                            >
                              {f.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col justify-between space-y-4 md:space-y-6">
             <div className="bg-slate-900/50 p-4 md:p-6 rounded-xl border border-white/5">
                <h3 className="fantasy-font text-lg md:text-xl text-yellow-600 mb-2 md:mb-3">Game Mode</h3>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => handleModeChange('NORMAL')}
                    disabled={!isCreator}
                    className={`flex-1 py-2 rounded text-xs font-bold transition-all ${gameMode === 'NORMAL' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400'} ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Normal Mode
                  </button>
                  <button
                    onClick={() => handleModeChange('SKILL_DRAFT')}
                    disabled={!isCreator}
                    className={`flex-1 py-2 rounded text-[10px] md:text-xs font-bold transition-all ${gameMode === 'SKILL_DRAFT' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'} ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Skill Draft
                  </button>
                  <button
                    onClick={() => handleModeChange('MONSTERS_OUT')}
                    disabled={!isCreator}
                    className={`flex-1 py-2 rounded text-[10px] md:text-xs font-bold transition-all ${gameMode === 'MONSTERS_OUT' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'} ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Monsters Out
                  </button>
                </div>
                {gameMode === 'SKILL_DRAFT' && (
                  <p className="text-[10px] text-slate-500 italic mb-4">
                    Draft unique skills from other factions to customize your empire!
                  </p>
                )}
                {gameMode === 'MONSTERS_OUT' && (
                  <p className="text-[10px] text-slate-500 italic mb-4">
                    Dungeons unleash level 1-3 monsters onto the map! Defeat them to clear the way.
                  </p>
                )}

                <h3 className="fantasy-font text-lg md:text-xl text-yellow-600 mb-2 md:mb-3">Map Mode</h3>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => handleMapModeChange('NORMAL')}
                    disabled={!isCreator}
                    className={`flex-1 py-2 rounded text-xs font-bold transition-all ${mapMode === 'NORMAL' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400'} ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Normal Map
                  </button>
                  <button
                    onClick={() => handleMapModeChange('ADJUSTED')}
                    disabled={!isCreator}
                    className={`flex-1 py-2 rounded text-xs font-bold transition-all ${mapMode === 'ADJUSTED' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'} ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Adjusted Map
                  </button>
                </div>
                {mapMode === 'ADJUSTED' && (
                  <p className="text-[10px] text-slate-500 italic mb-4">
                    Dungeons and Ancient Cities are placed closer to the center.
                  </p>
                )}

                <h3 className="fantasy-font text-lg md:text-xl text-yellow-600 mb-2 md:mb-3">Difficulty Modifiers</h3>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleToggleLowStart}
                    disabled={!isCreator}
                    className={`flex-1 py-2 rounded text-xs font-bold transition-all ${isLowStart ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'} ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Low Start {isLowStart ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={handleToggleExploration}
                    disabled={!isCreator}
                    className={`flex-1 py-2 rounded text-xs font-bold transition-all ${isExplorationMode ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'} ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Exploration {isExplorationMode ? 'ON' : 'OFF'}
                  </button>
                </div>
                {isLowStart && (
                  <p className="text-[10px] text-slate-500 italic mb-4">
                    Faction unique skills are disabled by default. Activate them during level up for 3 XP!
                  </p>
                )}
                {isExplorationMode && (
                  <p className="text-[10px] text-slate-500 italic mb-4">
                    Hexes are hidden by fog. Move units to reveal adjacent tiles!
                  </p>
                )}

                <h3 className="fantasy-font text-lg md:text-xl text-yellow-600 mb-2 md:mb-3">Your Reign Begins</h3>
                <ul className="text-xs md:text-sm text-slate-400 space-y-1 md:space-y-2 list-disc list-inside">
                  <li>Expand across the hexagonal territories of Alderys.</li>
                  <li>Encounter random events managed by the AI Master.</li>
                  <li>Manage Action Cubes, Units, and Skills.</li>
                  <li>Reach the Boss in the center to claim ultimate power.</li>
                </ul>
             </div>
             <div className="flex flex-col gap-3 pt-4 border-t border-white/5 md:border-t-0">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => onStart(players, false, gameMode, mapMode, isLowStart, isExplorationMode)}
                    disabled={!isCreator}
                    className={`w-full py-3 md:py-4 bg-yellow-600 hover:bg-yellow-500 text-white fantasy-font text-xl md:text-2xl rounded-xl transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-3 ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>
                   {isCreator ? 'Found Your Empire' : 'Waiting for Host...'}
                 </button>
                 <button
                    onClick={() => {
                      console.log('Setup: Loading chronicles...');
                      onLoadGame();
                    }}
                    disabled={!isCreator && roomCode !== null}
                    className={`w-full py-3 md:py-4 bg-slate-800 hover:bg-slate-700 text-yellow-500 border border-yellow-500/30 fantasy-font text-xl md:text-2xl rounded-xl transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-3 ${(!isCreator && roomCode !== null) ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                   Load Chronicles
                 </button>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <button
                    onClick={() => onStart(players, true)}
                    disabled={!isCreator && roomCode !== null}
                    className={`w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 fantasy-font text-sm md:text-base rounded-xl transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${(!isCreator && roomCode !== null) ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                   Tutorial
                 </button>
                 <button
                    onClick={() => {
                      console.log('Setup: Showing assets...');
                      onShowAssets();
                    }}
                    className="w-full py-2 bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-300 border border-indigo-500/30 fantasy-font text-sm md:text-base rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                   Assets
                 </button>
               </div>
               <div className="grid grid-cols-1 gap-2">
                  <button
                     onClick={() => setShowDiceTests(true)}
                     className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-yellow-500 border border-yellow-500/30 fantasy-font text-sm md:text-base rounded-xl transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
                    Dice Tests
                  </button>
                </div>
               <button
                  onClick={() => setShowDevMenu(true)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 fantasy-font text-[10px] md:text-xs rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                 Developer Menu
               </button>
             </div>
          </section>
        </div>
      </div>
      {showDevMenu && <DevMenu onClose={() => setShowDevMenu(false)} />}
      {showDiceTests && <DiceTestModal onClose={() => setShowDiceTests(false)} />}
    </div>
  );
};

export default Setup;
