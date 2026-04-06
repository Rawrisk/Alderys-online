
import React from 'react';
import { Skill } from '../types';
import { SKILLS } from '../constants';

interface SkillMarketProps {
  onSelectSkill: (skill: Skill) => void;
  onCancel: () => void;
  playerGold: number;
  playerXP?: number;
  playerFaction?: string;
  hasLevel2Unit?: boolean;
  hasLevel3Unit?: boolean;
  availableLevel2Skills?: Skill[];
  availableLevel3Skills?: Skill[];
  isViewOnly?: boolean;
  isFreeSkill?: boolean;
  freeSkillLevel?: number | null;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const SkillMarket: React.FC<SkillMarketProps> = ({ 
  onSelectSkill, 
  onCancel, 
  playerGold, 
  playerXP = 0,
  playerFaction = '',
  hasLevel2Unit = false,
  hasLevel3Unit = false,
  availableLevel2Skills = [],
  availableLevel3Skills = [],
  isViewOnly = false,
  isFreeSkill = false,
  freeSkillLevel = null,
  onHover,
  onClearHover
}) => {
  const level1Skills = (Object.values(SKILLS) as Skill[]).filter(s => !s.isUnique);

  const renderSkillButton = (skill: Skill) => {
    const isLevel2 = skill.level === 2;
    const isLevel3 = skill.level === 3;
    
    let extraXP = 0;
    if (playerFaction === 'ooze' && !isFreeSkill) {
      extraXP = skill.level;
    }
    
    const totalXPNeeded = ((isLevel2 || isLevel3) && skill.costXP ? skill.costXP : 0) + extraXP;

    const canAffordGold = isFreeSkill ? true : playerGold >= skill.cost;
    const canAffordXP = isFreeSkill ? true : playerXP >= totalXPNeeded;
    
    let meetsLevelReq = true;
    if (isLevel2) meetsLevelReq = hasLevel2Unit;
    if (isLevel3) meetsLevelReq = hasLevel3Unit;
    
    // If free skill, must match the level
    const levelMatches = isFreeSkill ? (freeSkillLevel === null || skill.level === freeSkillLevel) : true;
    
    const canBuy = canAffordGold && canAffordXP && meetsLevelReq && levelMatches;

    return (
      <button
        key={skill.id}
        onClick={() => !isViewOnly && onSelectSkill(skill)}
        onMouseEnter={(e) => onHover('SKILL', skill, e.clientX, e.clientY)}
        onMouseLeave={onClearHover}
        disabled={isViewOnly || !canBuy}
        className={`p-3 rounded-lg border flex flex-col items-center transition-all ${
          isViewOnly 
            ? 'bg-slate-800 border-white/20 cursor-default'
            : canBuy 
              ? 'bg-slate-800 hover:bg-slate-700 border-white/20 hover:border-yellow-500/50' 
              : 'bg-slate-900/50 border-white/5 opacity-50 cursor-not-allowed'
        }`}
      >
        <div className="w-10 h-10 bg-slate-700 rounded border border-white/10 flex items-center justify-center mb-2 shadow-inner relative">
           <SkillIcon type={skill.type as any} />
           {isLevel2 && (
             <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-indigo-400">
               Lvl 2
             </div>
           )}
           {isLevel3 && (
             <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-purple-400">
               Lvl 3
             </div>
           )}
        </div>
        <span className="text-[10px] text-slate-500 mb-1">{skill.name}</span>
        <p className="font-bold text-xs md:text-sm text-slate-100 text-center leading-tight mb-2">{skill.effect}</p>
        <div className="flex flex-col items-center gap-0.5">
          {isFreeSkill ? (
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Free</span>
          ) : (
            <>
              <span className="text-[10px] text-yellow-500 font-bold">{skill.cost} Gold</span>
              {totalXPNeeded > 0 && (
                <span className="text-[10px] text-blue-400 font-bold">{totalXPNeeded} XP</span>
              )}
            </>
          )}
        </div>
        {!meetsLevelReq && !isViewOnly && (
          <span className="text-[8px] text-red-400 mt-1 font-bold">Requires Lvl {skill.level} Unit</span>
        )}
        {isFreeSkill && !levelMatches && (
          <span className="text-[8px] text-red-400 mt-1 font-bold">Must be Lvl {freeSkillLevel}</span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/80 backdrop-blur rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between w-full items-center mb-4">
        <h3 className="text-yellow-500 fantasy-font text-lg md:text-xl">
          Skill Market
        </h3>
        <button 
          onClick={onCancel}
          className="px-3 py-1 md:px-4 md:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors text-sm"
        >
          {isViewOnly ? 'Close' : 'Cancel'}
        </button>
      </div>
      
      <div className="w-full mb-4">
        <h4 className="text-slate-300 text-sm font-bold mb-2 uppercase tracking-wider">Basic Skills</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          {level1Skills.map((skill) => renderSkillButton(skill as Skill))}
        </div>
      </div>

      {availableLevel2Skills.length > 0 && (
        <div className="w-full mb-4">
          <h4 className="text-indigo-300 text-sm font-bold mb-2 uppercase tracking-wider">Advanced Skills (Lvl 2)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            {availableLevel2Skills.filter(s => !s.isUnique).map((skill) => renderSkillButton(skill))}
          </div>
        </div>
      )}

      {availableLevel3Skills.length > 0 && (
        <div className="w-full">
          <h4 className="text-purple-300 text-sm font-bold mb-2 uppercase tracking-wider">Elite Skills (Lvl 3)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            {availableLevel3Skills.filter(s => !s.isUnique).map((skill) => renderSkillButton(skill))}
          </div>
        </div>
      )}
    </div>
  );
};

const SkillIcon: React.FC<{ type: 'MAGIC' | 'SWORD' | 'LUCKY' | 'DEFENSE' | 'RANGED' | 'ARMOR' }> = ({ type }) => {
  switch (type) {
    case 'MAGIC':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;
    case 'SWORD':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="20" y2="20"/><line x1="14.5" y1="17.5" x2="13" y2="19"/></svg>;
    case 'LUCKY':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r=".5" fill="currentColor"/><circle cx="15.5" cy="8.5" r=".5" fill="currentColor"/><circle cx="15.5" cy="15.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="15.5" r=".5" fill="currentColor"/><circle cx="12" cy="12" r=".5" fill="currentColor"/></svg>;
    case 'DEFENSE':
    case 'ARMOR':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>;
    case 'RANGED':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="m14.5 14.5-9 9"/><path d="M16 16 4 4"/><path d="M10.5 10.5 1.5 1.5"/><path d="M20 4v5.5l-5.5-5.5H20Z"/><path d="M4 20h5.5l-5.5-5.5V20Z"/></svg>;
    default:
      return null;
  }
};

export default SkillMarket;
