
import React, { useState } from 'react';
import { Player, Skill, UnitType } from '../types';

interface SkillReorganizerProps {
  player: Player;
  floatingSkill: Skill | null;
  onUpdateSkills: (unitTypeSkills: Player['unitTypeSkills'], floatingSkill: Skill | null) => void;
  onConfirm: () => void;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const SkillReorganizer: React.FC<SkillReorganizerProps> = ({ 
  player, 
  floatingSkill, 
  onUpdateSkills, 
  onConfirm,
  onHover,
  onClearHover
}) => {
  const [draggedSkill, setDraggedSkill] = useState<{ type: string | 'floating', index?: number } | null>(null);

  const unitTypes: ('warrior' | 'mage' | 'knight')[] = ['warrior', 'mage', 'knight'];

  const handleSlotClick = (type: 'warrior' | 'mage' | 'knight', index: number) => {
    const currentSkill = player.unitTypeSkills[type][index];
    
    // If we have a floating skill, try to swap it
    if (floatingSkill) {
      // Check level requirement
      const unitLevel = player.unitLevels[type];
      if (floatingSkill.level > unitLevel) {
        // Cannot place higher level skill in lower level unit
        return;
      }

      const newUnitSkills = { ...player.unitTypeSkills };
      const skillsForType = [...newUnitSkills[type]];
      skillsForType[index] = floatingSkill;
      newUnitSkills[type] = skillsForType;

      onUpdateSkills(newUnitSkills, (currentSkill && !currentSkill.isInitial && !currentSkill.isUnique) ? currentSkill : null);
    } else if (currentSkill && !currentSkill.isUnique && !currentSkill.isInitial) {
      // Pick up skill (only non-initial)
      const newUnitSkills = { ...player.unitTypeSkills };
      const skillsForType = [...newUnitSkills[type]];
      skillsForType[index] = null;
      newUnitSkills[type] = skillsForType;
      
      onUpdateSkills(newUnitSkills, currentSkill);
    }
  };

  const handleFloatingSkillClick = () => {
    // If we clicked the floating skill while it's already floating, nothing happens 
    // (it's already the floatingSkill state)
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-md p-2 md:p-4">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl md:rounded-3xl w-full max-w-4xl max-h-[90vh] md:max-h-[95vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(79,70,229,0.3)]">
        <div className="p-3 md:p-6 bg-slate-800 border-b border-white/10 flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-center text-center md:text-left">
          <div>
            <h2 className="fantasy-font text-lg md:text-2xl text-indigo-400">Skill Reorganization</h2>
            <p className="text-slate-400 text-[8px] md:text-sm">Organize your skills between units. Level requirements still apply.</p>
          </div>
          <button 
            onClick={onConfirm}
            disabled={!!floatingSkill}
            className={`w-full md:w-auto px-4 md:px-8 py-2 md:py-3 rounded-xl fantasy-font text-base md:text-xl transition-all ${
              floatingSkill 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
            }`}
          >
            Confirm Changes
          </button>
        </div>

        <div className="p-3 md:p-8 flex flex-col gap-3 md:gap-8 overflow-y-auto">
          {/* Floating Skill Section */}
          <div className="flex flex-col items-center gap-1.5 md:gap-4 py-2 md:py-6 bg-indigo-950/20 border border-indigo-500/20 rounded-xl md:rounded-2xl shrink-0">
            <h3 className="text-[8px] md:text-xs uppercase tracking-widest text-indigo-300 font-bold">Floating Skill</h3>
            <div 
              className={`w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                floatingSkill 
                  ? 'bg-slate-800 border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.3)]' 
                  : 'bg-slate-900/50 border-dashed border-white/10'
              }`}
              onMouseEnter={(e) => floatingSkill && onHover('SKILL', floatingSkill, e.clientX, e.clientY)}
              onMouseLeave={onClearHover}
            >
              {floatingSkill ? (
                <div className="text-center p-1">
                  <div className="text-[9px] md:text-[10px] font-bold text-white leading-tight">{floatingSkill.name}</div>
                  <div className="text-[7px] md:text-[8px] text-indigo-400 font-bold mt-1">LVL {floatingSkill.level}</div>
                </div>
              ) : (
                <span className="text-slate-700 text-[8px] md:text-[10px] uppercase font-bold">Empty</span>
              )}
            </div>
            {floatingSkill && (
              <p className="text-[10px] text-indigo-300 animate-pulse font-medium">Click a slot below to place</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {unitTypes.map(type => (
              <div key={type} className="bg-slate-800/50 border border-white/5 rounded-2xl p-3 md:p-4 flex flex-col gap-3 md:gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="capitalize font-bold text-white flex items-center gap-2 text-sm md:text-base">
                    {type}
                    <span className="text-[9px] md:text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">LVL {player.unitLevels[type]}</span>
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                  {player.unitTypeSkills[type].map((skill, idx) => {
                    const canPlace = floatingSkill && floatingSkill.level <= player.unitLevels[type];
                    const isUnique = skill?.isUnique;
                    const isInitial = skill?.isInitial;
                    
                    // Logic: 
                    // 1. Unique skills are truly fixed (cannot move, cannot replace).
                    // 2. Initial skills cannot be moved/picked up, but CAN be replaced by new skills.
                    // 3. Normal skills can be moved and replaced.
                    
                    const canPickUp = skill && !isUnique && !isInitial;
                    const canPlaceOver = !isUnique && floatingSkill && floatingSkill.level <= player.unitLevels[type];
                    const canClick = floatingSkill ? canPlaceOver : canPickUp;

                    return (
                      <button
                        key={idx}
                        onClick={() => canClick && handleSlotClick(type, idx)}
                        onMouseEnter={(e) => skill && onHover('SKILL', skill, e.clientX, e.clientY)}
                        onMouseLeave={onClearHover}
                        disabled={!canClick}
                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all relative group ${
                          isUnique
                            ? 'bg-slate-900 border-indigo-500/30 cursor-not-allowed opacity-60'
                            : isInitial && !floatingSkill
                              ? 'bg-slate-900 border-white/5 cursor-not-allowed opacity-60'
                              : skill
                                ? 'bg-slate-800 border-white/10 hover:border-indigo-400 cursor-pointer shadow-sm'
                                : floatingSkill && canPlaceOver
                                  ? 'bg-indigo-900/20 border-dashed border-indigo-400/50 hover:bg-indigo-900/40 cursor-pointer'
                                  : 'bg-slate-900/30 border-dashed border-white/5 cursor-default'
                        }`}
                      >
                        {skill ? (
                          <>
                            <div className="text-[8px] md:text-[9px] font-bold text-slate-200 text-center leading-tight px-1">{skill.name}</div>
                            <div className="text-[6px] md:text-[7px] text-slate-500 mt-0.5 md:mt-1 uppercase">Lvl {skill.level}</div>
                            {canClick && (
                              <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                <span className="text-[7px] md:text-[8px] font-bold text-white uppercase bg-indigo-600 px-1 rounded shadow-lg">
                                  {floatingSkill ? 'Replace' : 'Pick Up'}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center opacity-40">
                             <span className="text-[7px] md:text-[8px] text-slate-600 uppercase font-bold">Slot {idx+1}</span>
                             {floatingSkill && canPlaceOver && (
                               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400 mt-0.5 md:mt-1 md:w-3 md:h-3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                             )}
                          </div>
                        )}
                        {isUnique && (
                          <div className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 bg-indigo-600 text-[5px] md:text-[6px] text-white px-1 rounded border border-indigo-400 font-bold uppercase z-10">Unique</div>
                        )}
                        {isInitial && !isUnique && (
                          <div className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 bg-slate-700 text-[5px] md:text-[6px] text-slate-300 px-1 rounded border border-white/10 font-bold uppercase z-10">Initial</div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {floatingSkill && floatingSkill.level > player.unitLevels[type] && (
                  <p className="text-[7px] md:text-[8px] text-red-500 text-center font-bold uppercase tracking-tighter">Requires Unit Lvl {floatingSkill.level}</p>
                )}
              </div>
            ))}
          </div>

          <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3 md:p-4">
            <h4 className="text-[9px] md:text-[10px] uppercase text-slate-500 font-bold mb-1 md:mb-2 text-center md:text-left">Rules</h4>
            <ul className="text-[8px] md:text-[10px] text-slate-400 space-y-1">
              <li>• Move any skill that is not an initial/unique skill.</li>
              <li>• Units can only equip skills ≤ their current level.</li>
              <li>• All skills must be placed before confirming.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillReorganizer;
