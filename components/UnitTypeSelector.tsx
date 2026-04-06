
import React from 'react';
import { Player } from '../types';
import { UNIT_STATS } from '../constants';

interface UnitTypeSelectorProps {
  player: Player;
  skillLevel: number;
  onSelect: (type: 'warrior' | 'mage' | 'knight') => void;
  onCancel: () => void;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const UnitTypeSelector: React.FC<UnitTypeSelectorProps> = ({ player, skillLevel, onSelect, onCancel, onHover, onClearHover }) => {
  const unitTypes: ('warrior' | 'mage' | 'knight')[] = ['warrior', 'mage', 'knight'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-yellow-500 fantasy-font text-xl mb-4 text-center">Select Unit Type</h3>
        <p className="text-slate-300 text-sm mb-6 text-center">
          Choose which unit type will receive this level {skillLevel} skill.
        </p>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          {unitTypes.map(type => {
            const level = player.unitLevels[type];
            const canReceive = level >= skillLevel;
            
            return (
              <button
                key={type}
                onClick={() => canReceive && onSelect(type)}
                onMouseEnter={(e) => onHover('UNIT', { type, level, stats: UNIT_STATS[type], skills: player.unitTypeSkills[type], faction: player.faction }, e.clientX, e.clientY)}
                onMouseLeave={onClearHover}
                disabled={!canReceive}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  canReceive 
                    ? 'bg-slate-800 hover:bg-slate-700 border-white/10 hover:border-yellow-500/50' 
                    : 'bg-slate-900/50 border-white/5 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center border border-white/10">
                    <span className="text-xl uppercase font-bold text-white">{type[0]}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white capitalize">{type}</div>
                    <div className="text-[10px] text-slate-400">Current Level: {level}</div>
                  </div>
                </div>
                {!canReceive && (
                  <span className="text-[10px] text-red-400 font-bold uppercase">Requires Lvl {skillLevel}</span>
                )}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={onCancel}
          className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default UnitTypeSelector;
