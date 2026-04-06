
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HoverData, Skill, Unit, Building, HexTile, Quest, TileType } from '../types';
import { UNIT_STATS, MONSTER_STATS, MONSTER_LEVEL_2_STATS, MONSTER_LEVEL_3_STATS } from '../constants';
import { Shield, Sword, Heart, Zap, Star, MapPin } from 'lucide-react';

interface MagnifierProps {
  hoverData: HoverData | null;
  isVisible: boolean;
}

const Magnifier: React.FC<MagnifierProps> = ({ hoverData, isVisible }) => {
  if (!hoverData || !isVisible) return null;

  const { type, data, x, y } = hoverData;

  const renderContent = () => {
    switch (type) {
      case 'UNIT': {
        const unit = data as any;
        const stats = unit.stats || UNIT_STATS[unit.type as keyof typeof UNIT_STATS];
        const skills = unit.skills || [];
        
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold capitalize text-white">{unit.type}</h3>
                {unit.faction && (
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{unit.faction} Faction</span>
                )}
              </div>
              <div className="flex flex-col items-end">
                <div className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/30">
                  Level {unit.level || 1}
                </div>
                {unit.playerId && (
                  <span className="text-[8px] text-slate-500 mt-1">Player {unit.playerId}</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-red-400">
                <Heart size={14} />
                <span className="font-bold text-sm">{unit.hp !== undefined ? `${unit.hp} / ${unit.maxHp || stats.hp}` : `${stats.hp} HP`}</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-400">
                <Sword size={14} />
                <span className="font-bold text-sm">{stats.attack || stats.dice?.melee || 0} ATK</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <Shield size={14} />
                <span className="font-bold text-sm">{stats.defense || stats.dice?.defense || 0} DEF</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400">
                <Zap size={14} />
                <span className="font-bold text-sm">{stats.dice?.mana || 0} MANA</span>
              </div>
            </div>

            {skills.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-white/5">
                <div className="text-[9px] text-slate-500 uppercase font-bold">Skills</div>
                <div className="flex flex-wrap gap-1">
                  {skills.map((s: any, i: number) => s && (
                    <span key={i} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-white/5">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {unit.isExhausted && (
              <div className="bg-orange-500/20 text-orange-400 p-1.5 rounded text-[10px] border border-orange-500/30 text-center font-bold">
                EXHAUSTED ({unit.exhaustionRemainingTurns} turns)
              </div>
            )}
          </div>
        );
      }
      case 'SKILL': {
        const skill = data as Skill;
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xl font-bold text-yellow-500">{skill.name}</h3>
              <div className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs font-bold border border-yellow-500/30">
                Level {skill.level}
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed italic">"{skill.effect}"</p>
            <div className="flex gap-2">
              <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                {skill.type}
              </span>
              {skill.isUnique && (
                <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                  UNIQUE
                </span>
              )}
            </div>
          </div>
        );
      }
      case 'BUILDING': {
        const building = data as Building;
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xl font-bold capitalize text-white">{building.type}</h3>
              <div className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold border border-green-500/30">
                Player {building.playerId}
              </div>
            </div>
            <div className="text-slate-300 text-sm">
              {building.type === 'capital' ? 'The heart of your empire. Produces gold and XP.' : 'A strategic fortress that allows unit recruitment and provides defense.'}
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <MapPin size={14} />
              <span>Position: {building.q}, {building.r}</span>
            </div>
          </div>
        );
      }
      case 'QUEST': {
        const quest = data as Quest;
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xl font-bold text-blue-400">Quest</h3>
              <div className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold border border-blue-500/30">
                {quest.rewardVP} VP
              </div>
            </div>
            <p className="text-slate-200 font-medium">{quest.description}</p>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Type: {quest.type}
            </div>
          </div>
        );
      }
      case 'TILE': {
        const tile = data as HexTile;
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xl font-bold text-white">{tile.type ? tile.type.replace('_', ' ') : ''}</h3>
              {!tile.isRevealed && (
                <div className="bg-slate-700 text-slate-400 px-2 py-0.5 rounded text-xs font-bold">
                  Hidden
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800/50 p-2 rounded border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Gold</div>
                <div className="text-yellow-500 font-bold">+{tile.productionGold}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase font-bold">XP</div>
                <div className="text-blue-400 font-bold">+{tile.productionXP}</div>
              </div>
            </div>
            {tile.castleSlots > 0 && (
              <div className="text-xs text-green-400 font-bold">
                Available Castle Slots: {tile.castleSlots}
              </div>
            )}
          </div>
        );
      }
      case 'MONSTER': {
        const monster = data as any;
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xl font-bold text-red-500">{monster.name || 'Monster'}</h3>
              <div className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold border border-red-500/30">
                {monster.hp > 10 ? 'BOSS' : `HP: ${monster.hp}`}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-red-400">
                <Heart size={16} />
                <span className="font-bold">{monster.hp} HP</span>
              </div>
              {monster.dice && (
                <div className="flex items-center gap-2 text-yellow-400 col-span-2">
                  <Sword size={16} />
                  <div className="flex gap-1">
                    {Array.isArray(monster.dice) ? (
                      monster.dice.map((d: string, i: number) => (
                        <span key={i} className="text-[10px] bg-slate-800 px-1 rounded border border-white/5">{d}</span>
                      ))
                    ) : (
                      Object.entries(monster.dice).map(([key, val], i) => (
                        <span key={i} className="text-[10px] bg-slate-800 px-1 rounded border border-white/5">{key}: {val as number}</span>
                      ))
                    )}
                  </div>
                </div>
              )}
              {monster.defenseDice !== undefined && (
                <div className="flex items-center gap-2 text-blue-400">
                  <Shield size={16} />
                  <span className="font-bold">{monster.defenseDice} DEF Dice</span>
                </div>
              )}
              {monster.manaDefenseDice !== undefined && (
                <div className="flex items-center gap-2 text-blue-300">
                  <Shield size={16} className="fill-blue-500/20" />
                  <span className="font-bold">{monster.manaDefenseDice} Mana DEF</span>
                </div>
              )}
              {monster.rerolls !== undefined && (
                <div className="flex items-center gap-2 text-purple-400">
                  <Star size={16} />
                  <span className="font-bold">{monster.rerolls} Rerolls</span>
                </div>
              )}
              {monster.attackOptions && (
                <div className="col-span-2 space-y-1 pt-2 border-t border-white/5">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Attack Options</div>
                  <div className="grid grid-cols-2 gap-1">
                    {monster.attackOptions.map((opt: any, i: number) => (
                      <div key={i} className="text-[9px] bg-slate-800/50 p-1 rounded border border-white/5 flex justify-between">
                        {opt.MELEE > 0 && <span className="text-red-400">M:{opt.MELEE}</span>}
                        {opt.MANA > 0 && <span className="text-blue-400">Ma:{opt.MANA}</span>}
                        {opt.RANGED_MANA > 0 && <span className="text-purple-400">R:{opt.RANGED_MANA}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {monster.rewards && (
              <div className="pt-2 border-t border-white/5 flex justify-between text-[10px]">
                <span className="text-yellow-500">Gold: +{monster.rewards.gold}</span>
                <span className="text-blue-400">XP: +{monster.rewards.xp}</span>
                <span className="text-purple-400">VP: +{monster.rewards.vp}</span>
              </div>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Calculate position to keep it on screen
  const offset = 20;
  let left = x + offset;
  let top = y + offset;

  // Simple screen boundary check (assuming 300px width for magnifier)
  if (left + 300 > window.innerWidth) {
    left = x - 320;
  }
  if (top + 200 > window.innerHeight) {
    top = y - 220;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{
          position: 'fixed',
          left,
          top,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
        className="w-72 bg-slate-900/95 backdrop-blur-md border-2 border-yellow-500/50 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-500/10 to-transparent pointer-events-none" />
        
        {renderContent()}
        
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
            <Star size={10} className="text-yellow-500/50" />
            Alderys Chronicles
          </div>
          <div className="text-[9px] text-yellow-500/50 font-bold uppercase">
            Alt View Active
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Magnifier;
