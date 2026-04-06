
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { YEAR_EVENTS } from '../../constants';
import { Player, Skill } from '../../types';

interface EventModalProps {
  event: typeof YEAR_EVENTS[0];
  player: Player;
  pendingChoice: any;
  onChoice: (choice: any) => void;
  availableSkills?: { level2: Skill[], level3: Skill[] };
  hasValidTargets?: boolean;
}

const EventModal: React.FC<EventModalProps> = ({ event, player, pendingChoice, onChoice, availableSkills, hasValidTargets = true }) => {
  const [selectedRecruit, setSelectedRecruit] = useState<'warrior' | 'mage' | 'knight' | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [unitDamages, setUnitDamages] = useState<Record<string, number>>({});

  const handleRecruitChoice = () => {
    if (selectedRecruit) {
      onChoice({ type: 'FREE_RECRUIT', unitType: selectedRecruit });
    }
  };

  const handleSkillChoice = () => {
    if (selectedSkill) {
      onChoice({ type: 'FREE_SKILL', skill: selectedSkill });
    }
  };

  const handleDungeonAttackConfirm = () => {
    onChoice({ type: 'DUNGEON_ATTACK', unitDamages });
  };

  const renderChoiceContent = () => {
    if (pendingChoice.type === 'FREE_RECRUIT') {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-slate-300">Choose one recruitment option for free:</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedRecruit('warrior')}
              className={`p-4 rounded-xl border-2 transition-all ${selectedRecruit === 'warrior' ? 'bg-blue-600/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
            >
              <div className="text-2xl mb-1">⚔️⚔️</div>
              <div className="font-bold text-sm">2 Warriors</div>
              <div className="text-[10px] text-slate-400">Limit: 4</div>
            </button>
            <button
              onClick={() => setSelectedRecruit('mage')}
              className={`p-4 rounded-xl border-2 transition-all ${selectedRecruit === 'mage' ? 'bg-purple-600/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
            >
              <div className="text-2xl mb-1">🧙‍♂️</div>
              <div className="font-bold text-sm">1 Mage</div>
              <div className="text-[10px] text-slate-400">Limit: 3</div>
            </button>
            <button
              onClick={() => setSelectedRecruit('knight')}
              className={`p-4 rounded-xl border-2 transition-all ${selectedRecruit === 'knight' ? 'bg-yellow-600/40 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
            >
              <div className="text-2xl mb-1">🏇</div>
              <div className="font-bold text-sm">1 Knight</div>
              <div className="text-[10px] text-slate-400">Limit: 2</div>
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onChoice({ type: 'SKIP' })}
              className="w-1/3 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              Skip
            </button>
            <button
              disabled={!selectedRecruit}
              onClick={handleRecruitChoice}
              className="w-2/3 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {selectedRecruit && <span className="text-xl">🎯</span>}
              Select Hex on Board
            </button>
          </div>
        </div>
      );
    }

    if (pendingChoice.type === 'DUNGEON_ATTACK') {
      const monsterRolls = pendingChoice.monsterRolls || [];
      const totalAttack = monsterRolls.reduce((sum: number, r: any) => sum + r.value, 0);

      if (pendingChoice.selectedHex) {
        const { finalDamage, totalDamage, totalDefense } = pendingChoice;
        const assignedDamage = Object.values(unitDamages).reduce((sum, d) => sum + d, 0);
        const remainingToAssign = finalDamage - assignedDamage;

        // We need the units in that hex. We'll assume they are passed in props or we can filter them if we have all units.
        // For now, let's assume we need to pass them. I'll update the interface.
        const hexUnits = (pendingChoice.hexUnits || []).filter((u: any) => u.playerId === player.id);

        return (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-xs uppercase font-bold">Combat Results</span>
                <span className="text-red-400 font-black text-lg">{finalDamage} Damage</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between px-2 py-1 bg-red-900/20 rounded">
                  <span className="text-red-300">Attack:</span>
                  <span className="font-bold">{totalDamage}</span>
                </div>
                <div className="flex justify-between px-2 py-1 bg-blue-900/20 rounded">
                  <span className="text-blue-300">Defense:</span>
                  <span className="font-bold">{totalDefense}</span>
                </div>
              </div>
            </div>

            <p className="text-slate-300 text-sm">
              Distribute <span className="text-red-400 font-bold">{finalDamage}</span> damage among your units in the selected hex:
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {hexUnits.map((unit: any) => {
                const currentDamage = unitDamages[unit.id] || 0;
                const maxPossible = Math.min(unit.hp, remainingToAssign + currentDamage);
                
                return (
                  <div key={unit.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{unit.type === 'warrior' ? '⚔️' : unit.type === 'mage' ? '🧙‍♂️' : '🏇'}</div>
                      <div>
                        <div className="font-bold text-sm capitalize">{unit.type}</div>
                        <div className="text-[10px] text-slate-400">HP: {unit.hp - currentDamage} / {unit.hp}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setUnitDamages(prev => ({ ...prev, [unit.id]: Math.max(0, currentDamage - 1) }))}
                        className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-30"
                        disabled={currentDamage <= 0}
                      >
                        -
                      </button>
                      <span className={`w-8 text-center font-bold ${currentDamage > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {currentDamage}
                      </span>
                      <button 
                        onClick={() => setUnitDamages(prev => ({ ...prev, [unit.id]: Math.min(unit.hp, currentDamage + 1) }))}
                        className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-30"
                        disabled={remainingToAssign <= 0 || currentDamage >= unit.hp}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              disabled={remainingToAssign > 0}
              onClick={handleDungeonAttackConfirm}
              className="mt-2 w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              {remainingToAssign > 0 ? `Assign ${remainingToAssign} more damage` : 'Confirm Damage'}
            </button>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-4">
          <p className="text-slate-300">
            A level {pendingChoice.monsterLevel} monster is attacking! 
            Select one of your hexes adjacent to a dungeon entrance to receive the damage.
          </p>
          
          <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Monster Attack Roll</span>
              <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">LEVEL {pendingChoice.monsterLevel}</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {monsterRolls.map((roll: any, idx: number) => (
                <div key={idx} className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center border-2 ${roll.type === 'MELEE' ? 'bg-red-900/40 border-red-500/50' : 'bg-purple-900/40 border-purple-500/50'}`}>
                  <span className="text-xs opacity-50">{roll.type === 'MELEE' ? '⚔️' : '✨'}</span>
                  <span className="font-bold text-sm">{roll.value}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className="text-slate-400 text-xs">Total Attack: </span>
              <span className="text-red-400 font-black text-xl">{totalAttack}</span>
            </div>
          </div>

          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
            <p className="text-xs text-red-400 italic">
              "The ground trembles as the beast lunges from the shadows..."
            </p>
          </div>
          {!hasValidTargets ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-green-400 font-bold text-center">
                You have no units adjacent to a dungeon. You are safe!
              </p>
              <button
                onClick={() => onChoice({ type: 'SKIP' })}
                className="mt-2 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                Continue
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400">
                Click the button below to select a valid hex on the board. Your units will roll defense dice if they have any.
              </p>
              <button
                onClick={() => onChoice({ type: 'START_HEX_SELECTION' })}
                className="mt-2 w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span className="text-xl">🎯</span>
                Select Hex on Board
              </button>
            </>
          )}
        </div>
      );
    }

    if (pendingChoice.type === 'FREE_SKILL') {
      const skills = pendingChoice.level3Allowed ? [...(availableSkills?.level3 || []), ...(availableSkills?.level2 || [])] : (availableSkills?.level2 || []);
      
      if (skills.length === 0) {
        return (
          <div className="flex flex-col gap-4">
            <p className="text-slate-300">
              There are no skills available in the market to learn.
            </p>
            <button
              onClick={() => onChoice({ type: 'SKIP' })}
              className="mt-2 w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              Continue
            </button>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-4">
          <p className="text-slate-300">Choose one skill to acquire for free:</p>
          <div className="max-h-60 overflow-y-auto pr-2 flex flex-col gap-2">
            {skills.map(skill => (
              <button
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${selectedSkill?.id === skill.id ? 'bg-amber-600/40 border-amber-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">{skill.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${skill.level === 3 ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    Level {skill.level}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{skill.effect}</p>
              </button>
            ))}
          </div>
          <button
            disabled={!selectedSkill}
            onClick={handleSkillChoice}
            className="mt-2 w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            Confirm Skill
          </button>
        </div>
      );
    }

    if (pendingChoice.type === 'INFO') {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-slate-300">
            {event.description}
          </p>
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
            <p className="text-xs text-blue-400 italic">
              "The winds of fate have shifted..."
            </p>
          </div>
          <button
            onClick={() => onChoice({ type: 'CONTINUE' })}
            className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            Continue
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="relative p-6 border-b border-slate-800 bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📜</div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{event.title}</h2>
          <p className="text-amber-400 font-bold text-sm mt-1">{player.name} ({player.faction})'s Choice</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="relative">
            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-amber-500/50 rounded-full" />
            <p className="italic text-slate-400 pl-4 leading-relaxed">
              "{event.flavor}"
            </p>
          </div>

          {renderChoiceContent()}
        </div>

        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Year End Event</div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
            <div className="w-2 h-2 rounded-full bg-amber-500/20" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EventModal;
