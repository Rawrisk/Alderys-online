import React from 'react';
import { Player, Skill } from '../types';
import { UNIT_STATS, SKILLS } from '../constants';

interface LevelUpModalProps {
  player: Player;
  isLowStart: boolean;
  onLevelUp: (unitType: 'warrior' | 'mage' | 'knight') => void;
  onActivateFactionSkill: (skillId: string, unitType: 'warrior' | 'mage' | 'knight' | 'passive') => void;
  onCancel: () => void;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ player, isLowStart, onLevelUp, onActivateFactionSkill, onCancel, onHover, onClearHover }) => {
  const getCost = (currentLevel: number) => {
    if (currentLevel === 1) return 3;
    if (currentLevel === 2) return 6;
    return Infinity;
  };

  const maxLevels = {
    warrior: 2,
    mage: 3,
    knight: 3
  };

  const renderUnitOption = (unitType: 'warrior' | 'mage' | 'knight', name: string) => {
    const currentLevel = player.unitLevels[unitType];
    const maxLevel = maxLevels[unitType];
    const cost = getCost(currentLevel);
    const canAfford = player.xp >= cost;
    const isMaxLevel = currentLevel >= maxLevel;
    
    // New requirement: to go from 2 to 3, must have at least one level 2 skill
    const hasLevel2Skill = player.unitTypeSkills[unitType].some(s => s && s.level === 2);
    const meetsSkillRequirement = currentLevel < 2 || hasLevel2Skill;

    return (
      <button
        onClick={() => onLevelUp(unitType)}
        onMouseEnter={(e) => onHover('UNIT', { type: unitType, level: currentLevel, stats: UNIT_STATS[unitType], skills: player.unitTypeSkills[unitType], faction: player.faction }, e.clientX, e.clientY)}
        onMouseLeave={onClearHover}
        disabled={!canAfford || isMaxLevel || !meetsSkillRequirement}
        className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
          !canAfford || isMaxLevel || !meetsSkillRequirement
            ? 'bg-slate-800/50 border-white/5 opacity-50 cursor-not-allowed'
            : 'bg-slate-800 border-indigo-500/30 hover:border-indigo-500 hover:bg-slate-700 cursor-pointer'
        }`}
      >
        <span className="font-bold text-lg text-slate-200 uppercase tracking-widest">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Lvl {currentLevel}</span>
          {!isMaxLevel && (
            <>
              <span className="text-slate-500">→</span>
              <span className="text-sm text-indigo-400 font-bold">Lvl {currentLevel + 1}</span>
            </>
          )}
        </div>
        {!isMaxLevel ? (
          <div className="flex flex-col items-center gap-1">
            <span className={`text-xs font-bold ${canAfford ? 'text-blue-400' : 'text-red-400'}`}>
              Cost: {cost} XP
            </span>
            {currentLevel === 2 && !hasLevel2Skill && (
              <span className="text-[10px] text-red-400 font-bold uppercase text-center">
                Requires Lvl 2 Skill
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs font-bold text-yellow-500">MAX LEVEL</span>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-[0_0_30px_rgba(99,102,241,0.2)]">
        <div className="p-6 bg-slate-800 border-b border-white/10 flex justify-between items-center">
          <h2 className="fantasy-font text-2xl text-indigo-400 uppercase tracking-widest">Level Up</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Your XP:</span>
            <span className="text-lg font-bold text-blue-400">{player.xp}</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderUnitOption('warrior', 'Warrior')}
          {renderUnitOption('mage', 'Mage')}
          {renderUnitOption('knight', 'Knight')}
        </div>

        {isLowStart && (
          <div className="p-6 border-t border-white/10 bg-slate-900/50">
            <h3 className="fantasy-font text-lg text-emerald-400 mb-4 uppercase tracking-widest">Faction Skills (3 XP)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(SKILLS).filter(s => s.isUnique && s.id.toLowerCase().includes(player.faction?.toLowerCase() || '')).map(skill => {
                const isPassive = skill.id === 'DWARF_PASSIVE';
                const unitType = skill.id.includes('MAGE') ? 'mage' : skill.id.includes('KNIGHT') ? 'knight' : isPassive ? 'passive' : 'warrior';
                
                const alreadyHas = isPassive 
                  ? player.passives.includes(skill.id)
                  : player.unitTypeSkills[unitType as 'warrior' | 'mage' | 'knight'].some(s => s?.id === skill.id);
                
                const canAfford = player.xp >= 3;
                
                if (alreadyHas) return null;

                return (
                  <button
                    key={skill.id}
                    onClick={() => onActivateFactionSkill(skill.id, unitType as any)}
                    onMouseEnter={(e) => onHover('SKILL', skill, e.clientX, e.clientY)}
                    onMouseLeave={onClearHover}
                    disabled={!canAfford}
                    className={`p-3 rounded-lg border flex flex-col items-start gap-1 transition-all ${
                      !canAfford
                        ? 'bg-slate-800/50 border-white/5 opacity-50 cursor-not-allowed'
                        : 'bg-slate-800 border-emerald-500/30 hover:border-emerald-500 hover:bg-slate-700 cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between w-full">
                      <span className="font-bold text-emerald-400 text-sm">{skill.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{unitType}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-left line-clamp-2">{skill.effect}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 bg-slate-800 border-t border-white/10 flex justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;
