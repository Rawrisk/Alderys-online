import React, { useState } from 'react';
import { TILE_IMAGES, MONSTER_STATS, MONSTER_LEVEL_2_STATS, MONSTER_LEVEL_3_STATS, BOSS_STATS, FACTION_UNIT_IMAGES } from '../constants';
import { TileType } from '../types';

interface RuleBookModalProps {
  onClose: () => void;
}

const RuleBookModal: React.FC<RuleBookModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ACTIONS' | 'COMBAT' | 'UNITS' | 'FACTIONS' | 'SKILLS' | 'SCORING'>('OVERVIEW');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="bg-slate-900 border-2 border-yellow-600/50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-slate-800/50">
          <h2 className="text-2xl fantasy-font text-yellow-500 uppercase tracking-wider">Rulebook</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-white/10 bg-slate-900 overflow-x-auto">
          {['OVERVIEW', 'ACTIONS', 'COMBAT', 'UNITS', 'FACTIONS', 'SKILLS', 'SCORING'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/10' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-300 space-y-6 custom-scrollbar">
          
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section>
                <h3 className="text-xl text-yellow-400 mb-2 fantasy-font">The Goal</h3>
                <p className="leading-relaxed">
                  Alderys is a strategic board game of conquest and glory. Your goal is to be the first faction to reach <strong className="text-yellow-500">10 Victory Points (VP)</strong>.
                </p>
              </section>
              
              <section>
                <h3 className="text-xl text-yellow-400 mb-4 fantasy-font">The Map & Hexes</h3>
                <p className="leading-relaxed mb-4">
                  The board is made of hexagonal tiles. You start at your Faction's Capital.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex flex-col items-center text-center p-3 bg-slate-800/50 rounded-lg border border-white/10">
                    <div className="w-16 h-16 mb-2 relative overflow-hidden rounded-lg border border-emerald-500/30">
                      <img 
                        src={TILE_IMAGES[TileType.PLAINS]} 
                        alt="Plains" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-sm font-bold text-emerald-400">Plains/Forests</span>
                    <span className="text-xs text-slate-400 mt-1">Basic terrain. Cost: 1 Move</span>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-3 bg-slate-800/50 rounded-lg border border-white/10">
                    <div className="w-16 h-16 mb-2 relative overflow-hidden rounded-lg border border-slate-500/30">
                      <img 
                        src={TILE_IMAGES[TileType.MOUNTAIN]} 
                        alt="Mountain" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-400">Mountains</span>
                    <span className="text-xs text-slate-400 mt-1">Difficult terrain. Cost: 2 Move</span>
                  </div>

                  <div className="flex flex-col items-center text-center p-3 bg-slate-800/50 rounded-lg border border-white/10">
                    <div className="w-16 h-16 mb-2 relative overflow-hidden rounded-lg border border-purple-500/30">
                      <img 
                        src={TILE_IMAGES[TileType.DUNGEON_ENTRANCE]} 
                        alt="Dungeon" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-purple-500/50 border border-purple-400 animate-pulse"></div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-purple-400">Dungeons</span>
                    <span className="text-xs text-slate-400 mt-1">Contain Monsters.</span>
                  </div>

                  <div className="flex flex-col items-center text-center p-3 bg-slate-800/50 rounded-lg border border-white/10">
                    <div className="w-16 h-16 mb-2 relative overflow-hidden rounded-lg border border-blue-500/30">
                      <img 
                        src={TILE_IMAGES[TileType.ANCIENT_CITY]} 
                        alt="Ancient City" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-yellow-500/80 border border-yellow-400 rotate-45 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-blue-400">Ancient Cities</span>
                    <span className="text-xs text-slate-400 mt-1">Control for +1 VP.</span>
                  </div>
                </div>

                <p className="text-sm text-red-400 italic">
                  Note: Crossing a <strong className="text-red-500">Red Border</strong> between hexes costs 1 extra movement point.
                </p>
              </section>

              <section>
                <h3 className="text-xl text-yellow-400 mb-2 fantasy-font">Resources</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-yellow-500">Gold:</strong> Used to recruit units, build castles, and buy skills.</li>
                  <li><strong className="text-blue-400">XP:</strong> Used to level up your unit types (Warrior, Mage, Knight) to make them stronger.</li>
                  <li><strong className="text-orange-400">Action Cubes:</strong> You have 2 actions per turn. You place cubes on the Action Panel to take actions.</li>
                </ul>
              </section>
            </div>
          )}

          {activeTab === 'ACTIONS' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="leading-relaxed">
                On your turn, you have <strong className="text-white">2 Actions</strong>. You spend Action Cubes on the Action Panel to perform them. The cost in Gold increases the more cubes are on a specific action slot.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-emerald-400 font-bold mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Production
                  </h4>
                  <p className="text-sm mb-3">Gain Gold and XP based on the tiles your units and castles occupy. This action costs 2 Actions instead of 1.</p>
                  <div className="flex gap-2 justify-center">
                    <div className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30">+ Gold</div>
                    <div className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-500/30">+ XP</div>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-blue-400 font-bold mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 11 4-7"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8c.9 0 1.8-.7 2-1.6l1.7-7.4"/><path d="m9 11 1 9"/><path d="M4.5 15.5h15"/><path d="m15 11-1 9"/></svg>
                    Recruit
                  </h4>
                  <p className="text-sm mb-3">Spawn a new unit at your Capital or any Castle you control.</p>
                  <div className="flex justify-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-400 flex items-center justify-center text-xs">W</div>
                    <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-blue-400 flex items-center justify-center text-xs">M</div>
                    <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-yellow-400 flex items-center justify-center text-xs">K</div>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-indigo-400 font-bold mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                    Move
                  </h4>
                  <p className="text-sm mb-3">Move a unit up to its maximum range. Base range is 1. Level 2 units have range 2. Level 3 units have range 3.</p>
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-500"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-500 border-dashed"></div>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-red-400 font-bold mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><path d="M8.5 8.5l-5 5"/></svg>
                    Combat
                  </h4>
                  <p className="text-sm">Attack an enemy unit or a monster on the same hex as your unit.</p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-orange-400 font-bold mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    Adventure
                  </h4>
                  <p className="text-sm">Explore an Adventure Marker on the map with a unit to gain random rewards.</p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-slate-300 font-bold mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-10-5-10 5Z"/><path d="M10 22v-6.5a1.5 1.5 0 0 1 3 0V22"/></svg>
                    Build Castle
                  </h4>
                  <p className="text-sm">Build a Castle on a hex you occupy. Castles act as spawn points and provide defense.</p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-purple-400 font-bold mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    Buy Skill
                  </h4>
                  <p className="text-sm">Purchase a skill from the Skill Market to equip on your units. <strong className="text-yellow-400">Can be done as a free action when taking the Production action.</strong></p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-yellow-400 font-bold mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Complete Quest
                  </h4>
                  <p className="text-sm">Claim the rewards for a completed quest. <strong className="text-yellow-400">Can be done as a free action when taking the Production action.</strong></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'COMBAT' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section>
                <h3 className="text-xl text-yellow-400 mb-2 fantasy-font">Combat Mechanics</h3>
                <p className="leading-relaxed mb-4">
                  Combat is resolved using dice. Each unit contributes dice to a shared pool based on their equipped skills.
                </p>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10">
                  <h4 className="font-bold text-white mb-4">Dice Types:</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded border border-white/5">
                      <div className="w-8 h-8 rounded bg-red-600 border border-white/20 flex items-center justify-center text-xs font-bold text-white">M</div>
                      <span className="text-sm"><strong className="text-red-400">Melee Dice</strong> (Damage)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded border border-white/5">
                      <div className="w-8 h-8 rounded bg-blue-500 border border-white/20 flex items-center justify-center text-xs font-bold text-white">M</div>
                      <span className="text-sm"><strong className="text-blue-400">Mana Dice</strong> (Damage)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded border border-white/5">
                      <div className="w-8 h-8 rounded bg-slate-500 border border-white/20 flex items-center justify-center text-xs font-bold text-white">D</div>
                      <span className="text-sm"><strong className="text-slate-400">Defense Dice</strong> (Block)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded border border-white/5">
                      <div className="w-8 h-8 rounded bg-blue-500 border border-slate-400 ring-1 ring-slate-400 flex items-center justify-center text-xs font-bold text-white">MD</div>
                      <span className="text-sm"><strong className="text-blue-300">Mana Defense</strong> (Block)</span>
                    </div>
                  </div>
                  
                  <p className="mt-3 text-sm text-slate-400">
                    Rolls can result in numbers (damage/defense) or an <strong className="text-yellow-400">Explosion (!)</strong> which allows you to roll an additional bonus die.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-xl text-yellow-400 mb-4 fantasy-font">Monsters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/30 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-lg bg-green-900/50 border-2 border-green-500 flex items-center justify-center mb-2 overflow-hidden">
                      <img 
                        src={MONSTER_STATS[0].image} 
                        alt="Level 1 Monster" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h4 className="font-bold text-green-400">Level 1</h4>
                    <span className="text-xs text-slate-300 mt-1">Found in Dungeons</span>
                  </div>
                  
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-yellow-500/30 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-lg bg-yellow-900/50 border-2 border-yellow-500 flex items-center justify-center mb-2 overflow-hidden">
                      <img 
                        src={MONSTER_LEVEL_2_STATS[0].image} 
                        alt="Level 2 Monster" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h4 className="font-bold text-yellow-400">Level 2</h4>
                    <span className="text-xs text-slate-300 mt-1">Found in Dungeons</span>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg border border-red-500/30 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-lg bg-red-900/50 border-2 border-red-500 flex items-center justify-center mb-2 overflow-hidden">
                      <img 
                        src={MONSTER_LEVEL_3_STATS[0].image} 
                        alt="Level 3 Monster" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h4 className="font-bold text-red-400">Level 3</h4>
                    <span className="text-xs text-slate-300 mt-1">Found in Dungeons</span>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/50 flex flex-col items-center text-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    <div className="w-16 h-16 rounded-lg bg-purple-900/50 border-2 border-purple-500 flex items-center justify-center mb-2 overflow-hidden">
                      <img 
                        src={BOSS_STATS[0].image} 
                        alt="The Boss" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h4 className="font-bold text-purple-400">The Boss</h4>
                    <span className="text-xs text-slate-300 mt-1">Center of the Map</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'UNITS' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section>
                <h3 className="text-xl text-yellow-400 mb-2 fantasy-font">Unit Types</h3>
                <p className="leading-relaxed mb-4">
                  There are three types of units in Alderys. Each unit can be leveled up using XP to increase their HP and unlock more skill slots.
                </p>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-indigo-500/30 mb-6">
                  <h4 className="font-bold text-indigo-400 mb-2">Level Up Requirements:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong className="text-white">Level 1 → Level 2:</strong> Costs <strong className="text-blue-400">3 XP</strong>.</li>
                    <li><strong className="text-white">Level 2 → Level 3:</strong> Costs <strong className="text-blue-400">6 XP</strong> AND the unit must have at least <strong className="text-yellow-400">one Level 2 skill</strong> equipped.</li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Warrior */}
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-400 flex items-center justify-center font-bold text-white">W</div>
                      <h4 className="text-lg font-bold text-white">Warrior</h4>
                    </div>
                    <p className="text-sm text-slate-400 mb-4 flex-1">A sturdy frontline fighter. Starts with <strong className="text-red-400">Sword 1</strong>.</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                        <span className="text-slate-300">Level 1</span>
                        <div className="flex gap-3 text-right">
                          <span className="text-green-400">1 HP</span>
                          <span className="text-yellow-400">2 Slots</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                        <span className="text-slate-300">Level 2</span>
                        <div className="flex gap-3 text-right">
                          <span className="text-green-400">2 HP</span>
                          <span className="text-yellow-400">2 Slots</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mage */}
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-blue-400 flex items-center justify-center font-bold text-blue-400">M</div>
                      <h4 className="text-lg font-bold text-blue-400">Mage</h4>
                    </div>
                    <p className="text-sm text-slate-400 mb-4 flex-1">A versatile spellcaster. Starts with two <strong className="text-blue-400">Magic 1</strong> skills.</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                        <span className="text-slate-300">Level 1</span>
                        <div className="flex gap-3 text-right">
                          <span className="text-green-400">1 HP</span>
                          <span className="text-yellow-400">3 Slots</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                        <span className="text-slate-300">Level 2</span>
                        <div className="flex gap-3 text-right">
                          <span className="text-green-400">2 HP</span>
                          <span className="text-yellow-400">3 Slots</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded border border-yellow-500/30">
                        <span className="text-yellow-500 font-bold">Level 3</span>
                        <div className="flex gap-3 text-right">
                          <span className="text-green-400 font-bold">3 HP</span>
                          <span className="text-yellow-400 font-bold">3 Slots</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Knight */}
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-yellow-400 flex items-center justify-center font-bold text-yellow-400">K</div>
                      <h4 className="text-lg font-bold text-yellow-400">Knight</h4>
                    </div>
                    <p className="text-sm text-slate-400 mb-4 flex-1">A heavily armored defender. Starts with <strong className="text-red-400">Sword 1</strong> and <strong className="text-slate-300">Defense 1</strong>.</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                        <span className="text-slate-300">Level 1</span>
                        <div className="flex gap-3 text-right">
                          <span className="text-green-400">2 HP</span>
                          <span className="text-yellow-400">4 Slots</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                        <span className="text-slate-300">Level 2</span>
                        <div className="flex gap-3 text-right">
                          <span className="text-green-400">3 HP</span>
                          <span className="text-yellow-400">4 Slots</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded border border-yellow-500/30">
                        <span className="text-yellow-500 font-bold">Level 3</span>
                        <div className="flex gap-3 text-right">
                          <span className="text-green-400 font-bold">5 HP</span>
                          <span className="text-yellow-400 font-bold">4 Slots</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'FACTIONS' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section>
                <h3 className="text-xl text-yellow-400 mb-4 fantasy-font">Factions</h3>
                <p className="leading-relaxed mb-6">
                  Each faction in Alderys has unique starting skills and mechanics that change how they play.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-blue-500/30">
                    <h4 className="text-lg font-bold text-blue-400 mb-2">Humans</h4>
                    <p className="text-sm text-slate-300 mb-3">Standard balanced faction with no special rules. Good for learning the game.</p>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg border border-emerald-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-500/30">
                        <img src={FACTION_UNIT_IMAGES.elf.warrior} alt="Elf" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <h4 className="text-lg font-bold text-emerald-400">Elfs</h4>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">Masters of magic and precision.</p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        <span><strong className="text-white">Elf Wisdom (Mage):</strong> Mana dice also explode on 0.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        <span><strong className="text-white">Elf Precision (Knight):</strong> Ignore 50% of enemy defense.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg border border-red-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-red-500/30">
                        <img src={FACTION_UNIT_IMAGES.orc.warrior} alt="Orc" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <h4 className="text-lg font-bold text-red-400">Orcs</h4>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">Brutal strength and shared battle-cries.</p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span><strong className="text-white">Orc War-Cry (Mage):</strong> Mage skill slot 1 is shared with all friendly units in combat.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span><strong className="text-white">Orc Brutality (Knight):</strong> Melee dice are 1,1,1,1,1,2 for all friendly units.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg border border-stone-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-stone-500/30">
                        <img src={FACTION_UNIT_IMAGES.dwarf.warrior} alt="Dwarf" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <h4 className="text-lg font-bold text-stone-400">Dwarfs</h4>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">Sturdy mountain dwellers with powerful channeling.</p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-stone-500 mt-1">•</span>
                        <span><strong className="text-white">Mountain Dweller (Passive):</strong> No red line penalty near mountains.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-stone-500 mt-1">•</span>
                        <span><strong className="text-white">Dwarven Channeling (Mage):</strong> Can Channel to double Mana dice next turn if survived.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-stone-500 mt-1">•</span>
                        <span><strong className="text-white">Dwarven Counter (Knight):</strong> Generate 1 damage per 2 defense.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-green-500/30">
                        <img src={FACTION_UNIT_IMAGES.ooze.warrior} alt="Ooze" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <h4 className="text-lg font-bold text-green-400">The Ooze</h4>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">Adaptive slime with unique growth mechanics.</p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span><strong className="text-white">Passive:</strong> Pay +1 XP per level when buying skills.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span><strong className="text-white">Slime Accumulation (Mage):</strong> Defeating enemies adds tokens (max 3). +1 mana dice per token in combat.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span><strong className="text-white">Adaptive Absorption (Knight):</strong> Defeating enemies grants a free skill of their level from market (max 1/combat).</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/30">
                    <h4 className="text-lg font-bold text-cyan-400 mb-2">Flying folks</h4>
                    <p className="text-sm text-slate-300 mb-3">Agile aerialists who turn melee into ranged strikes.</p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-500 mt-1">•</span>
                        <span><strong className="text-white">Aerial Superiority (Mage):</strong> Melee and mana dice attacks are considered ranged attacks for all friendly units.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-500 mt-1">•</span>
                        <span><strong className="text-white">Cloud Shield (Knight):</strong> Melee defense dice are 1,1,1,1,1,2.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'SKILLS' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section>
                <h3 className="text-xl text-yellow-400 mb-2 fantasy-font">Skill System</h3>
                <p className="leading-relaxed mb-4">
                  Skills are the primary way to customize and strengthen your units. You can buy skills from the <strong className="text-white">Skill Market</strong>.
                </p>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10 space-y-3">
                  <h4 className="font-bold text-white">How to Buy:</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Use the <strong className="text-white">Buy Skill</strong> action (costs 1 Action Cube).</li>
                    <li><strong className="text-yellow-400">Free Action:</strong> You can buy skills for free when taking the <strong className="text-white">Production</strong> action.</li>
                    <li>Level 1 skills cost only <strong className="text-yellow-500">Gold</strong>.</li>
                    <li>Level 2 & 3 skills cost both <strong className="text-yellow-500">Gold</strong> and <strong className="text-blue-400">XP</strong>.</li>
                    <li>A unit must have an empty slot to equip a new skill.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-xl text-yellow-400 mb-4 fantasy-font">Available Skills</h3>
                
                <div className="space-y-8">
                  {/* Level 1 */}
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3 border-b border-white/10 pb-1">Level 1 Skills</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-blue-400">Magic 1</div>
                          <div className="text-xs text-slate-400">+1 mana dice</div>
                        </div>
                        <div className="text-yellow-500 font-bold">5G</div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-red-400">Sword 1</div>
                          <div className="text-xs text-slate-400">+1 melee dice</div>
                        </div>
                        <div className="text-yellow-500 font-bold">4G</div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-emerald-400">Lucky 1</div>
                          <div className="text-xs text-slate-400">1 reroll option</div>
                        </div>
                        <div className="text-yellow-500 font-bold">3G</div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-300">Defense 1</div>
                          <div className="text-xs text-slate-400">+1 defense dice</div>
                        </div>
                        <div className="text-yellow-500 font-bold">4G</div>
                      </div>
                    </div>
                  </div>

                  {/* Level 2 */}
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3 border-b border-white/10 pb-1">Level 2 Skills</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-red-400">Sword 2A</div>
                          <div className="text-xs text-slate-400">2 melee dice, 1 defense dice</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">6G</div>
                          <div className="text-blue-400 text-xs font-bold">3 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-red-400">Sword 2B</div>
                          <div className="text-xs text-slate-400">2 melee dice, 1 reroll</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">6G</div>
                          <div className="text-blue-400 text-xs font-bold">2 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-orange-400">Ranged S</div>
                          <div className="text-xs text-slate-400">2 melee dice (first strike)</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">7G</div>
                          <div className="text-blue-400 text-xs font-bold">2 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-orange-400">Ranged M</div>
                          <div className="text-xs text-slate-400">1 melee dice (first strike)</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">7G</div>
                          <div className="text-blue-400 text-xs font-bold">2 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-300">Armor 2A</div>
                          <div className="text-xs text-slate-400">2 defense dice</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">5G</div>
                          <div className="text-blue-400 text-xs font-bold">1 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-300">Armor 2B</div>
                          <div className="text-xs text-slate-400">1 defense dice, 1 reroll</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">5G</div>
                          <div className="text-blue-400 text-xs font-bold">2 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-300">Armor 2C</div>
                          <div className="text-xs text-slate-400">1 defense dice, +1 HP</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">6G</div>
                          <div className="text-blue-400 text-xs font-bold">2 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-blue-400">Magic 2A</div>
                          <div className="text-xs text-slate-400">1 mana dice, 1 reroll</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">2G</div>
                          <div className="text-blue-400 text-xs font-bold">3 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-blue-400">Magic 2B</div>
                          <div className="text-xs text-slate-400">1 mana dice, 1 defense dice</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">2G</div>
                          <div className="text-blue-400 text-xs font-bold">3 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-purple-400">Magic Sword</div>
                          <div className="text-xs text-slate-400">1 mana dice, 1 melee dice</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">2G</div>
                          <div className="text-blue-400 text-xs font-bold">3 XP</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Level 3 */}
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3 border-b border-white/10 pb-1">Level 3 Skills</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-red-400">Sword 3A</div>
                          <div className="text-xs text-slate-400">2 melee dice, 2 defense dice</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">9G</div>
                          <div className="text-blue-400 text-xs font-bold">2 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-red-400">Sword 3B</div>
                          <div className="text-xs text-slate-400">2 melee dice, 1 defense dice, 1 reroll</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">9G</div>
                          <div className="text-blue-400 text-xs font-bold">2 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-blue-400">Magic 3A</div>
                          <div className="text-xs text-slate-400">2 mana dice, 1 reroll</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">4G</div>
                          <div className="text-blue-400 text-xs font-bold">6 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-blue-400">Magic 3B</div>
                          <div className="text-xs text-slate-400">2 mana dice, 1 defense dice</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">4G</div>
                          <div className="text-blue-400 text-xs font-bold">6 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-300">Defense 3A</div>
                          <div className="text-xs text-slate-400">+2hp, 1 defense dice</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">10G</div>
                          <div className="text-blue-400 text-xs font-bold">1 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-300">Defense 3B</div>
                          <div className="text-xs text-slate-400">2 defense mana dice</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">3G</div>
                          <div className="text-blue-400 text-xs font-bold">6 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-orange-400">Ranged M2</div>
                          <div className="text-xs text-slate-400">2 ranged mana dice</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">3G</div>
                          <div className="text-blue-400 text-xs font-bold">6 XP</div>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 p-3 rounded border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-orange-400">Ranged S3</div>
                          <div className="text-xs text-slate-400">3 ranged melee dice</div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-500 font-bold">10G</div>
                          <div className="text-blue-400 text-xs font-bold">3 XP</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'SCORING' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                </div>
                <p className="leading-relaxed text-lg">
                  The first player to reach <strong className="text-yellow-500 text-xl">10 VP</strong> instantly wins the game.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10 flex gap-4">
                  <div className="mt-1 text-yellow-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <div>
                    <h4 className="text-lg text-yellow-400 font-bold mb-1">Quests</h4>
                    <p className="text-sm">Complete your Secret Quest or Public Quests to earn VP. Quests usually grant 1 or 2 VP.</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10 flex gap-4">
                  <div className="mt-1 text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/></svg>
                  </div>
                  <div>
                    <h4 className="text-lg text-purple-400 font-bold mb-1">Defeating Monsters</h4>
                    <p className="text-sm">The first time you defeat a Level 2 Monster, you gain 1 VP. The first time you defeat a Level 3 Monster, you gain <strong className="text-white">2 VP</strong>.</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10 flex gap-4">
                  <div className="mt-1 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <div>
                    <h4 className="text-lg text-red-500 font-bold mb-1">Defeating The Boss</h4>
                    <p className="text-sm">Defeating the central Boss grants a massive <strong className="text-white">4 VP</strong>.</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10 flex gap-4">
                  <div className="mt-1 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><path d="M10 9h4"/><path d="M10 13h4"/></svg>
                  </div>
                  <div>
                    <h4 className="text-lg text-blue-400 font-bold mb-1">Ancient Cities</h4>
                    <p className="text-sm">Controlling an Ancient City (having a unit or castle on it) grants a passive <strong className="text-white">+1 VP</strong> as long as you control it.</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10 flex gap-4">
                  <div className="mt-1 text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13 4 4-4 4"/></svg>
                  </div>
                  <div>
                    <h4 className="text-lg text-emerald-400 font-bold mb-1">Monuments</h4>
                    <p className="text-sm">You can build a Monument using the Action Panel for 10 Gold and 5 XP to gain a permanent <strong className="text-white">+1 VP</strong>.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RuleBookModal;
