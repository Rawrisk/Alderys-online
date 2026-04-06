
import React from 'react';
import { Unit, Skill } from '../types';

interface SkillSlotSelectorProps {
  unitType: string;
  skills: (Skill | null)[];
  onSelectSlot: (index: number) => void;
  onCancel: () => void;
  selectedSkill: Skill;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const SkillSlotSelector: React.FC<SkillSlotSelectorProps> = ({ unitType, skills, onSelectSlot, onCancel, selectedSkill, onHover, onClearHover }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-yellow-500/50 rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-800 border-b border-white/10 flex justify-between items-center">
          <h2 className="fantasy-font text-xl text-yellow-500">Select Skill Slot</h2>
          <button 
            onClick={onCancel}
            className="text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="text-slate-300 mb-1">Applying <span className="text-yellow-500 font-bold">{selectedSkill.name}</span> to all</p>
            <p className="text-xl font-bold capitalize text-white">{unitType}s</p>
          </div>

          <div className="flex gap-4 justify-center">
            {skills.map((skill, index) => {
              const isSharedSlot = unitType === 'mage' && index === 1 && skills.some(s => s?.id === 'ORC_MAGE_UNIQUE');
              return (
                <button
                  key={index}
                  onClick={() => !skill?.isUnique && onSelectSlot(index)}
                  onMouseEnter={(e) => skill && onHover('SKILL', skill, e.clientX, e.clientY)}
                  onMouseLeave={onClearHover}
                  disabled={skill?.isUnique}
                  className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center transition-all group relative ${
                    skill?.isUnique 
                      ? 'bg-slate-900 border-indigo-500/50 cursor-not-allowed opacity-80' 
                      : isSharedSlot
                        ? 'bg-slate-800 border-2 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)] cursor-pointer'
                        : 'bg-slate-800 border-2 border-white/10 hover:border-yellow-500/50 cursor-pointer'
                  }`}
                >
                  {skill ? (
                    <>
                      <div className="text-[8px] text-slate-500 uppercase mb-1">Slot {index + 1}</div>
                      <div className="text-[10px] font-bold text-slate-200 text-center leading-tight">{skill.name}</div>
                      {!skill.isUnique && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-[8px] text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Replace</div>
                      )}
                      {skill.isUnique && (
                        <div className="absolute -top-2 -right-2 bg-indigo-600 text-[8px] text-white px-1 rounded border border-indigo-400">Unique</div>
                      )}
                      {isSharedSlot && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-600 text-[7px] text-white px-1 rounded border border-yellow-400 whitespace-nowrap z-10">Shared Slot</div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="text-[8px] text-slate-500 uppercase mb-1">Slot {index + 1}</div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      {isSharedSlot && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-600 text-[7px] text-white px-1 rounded border border-yellow-400 whitespace-nowrap z-10">Shared Slot</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500 italic">You can place a new skill over an existing one.</p>
        </div>
      </div>
    </div>
  );
};

export default SkillSlotSelector;
