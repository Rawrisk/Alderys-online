
import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Zap, Shield, X, Play, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, User, Plus, Trash2, Calculator } from 'lucide-react';
import Dice from './Dice';
import { DICE, UNIT_STATS, SKILLS, LEVEL_2_SKILLS, LEVEL_3_SKILLS, getDiceFromSkill } from '../constants';
import { Skill } from '../types';

interface DiceTestModalProps {
  onClose: () => void;
}

const DiceTestModal: React.FC<DiceTestModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'DICE' | 'UNIT'>('DICE');
  const [diceType, setDiceType] = useState<'MELEE' | 'MANA' | 'DEFENSE'>('MELEE');
  const [rollResult, setRollResult] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<{ type: string, value: number }[]>([]);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // Unit Simulation State
  const [unitType, setUnitType] = useState<'warrior' | 'mage' | 'knight'>('warrior');
  const [faction, setFaction] = useState<string>('human');
  const [selectedSkills, setSelectedSkills] = useState<(string | null)[]>([]);
  const [simRolls, setSimRolls] = useState<{ type: string, value: number, purpose: string, isRolling?: boolean, hasResolved?: boolean, isRanged?: boolean }[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [enemyDefense, setEnemyDefense] = useState(0);
  const [activeSkillSlot, setActiveSkillSlot] = useState<number | null>(null);

  const allSkills = useMemo(() => {
    const skills: { [key: string]: Skill } = { ...SKILLS };
    LEVEL_2_SKILLS.forEach(s => { skills[s.id] = s; });
    LEVEL_3_SKILLS.forEach(s => { skills[s.id] = s; });
    return skills;
  }, []);

  const unitSlots = useMemo(() => UNIT_STATS[unitType].slots, [unitType]);

  // Initialize skills when unit type or faction changes
  React.useEffect(() => {
    const initial = [...UNIT_STATS[unitType].initialSkills];
    const slots = new Array(unitSlots).fill(null);
    
    // Add faction unique skill if applicable
    if (faction !== 'human') {
      if (unitType === 'mage') {
        const uniqueId = `${faction.toUpperCase()}_MAGE_UNIQUE`;
        if (allSkills[uniqueId]) initial.unshift(uniqueId);
      } else if (unitType === 'knight') {
        const uniqueId = `${faction.toUpperCase()}_KNIGHT_UNIQUE`;
        if (allSkills[uniqueId]) initial.unshift(uniqueId);
      }
    }

    initial.forEach((s, i) => { if (i < unitSlots) slots[i] = s; });
    setSelectedSkills(slots);
    setSimRolls([]);
  }, [unitType, unitSlots, faction, allSkills]);

  const rollDice = (type: string) => {
    let diceType = type;
    if (type === 'MELEE' && selectedSkills.includes('ORC_KNIGHT_UNIQUE')) {
      diceType = 'ORC_MELEE';
    }
    if (type === 'DEFENSE' && selectedSkills.includes('FLYING_KNIGHT_UNIQUE')) {
      diceType = 'FLYING_DEFENSE';
    }
    const faces = DICE[diceType as keyof typeof DICE] || DICE.MELEE;
    let val = faces[Math.floor(Math.random() * faces.length)];
    
    if (type === 'MANA' && val === 0 && selectedSkills.includes('ELF_MAGE_UNIQUE')) {
      val = -2; // Elf Mage explosion on 0
    }
    
    return val;
  };

  const simulateCombat = useCallback(() => {
    if (isSimulating) return;
    setIsSimulating(true);
    
    const diceToRoll: { type: string, purpose: string, isRanged: boolean }[] = [];

    selectedSkills.forEach(skillId => {
      if (!skillId) return;
      const skill = allSkills[skillId];
      if (skill) {
        // Test both ranged and melee phases
        const meleeDice = getDiceFromSkill(skill, false);
        const rangedDice = getDiceFromSkill(skill, true);
        
        meleeDice.forEach(d => {
          for (let i = 0; i < d.count; i++) {
            diceToRoll.push({ type: d.type, purpose: d.purpose, isRanged: false });
          }
        });
        rangedDice.forEach(d => {
          for (let i = 0; i < d.count; i++) {
            diceToRoll.push({ type: d.type, purpose: d.purpose, isRanged: true });
          }
        });
      }
    });

    // Set initial rolling state
    const initialRolls = diceToRoll.map(d => ({
      ...d,
      value: 0,
      isRolling: true
    }));
    setSimRolls(initialRolls);

    // Simulate rolling delay and set final values
    setTimeout(() => {
      setSimRolls(prev => prev.map(d => ({
        ...d,
        value: rollDice(d.type)
      })));
      
      // Clear rolling state after animation completes
      setTimeout(() => {
        setSimRolls(prev => prev.map(d => ({ ...d, isRolling: false })));
        setIsSimulating(false);
      }, 1800);
    }, 100);
  }, [selectedSkills, allSkills, isSimulating]);

  const resolveExplosion = useCallback((index: number) => {
    const roll = simRolls[index];
    const isExplosion = roll.value === -1 || roll.value === -2;
    if (!isExplosion || roll.isRolling || roll.hasResolved) return;

    // Mark as resolved
    setSimRolls(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], hasResolved: true };
      
      // Add the new die
      const newDie = {
        type: roll.type,
        purpose: roll.purpose,
        isRanged: roll.isRanged,
        value: 0,
        isRolling: true
      };
      
      return [...updated, newDie];
    });

    // Simulate rolling for the new die
    setTimeout(() => {
      setSimRolls(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          value: rollDice(roll.type)
        };
        return updated;
      });

      setTimeout(() => {
        setSimRolls(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { ...updated[lastIndex], isRolling: false };
          return updated;
        });
      }, 1800);
    }, 100);
  }, [simRolls]);

  const totals = useMemo(() => {
    const hasDwarfKnightSkill = selectedSkills.includes('DWARF_KNIGHT_UNIQUE');
    const hasFlyingMageSkill = selectedSkills.includes('FLYING_MAGE_UNIQUE');

    const getVal = (r: any) => {
      if (r.value === -1 || r.value === -2) return 1;
      return Math.max(0, r.value);
    };

    const damage = simRolls.filter(r => r.purpose === 'DAMAGE').reduce((sum, r) => sum + getVal(r), 0);
    
    // Dwarf Knight Counter Logic
    const dwarfDefense = hasDwarfKnightSkill ? simRolls.filter(r => r.purpose === 'DEFENSE').reduce((sum, r) => sum + getVal(r), 0) : 0;
    const bonusDamage = Math.floor(dwarfDefense / 2);

    const rangedDamage = simRolls.filter(r => r.purpose === 'DAMAGE' && (r.isRanged || hasFlyingMageSkill)).reduce((sum, r) => sum + getVal(r), 0);
    const defense = simRolls.filter(r => r.purpose === 'DEFENSE').reduce((sum, r) => sum + Math.max(0, r.value), 0);
    
    return { damage: damage + bonusDamage, rangedDamage, defense };
  }, [simRolls, selectedSkills]);

  const roll = useCallback(() => {
    if (isRolling) return;
    
    setIsRolling(true);
    setRotation({ x: 0, y: 0 }); // Reset rotation on roll
    const faces = DICE[diceType];
    const result = faces[Math.floor(Math.random() * faces.length)];
    
    // Delay setting the result to sync with animation
    setTimeout(() => {
      setRollResult(result);
      setHistory(prev => [{ type: diceType, value: result }, ...prev].slice(0, 10));
      setIsRolling(false);
    }, 1800); // Animation duration (1.2 + 0.3 + buffer)
  }, [diceType, isRolling]);

  const rotate = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (isRolling) return;
    setRotation(prev => {
      switch (dir) {
        case 'up': return { ...prev, x: prev.x - 90 };
        case 'down': return { ...prev, x: prev.x + 90 };
        case 'left': return { ...prev, y: prev.y - 90 };
        case 'right': return { ...prev, y: prev.y + 90 };
        default: return prev;
      }
    });
  };

  const resetRotation = () => setRotation({ x: 0, y: 0 });

  const getDiceLabel = (type: string) => {
    switch (type) {
      case 'MELEE': return 'Melee Dice';
      case 'MANA': return 'Mana Dice';
      case 'DEFENSE': return 'Defense Dice';
      default: return type;
    }
  };

  const getDiceDescription = (type: string) => {
    const faces = DICE[type as keyof typeof DICE];
    return `Faces: [${faces.join(', ')}]`;
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(234,179,8,0.1)] relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/5 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-6">
            <h2 className="fantasy-font text-3xl text-yellow-500 flex items-center gap-3">
              <RefreshCw className={isRolling || isSimulating ? 'animate-spin' : ''} />
              Testing Chamber
            </h2>
            <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/5">
              <button 
                onClick={() => setActiveTab('DICE')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'DICE' ? 'bg-yellow-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Dice Inspector
              </button>
              <button 
                onClick={() => setActiveTab('UNIT')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'UNIT' ? 'bg-yellow-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Unit Simulator
              </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors border border-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {activeTab === 'DICE' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Side: Controls */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Select Dice Type</h3>
                <div className="grid grid-cols-1 gap-3">
                  {(['MELEE', 'MANA', 'DEFENSE'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDiceType(type)}
                      className={`
                        flex items-center justify-between p-4 rounded-xl border transition-all
                        ${diceType === type 
                          ? 'bg-slate-800 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                          : 'bg-slate-800/40 border-white/5 hover:border-white/20 text-slate-400'
                        }
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          type === 'MELEE' ? 'bg-red-900/30 text-red-400' : 
                          type === 'MANA' ? 'bg-blue-900/30 text-blue-400' : 
                          'bg-slate-700/30 text-slate-400'
                        }`}>
                          {type === 'MELEE' ? <Sword size={20} /> : type === 'MANA' ? <Zap size={20} /> : <Shield size={20} />}
                        </div>
                        <div className="text-left">
                          <div className={`font-bold ${diceType === type ? 'text-white' : 'text-slate-300'}`}>{getDiceLabel(type)}</div>
                          <div className="text-[10px] opacity-50">{getDiceDescription(type)}</div>
                        </div>
                      </div>
                      {diceType === type && <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={roll}
                disabled={isRolling}
                className={`
                  w-full py-4 rounded-xl font-bold fantasy-font text-xl transition-all flex items-center justify-center gap-3 shadow-xl
                  ${isRolling 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-yellow-600 hover:bg-yellow-500 text-white transform active:scale-95'
                  }
                `}
              >
                <Play size={20} fill="currentColor" />
                {isRolling ? 'Rolling...' : 'Roll Dice'}
              </button>
            </div>

            {/* Right Side: Result & Animation */}
            <div className="flex flex-col items-center justify-center bg-slate-800/30 rounded-2xl border border-white/5 p-8 min-h-[300px] relative">
              <div className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-slate-600 font-bold">Result Area</div>
              
              <div className="relative mb-8">
                <Dice 
                  type={diceType} 
                  value={rollResult} 
                  isRolling={isRolling} 
                  size="lg" 
                  manualRotation={rotation}
                />
                
                <AnimatePresence>
                  {!isRolling && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center"
                    >
                      <div className="text-4xl font-black fantasy-font text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                        {rollResult === -1 ? 'EXPLOSION!' : rollResult === 0 ? 'MISS' : rollResult}
                      </div>
                      <div className="text-[10px] uppercase tracking-tighter text-slate-500 mt-1">Last Result</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Manual Rotation Controls */}
              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-2">Inspect Cube</div>
                <div className="grid grid-cols-3 gap-1">
                  <div />
                  <button 
                    onClick={() => rotate('up')}
                    disabled={isRolling}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-white/5 disabled:opacity-50"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <div />
                  
                  <button 
                    onClick={() => rotate('left')}
                    disabled={isRolling}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-white/5 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={resetRotation}
                    disabled={isRolling}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-white/5 disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button 
                    onClick={() => rotate('right')}
                    disabled={isRolling}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-white/5 disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                  
                  <div />
                  <button 
                    onClick={() => rotate('down')}
                    disabled={isRolling}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-white/5 disabled:opacity-50"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <div />
                </div>
              </div>

              {/* History */}
              <div className="mt-16 w-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Recent Rolls</span>
                  <button onClick={() => setHistory([])} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {history.length === 0 ? (
                    <div className="text-[10px] text-slate-700 italic py-4">No history yet</div>
                  ) : (
                    history.map((h, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i} 
                        className={`
                          w-8 h-8 rounded-lg border flex items-center justify-center text-[10px] font-bold
                          ${h.type === 'MELEE' ? 'bg-red-900/20 border-red-500/30 text-red-400' : 
                            h.type === 'MANA' ? 'bg-blue-900/20 border-blue-500/30 text-blue-400' : 
                            'bg-slate-800 border-white/10 text-slate-400'}
                        `}
                      >
                        {h.value === -1 ? '!' : h.value}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Side: Unit & Skill Configuration */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold">1. Select Faction & Unit</h3>
                <div className="grid grid-cols-6 gap-1 mb-2">
                  {['human', 'elf', 'orc', 'dwarf', 'ooze', 'flying'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFaction(f)}
                      className={`
                        p-1.5 rounded-lg border transition-all flex flex-col items-center gap-1
                        ${faction === f 
                          ? 'bg-slate-800 border-yellow-500/50 text-white shadow-[0_0_10px_rgba(234,179,8,0.2)]' 
                          : 'bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/20'
                        }
                      `}
                    >
                      <span className="text-[8px] font-bold uppercase">{f}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['warrior', 'mage', 'knight'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setUnitType(type);
                      }}
                      className={`
                        p-3 rounded-xl border transition-all flex flex-col items-center gap-2
                        ${unitType === type 
                          ? 'bg-slate-800 border-yellow-500/50 text-white' 
                          : 'bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/20'
                        }
                      `}
                    >
                      <User size={20} className={unitType === type ? 'text-yellow-500' : ''} />
                      <span className="text-[10px] font-bold uppercase">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold">2. Assign Skills</h3>
                  <span className="text-[10px] text-slate-500">Slots: {selectedSkills.filter(Boolean).length} / {unitSlots}</span>
                </div>
                
                <div className="space-y-2">
                  {selectedSkills.map((sid, i) => (
                    <div key={`slot-${i}`} className="relative group">
                      <div 
                        onClick={() => setActiveSkillSlot(activeSkillSlot === i ? null : i)}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer
                          ${sid 
                            ? 'bg-slate-800 border-yellow-500/20 hover:border-yellow-500/40' 
                            : 'bg-slate-800/40 border-dashed border-white/10 hover:border-white/20'
                          }
                          ${activeSkillSlot === i ? 'ring-2 ring-yellow-500/50 border-yellow-500/50' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${sid ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-700 text-slate-500'}`}>
                            {i + 1}
                          </div>
                          <div className="text-left">
                            {sid ? (
                              <>
                                <div className="text-xs font-bold text-white">{allSkills[sid]?.name}</div>
                                <div className="text-[8px] text-yellow-500/70 uppercase tracking-tighter">{allSkills[sid]?.effect}</div>
                              </>
                            ) : (
                              <div className="text-xs font-bold text-slate-600 italic">Empty Slot</div>
                            )}
                          </div>
                        </div>
                        {sid && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSkills = [...selectedSkills];
                              newSkills[i] = null;
                              setSelectedSkills(newSkills);
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Skill Selection Dropdown */}
                      <AnimatePresence>
                        {activeSkillSlot === i && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-yellow-500/30 rounded-lg shadow-2xl z-20 max-h-48 overflow-y-auto"
                          >
                            <div className="p-2 border-b border-white/5 text-[8px] uppercase tracking-widest text-slate-500 font-bold">Select Skill</div>
                            {Object.values(allSkills)
                              .filter(s => {
                                if (!s.isUnique) return true;
                                if (unitType === 'mage' && s.id.includes('MAGE')) return true;
                                if (unitType === 'knight' && s.id.includes('KNIGHT')) return true;
                                return false;
                              })
                              .map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => {
                                    const newSkills = [...selectedSkills];
                                    newSkills[i] = s.id;
                                    setSelectedSkills(newSkills);
                                    setActiveSkillSlot(null);
                                  }}
                                  className="w-full p-2 text-left text-[10px] hover:bg-slate-700 border-b border-white/5 last:border-0 transition-colors"
                                >
                                  <div className="font-bold text-slate-200">{s.name}</div>
                                  <div className="text-slate-500">{s.effect}</div>
                                </button>
                              ))
                            }
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={simulateCombat}
                disabled={isSimulating}
                className={`
                  w-full py-4 rounded-xl font-bold fantasy-font text-xl transition-all flex items-center justify-center gap-3 shadow-xl
                  ${isSimulating 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white transform active:scale-95'
                  }
                `}
              >
                <Calculator size={20} />
                {isSimulating ? 'Simulating...' : 'Simulate Combat'}
              </button>
            </div>

            {/* Right Side: Simulation Results */}
            <div className="flex flex-col bg-slate-800/30 rounded-2xl border border-white/5 p-6 min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Simulation Results</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Enemy Def:</span>
                  <input 
                    type="number" 
                    min="0"
                    value={enemyDefense}
                    onChange={(e) => setEnemyDefense(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-12 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
              </div>
              
              <div className="flex-1 space-y-8">
                {/* Totals */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-3 text-center">
                    <div className="text-[8px] uppercase text-red-400 font-bold mb-1">Raw Damage</div>
                    <div className="text-2xl font-black fantasy-font text-red-500">{totals.damage}</div>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-3 text-center">
                    <div className="text-[8px] uppercase text-blue-400 font-bold mb-1">Ranged Damage</div>
                    <div className="text-2xl font-black fantasy-font text-blue-500">{totals.rangedDamage}</div>
                  </div>
                  <div className="bg-orange-900/20 border border-orange-500/20 rounded-xl p-3 text-center">
                    <div className="text-[8px] uppercase text-orange-400 font-bold mb-1">Final Damage</div>
                    <div className="text-2xl font-black fantasy-font text-orange-500">{Math.max(0, totals.damage - enemyDefense)}</div>
                  </div>
                  <div className="bg-slate-700/20 border border-slate-500/20 rounded-xl p-3 text-center">
                    <div className="text-[8px] uppercase text-slate-400 font-bold mb-1">Total Defense</div>
                    <div className="text-2xl font-black fantasy-font text-slate-300">{totals.defense}</div>
                  </div>
                </div>

                {/* Dice Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Dice Breakdown</h4>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {simRolls.length === 0 ? (
                      <div className="text-xs text-slate-700 italic py-8">Roll the simulation to see results</div>
                    ) : (
                      simRolls.map((r, i) => (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          key={i}
                          className="relative group"
                        >
                          <Dice 
                            type={r.type as any} 
                            value={r.value} 
                            size="sm" 
                            isRolling={r.isRolling}
                            delay={i * 100}
                          />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-slate-900 rounded-full border border-white/10 flex items-center justify-center">
                            {r.purpose === 'DAMAGE' ? (
                              r.isRanged ? <Zap size={8} className="text-blue-400" /> : <Sword size={8} className="text-red-400" />
                            ) : (
                              <Shield size={8} className="text-slate-400" />
                            )}
                          </div>
                          {r.value === -1 && !r.isRolling && !r.hasResolved && (
                            <button 
                              onClick={() => resolveExplosion(i)}
                              className="absolute -top-2 -right-2 bg-yellow-500 text-slate-900 rounded-full p-1 shadow-lg hover:bg-yellow-400 transition-colors z-10 animate-bounce"
                              title="Resolve Explosion"
                            >
                              <RefreshCw size={10} />
                            </button>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="text-[10px] text-slate-500 leading-relaxed">
                  * Simulation includes both Ranged and Melee phases for the unit. 
                  Explosions count as 1 hit and allow for an additional roll. Click the icon on exploded dice to resolve them.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-500 italic">
            "The dice of Alderys are fickle. Melee dice favor the bold, Mana dice hold explosive potential, and Defense dice are your only shield against the dark."
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default DiceTestModal;
