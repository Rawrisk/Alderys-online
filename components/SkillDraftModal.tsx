
import React, { useState } from 'react';
import { Skill } from '../types';

interface SkillDraftModalProps {
  pool: { mages: Skill[], knights: Skill[] };
  onComplete: (mage: Skill, knight: Skill) => void;
  playerName: string;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const SkillDraftModal: React.FC<SkillDraftModalProps> = ({ pool, onComplete, playerName, onHover, onClearHover }) => {
  const [selectedMage, setSelectedMage] = useState<Skill | null>(null);
  const [selectedKnight, setSelectedKnight] = useState<Skill | null>(null);

  // Pick 2 random from each pool for this player's choice
  const [mageChoices] = useState(() => [...pool.mages].sort(() => 0.5 - Math.random()).slice(0, 2));
  const [knightChoices] = useState(() => [...pool.knights].sort(() => 0.5 - Math.random()).slice(0, 2));

  const handleConfirm = () => {
    if (selectedMage && selectedKnight) {
      onComplete(selectedMage, selectedKnight);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 border border-purple-500/50 rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl fantasy-font text-purple-400 mb-2">Skill Draft: {playerName}</h2>
          <p className="text-slate-400 italic">Choose one unique skill for your Mages and one for your Knights.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mage Skills */}
          <div className="space-y-4">
            <h3 className="text-xl fantasy-font text-blue-400 border-b border-blue-500/30 pb-2">Mage Unique Skills</h3>
            <div className="grid grid-cols-1 gap-3">
              {mageChoices.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => setSelectedMage(skill)}
                  onMouseEnter={(e) => onHover('SKILL', skill, e.clientX, e.clientY)}
                  onMouseLeave={onClearHover}
                  className={`p-4 rounded-xl border transition-all text-left group ${selectedMage?.id === skill.id ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/50' : 'bg-slate-800/50 border-white/5 hover:border-blue-500/50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-blue-300 group-hover:text-blue-200">{skill.name}</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">Mage</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{skill.effect}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Knight Skills */}
          <div className="space-y-4">
            <h3 className="text-xl fantasy-font text-orange-400 border-b border-orange-500/30 pb-2">Knight Unique Skills</h3>
            <div className="grid grid-cols-1 gap-3">
              {knightChoices.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => setSelectedKnight(skill)}
                  onMouseEnter={(e) => onHover('SKILL', skill, e.clientX, e.clientY)}
                  onMouseLeave={onClearHover}
                  className={`p-4 rounded-xl border transition-all text-left group ${selectedKnight?.id === skill.id ? 'bg-orange-600/20 border-orange-500 ring-2 ring-orange-500/50' : 'bg-slate-800/50 border-white/5 hover:border-orange-500/50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-orange-300 group-hover:text-orange-200">{skill.name}</span>
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded uppercase tracking-wider">Knight</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{skill.effect}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            disabled={!selectedMage || !selectedKnight}
            onClick={handleConfirm}
            className={`px-12 py-4 rounded-xl fantasy-font text-2xl transition-all transform active:scale-95 shadow-xl ${(!selectedMage || !selectedKnight) ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'}`}
          >
            Confirm Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillDraftModal;
