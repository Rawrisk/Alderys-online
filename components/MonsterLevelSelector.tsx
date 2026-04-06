import React from 'react';

interface MonsterLevelSelectorProps {
  onSelect: (level: number) => void;
  onCancel: () => void;
  canFightLevel2: boolean;
  canFightLevel3: boolean;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

export const MonsterLevelSelector: React.FC<MonsterLevelSelectorProps> = ({
  onSelect,
  onCancel,
  canFightLevel2,
  canFightLevel3,
  onHover,
  onClearHover
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border-2 border-slate-600 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl fantasy-font text-red-500 mb-4 text-center">Select Monster Level</h2>
        <p className="text-slate-300 text-sm mb-6 text-center">
          Choose the difficulty of the monster you wish to fight.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => onSelect(1)}
            onMouseEnter={(e) => onHover('MONSTER', { level: 1 }, e.clientX, e.clientY)}
            onMouseLeave={onClearHover}
            className="w-full p-4 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-500 flex justify-between items-center transition-colors"
          >
            <span className="font-bold text-white">Level 1 Monster</span>
            <span className="text-xs text-slate-400">1 HP, 3 Dice</span>
          </button>

          <button
            onClick={() => onSelect(2)}
            onMouseEnter={(e) => onHover('MONSTER', { level: 2 }, e.clientX, e.clientY)}
            onMouseLeave={onClearHover}
            disabled={!canFightLevel2}
            className={`w-full p-4 rounded-lg border flex justify-between items-center transition-colors ${
              canFightLevel2 
                ? 'bg-slate-700 hover:bg-slate-600 border-slate-500 cursor-pointer' 
                : 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed'
            }`}
          >
            <span className="font-bold text-yellow-500">Level 2 Monster</span>
            <span className="text-xs text-slate-400">4 HP, 2 Def, 1 Reroll</span>
          </button>

          <button
            onClick={() => onSelect(3)}
            onMouseEnter={(e) => onHover('MONSTER', { level: 3 }, e.clientX, e.clientY)}
            onMouseLeave={onClearHover}
            disabled={!canFightLevel3}
            className={`w-full p-4 rounded-lg border flex justify-between items-center transition-colors ${
              canFightLevel3 
                ? 'bg-slate-700 hover:bg-slate-600 border-slate-500 cursor-pointer' 
                : 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed'
            }`}
          >
            <span className="font-bold text-red-400">Level 3 Monster</span>
            <span className="text-xs text-slate-400">7 HP, 5 Def, 2 Rerolls</span>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
