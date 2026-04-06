
import React from 'react';
import { Shield } from 'lucide-react';
import { CombatState, Unit, Player } from '../types';
import { MONSTER_STATS, BOSS_STATS, MONSTER_LEVEL_2_STATS, MONSTER_LEVEL_3_STATS, FACTION_UNIT_IMAGES, UNIT_STATS, getDiceFromSkill } from '../constants';
import Dice from './Dice';

interface CombatModalProps {
  combatState: CombatState;
  players: Player[];
  onApplyDamage: (participant: 'attacker' | 'defender', unitId: string | 'monster' | 'monster2' | 'monster3') => void;
  onRerollDice: (participant: 'attacker' | 'defender', rollIndex: number) => void;
  onResolveExplosion: (participant: 'attacker' | 'defender', rollIndex: number) => void;
  onResolve: () => void;
  onNextRound: () => void;
  onFinishReroll: () => void;
  onClose: () => void;
  onToggleChannel: (unitId: string) => void;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const CombatModal: React.FC<CombatModalProps> = ({ combatState, players, onApplyDamage, onRerollDice, onResolveExplosion, onResolve, onNextRound, onFinishReroll, onClose, onToggleChannel, onHover, onClearHover }) => {
  const attacker = players.find(p => p.id === combatState.attackerId);
  const defender = (combatState.defenderId === 'monster' || combatState.defenderId === 'monster2' || combatState.defenderId === 'monster3') ? null : players.find(p => p.id === combatState.defenderId);
  const isBoss = combatState.defenderId === 'monster' && combatState.q === 0 && combatState.r === 0;
  const monsterIdx = combatState.monsterIndex || 0;
  const currentMonsterStats = isBoss ? BOSS_STATS[monsterIdx] : 
                             combatState.defenderId === 'monster3' ? MONSTER_LEVEL_3_STATS[monsterIdx] :
                             combatState.defenderId === 'monster2' ? MONSTER_LEVEL_2_STATS[monsterIdx] :
                             MONSTER_STATS[monsterIdx];

  const attackerDamageRemaining = combatState.defenderTotalDamage;
  const defenderDamageRemaining = combatState.attackerTotalDamage;

  const hasRangedSkills = (units: Unit[], player: Player | null) => {
    if (!player) return false;
    return units.some(u => {
      const skills = player.unitTypeSkills[u.type] || [];
      return skills.some(s => s && (s.id === 'RANGED_S' || s.id === 'RANGED_M' || s.id === 'RANGED_M2' || s.id === 'RANGED_S3'));
    });
  };

  const attackerHasFlyingMage = combatState.attackerUnits.some(u => {
    const owner = players.find(p => p.id === u.playerId);
    return owner?.unitTypeSkills.mage.some(s => s?.id === 'FLYING_MAGE_UNIQUE');
  });
  const defenderHasFlyingMage = combatState.defenderUnits.some(u => {
    const owner = players.find(p => p.id === u.playerId);
    return owner?.unitTypeSkills.mage.some(s => s?.id === 'FLYING_MAGE_UNIQUE');
  });

  const hasAnyRanged = attackerHasFlyingMage || defenderHasFlyingMage || combatState.attackerUnits.some(u => {
    const owner = players.find(p => p.id === u.playerId);
    const skills = owner?.unitTypeSkills[u.type] || [];
    return skills.some(s => s && getDiceFromSkill(s, true).length > 0);
  }) || combatState.defenderUnits.some(u => {
    const owner = players.find(p => p.id === u.playerId);
    const skills = owner?.unitTypeSkills[u.type] || [];
    return skills.some(s => s && getDiceFromSkill(s, true).length > 0);
  }) || (combatState.defenderId === 'monster' && Array.isArray(currentMonsterStats?.dice) && currentMonsterStats.dice.some((d: string) => d === 'RANGED')) ||
     ((combatState.defenderId === 'monster2' || combatState.defenderId === 'monster3') && (currentMonsterStats?.attackOptions?.[combatState.monsterAttackIndex || 0]?.RANGED_MANA > 0 || false));

  const attackerUnitsWithHp = combatState.attackerUnits.filter(u => u.hp > 0);
  const defenderUnitsWithHp = (combatState.defenderId === 'monster' || combatState.defenderId === 'monster2' || combatState.defenderId === 'monster3')
    ? ((combatState.monsterHp ?? 0) > 0 ? [{ id: combatState.defenderId }] : [])
    : combatState.defenderUnits.filter(u => u.hp > 0);

  const canAttackerTakeDamage = attackerUnitsWithHp.length > 0;
  const canDefenderTakeDamage = defenderUnitsWithHp.length > 0;

  const isCombatFinished = combatState.isResolved && 
    (combatState.attackerTotalDamage === 0 || !canDefenderTakeDamage) && 
    (combatState.defenderTotalDamage === 0 || !canAttackerTakeDamage);

  const getDicePool = (unit: Unit, player: Player | null, participant: 'attacker' | 'defender') => {
    if (!player) return [];
    const skills = [...(player.unitTypeSkills[unit.type] || [])];
    const pool: { type: string, purpose: string, isRanged: boolean }[] = [];

    const units = participant === 'attacker' ? combatState.attackerUnits : combatState.defenderUnits;
    const hasFlyingMageSkill = units.some(u => {
      const owner = players.find(p => p.id === u.playerId);
      return u.type === 'mage' && owner?.unitTypeSkills.mage.some(s => s?.id === 'FLYING_MAGE_UNIQUE');
    });

    // Orc Mage Skill Sharing
    const orcMage = units.find(u => {
      const owner = players.find(p => p.id === u.playerId);
      return u.type === 'mage' && (owner?.faction === 'orc' || owner?.unitTypeSkills.mage.some(s => s?.id === 'ORC_MAGE_UNIQUE'));
    });
    const orcMageOwner = orcMage ? players.find(p => p.id === orcMage.playerId) : null;
    const sharedSkill = orcMageOwner?.unitTypeSkills.mage.some(s => s?.id === 'ORC_MAGE_UNIQUE') ? orcMageOwner.unitTypeSkills.mage[1] : null;
    
    if (sharedSkill && unit.type !== 'mage') {
      skills.push(sharedSkill);
    }

    // Orc Knight Melee Enhancement
    const hasOrcKnightSkill = units.some(u => {
      const owner = players.find(p => p.id === u.playerId);
      return u.type === 'knight' && owner?.unitTypeSkills.knight.some(s => s?.id === 'ORC_KNIGHT_UNIQUE');
    });

    // Skill dice (initial skills are included in player.unitTypeSkills)
    skills.forEach(skill => {
        if (!skill) return;
        
        const rangedDice = getDiceFromSkill(skill, true);
        const meleeDice = getDiceFromSkill(skill, false);

        // Handle Ranged Phase
        let activeRanged = [...rangedDice];
        if (hasFlyingMageSkill) {
          const damageMelee = meleeDice.filter(d => d.purpose === 'DAMAGE');
          activeRanged = [...activeRanged, ...damageMelee];
        }

        activeRanged.forEach(d => {
            let diceType = d.type;
            if (hasOrcKnightSkill && diceType === 'MELEE') {
              diceType = 'ORC_MELEE';
            }
            for (let i = 0; i < d.count; i++) pool.push({ type: diceType, purpose: d.purpose, isRanged: true });
        });

        // Handle Melee Phase
        let activeMelee = [...meleeDice];
        if (hasFlyingMageSkill) {
          activeMelee = activeMelee.filter(d => d.purpose !== 'DAMAGE');
        }

        activeMelee.forEach(d => {
            let diceType = d.type;
            if (hasOrcKnightSkill && diceType === 'MELEE') {
              diceType = 'ORC_MELEE';
            }
            for (let i = 0; i < d.count; i++) pool.push({ type: diceType, purpose: d.purpose, isRanged: false });
        });
    });
    return pool;
  };

  const renderUnitCard = (u: Unit, player: Player | null, participant: 'attacker' | 'defender') => {
    if (!player) return null;
    const unitImage = FACTION_UNIT_IMAGES[player.faction]?.[u.type];
    const isDead = u.hp <= 0;
    const canTakeDamage = (participant === 'attacker' ? combatState.defenderTotalDamage : combatState.attackerTotalDamage) > 0 && !isDead;

    return (
      <div 
        key={u.id} 
        onMouseEnter={(e) => onHover('UNIT', { ...u, faction: player.faction, skills: player.unitTypeSkills[u.type] }, e.clientX, e.clientY)}
        onMouseLeave={onClearHover}
        className={`relative flex flex-col p-2 bg-black/40 rounded-lg border transition-all
          ${isDead ? 'opacity-40 grayscale border-red-900/50' : 'border-white/10 shadow-lg'}
          ${canTakeDamage ? 'ring-1 ring-red-500/30' : ''}
        `}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-slate-700 flex-shrink-0">
            {unitImage ? (
              <img 
                src={unitImage} 
                alt={u.type} 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-lg">
                {u.type[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold capitalize text-xs truncate">{u.type}</span>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden w-12">
                <div 
                  className="h-full bg-green-500 transition-all" 
                  style={{ width: `${(u.hp / u.maxHp) * 100}%` }}
                />
              </div>
              <span className="text-[8px] text-slate-400 whitespace-nowrap">{u.hp}/{u.maxHp}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {u.type === 'mage' && (player.unitTypeSkills.mage.some(s => s?.id === 'DWARF_MAGE_UNIQUE')) && combatState.phase === 'INIT' && (
            <button 
              onClick={() => onToggleChannel(u.id)}
              className={`w-full py-1 text-[8px] rounded border transition-all 
                ${combatState.channellingUnitIds?.includes(u.id) ? 'bg-blue-600 border-blue-400 text-white' : 
                  'bg-slate-700 border-white/20 text-slate-300 hover:bg-slate-600'}`}
            >
              {combatState.channellingUnitIds?.includes(u.id) ? 'Channeling...' : 'Channel Mana'}
            </button>
          )}
          {canTakeDamage && (
            <button 
              onClick={() => onApplyDamage(participant, u.id)}
              className="w-full py-1 bg-red-900/50 hover:bg-red-800 text-red-200 text-[8px] rounded border border-red-500/30 font-bold uppercase tracking-wider"
            >
              Take Damage
            </button>
          )}
        </div>

        <div className="mt-1">
          {renderDicePool(getDicePool(u, player, participant))}
          {combatState.phase !== 'INIT' && renderUnitRolls(u.id, participant === 'attacker' ? combatState.attackerRolls : combatState.defenderRolls, participant)}
        </div>
      </div>
    );
  };

  const renderDicePool = (pool: { type: string, purpose: string, isRanged: boolean }[]) => {
    if (pool.length === 0) return null;
    
    const isRangedPhase = (combatState.phase === 'INIT' && hasAnyRanged) || 
                         combatState.phase === 'RANGED_REROLL' || 
                         combatState.phase === 'RANGED_APPLY';
    const isMeleePhase = combatState.phase === 'MELEE_REROLL' || 
                        combatState.phase === 'MELEE_APPLY';

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {pool.map((d, i) => {
          const isManaDefense = d.type === 'MANA' && d.purpose === 'DEFENSE';
          const isActive = (d.isRanged && isRangedPhase) || (!d.isRanged && isMeleePhase) || combatState.phase === 'INIT';
          
          return (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-sm border transition-all duration-300
                ${isManaDefense ? 'bg-blue-500 border-slate-400 ring-1 ring-slate-400' : d.type === 'DEFENSE' ? 'bg-slate-500 border-white/20' : d.type === 'MANA' ? 'bg-blue-500 border-white/20' : 'bg-red-600 border-white/20'}
                ${isActive ? 'opacity-100 scale-100' : 'opacity-30 scale-90'}
                ${d.isRanged ? 'ring-1 ring-blue-400' : ''}
              `} 
              title={`${d.isRanged ? 'Ranged' : 'Melee'} ${d.type} (${d.purpose})`}
            />
          );
        })}
      </div>
    );
  };

  const renderUnitRolls = (unitId: string | 'monster' | 'monster2' | 'monster3', rolls: any[], participant: 'attacker' | 'defender') => {
    const unitRollsWithIndices = rolls.map((r, i) => ({ ...r, originalIndex: i })).filter(r => r.unitId === unitId);
    if (unitRollsWithIndices.length === 0) return null;
    
    const rerollsAvailable = participant === 'attacker' ? combatState.attackerRerolls : combatState.defenderRerolls;
    const isMonster = participant === 'defender' && (combatState.defenderId === 'monster' || combatState.defenderId === 'monster2' || combatState.defenderId === 'monster3');

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {unitRollsWithIndices.map((r, i) => {
            const isExplosion = r.value === -1 || r.value === -2;
            const isManaDefense = r.type === 'MANA' && r.purpose === 'DEFENSE';
            const isDefense = r.purpose === 'DEFENSE';
            const canReroll = !isMonster && !isExplosion && rerollsAvailable > 0 && (combatState.phase === 'RANGED_REROLL' || combatState.phase === 'MELEE_REROLL');
            const canResolveExplosion = isExplosion && (combatState.phase === 'RANGED_APPLY' || combatState.phase === 'MELEE_APPLY' || combatState.phase === 'RANGED_REROLL' || combatState.phase === 'MELEE_REROLL');
            
            return (
              <button 
                key={i} 
                disabled={!canReroll && !canResolveExplosion}
                onClick={() => {
                  if (canResolveExplosion) onResolveExplosion(participant, r.originalIndex);
                  else if (canReroll) onRerollDice(participant, r.originalIndex);
                }}
                className={`w-8 h-8 rounded flex items-center justify-center transition-all relative
                  ${(canReroll || canResolveExplosion) ? 'hover:scale-110 hover:ring-2 ring-yellow-400 cursor-pointer' : 'cursor-default'}
                  ${r.isRerolled ? 'ring-1 ring-white/50' : ''}
                  ${isExplosion ? 'animate-pulse ring-2 ring-blue-400' : ''}
                `}
                title={canResolveExplosion ? 'Explosion! Click to roll bonus die' : canReroll ? 'Click to reroll' : ''}
              >
                <Dice 
                  type={r.type as any} 
                  value={r.value} 
                  size="sm" 
                  isRolling={r.isRolling || combatState.isRolling}
                  delay={i * 100}
                />
                {canResolveExplosion && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded pointer-events-none">
                    <div className="bg-blue-600 text-white rounded-full p-0.5 shadow-lg animate-bounce">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    </div>
                  </div>
                )}
                {r.isRerolled && <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-slate-900 z-20" />}
              </button>
            );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-yellow-500/50 rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 bg-slate-800 border-b border-white/10 flex justify-between items-center">
          <h2 className="fantasy-font text-2xl text-yellow-500">Combat at {combatState.q}, {combatState.r}</h2>
          {combatState.phase === 'INIT' && (
            <button 
              onClick={onResolve}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold fantasy-font text-xl transition-all animate-pulse"
            >
              {hasAnyRanged ? 'Roll Ranged Dice!' : 'Roll Dice!'}
            </button>
          )}
          {(combatState.phase === 'RANGED_REROLL' || combatState.phase === 'MELEE_REROLL') && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-yellow-500 uppercase font-bold animate-pulse">Reroll Phase</span>
              <button 
                onClick={onFinishReroll}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold fantasy-font text-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                Apply Rolls
              </button>
            </div>
          )}
          {combatState.phase === 'RANGED_APPLY' && (combatState.attackerTotalDamage === 0 || !canDefenderTakeDamage) && (combatState.defenderTotalDamage === 0 || !canAttackerTakeDamage) && (
            <button 
              onClick={onResolve}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold fantasy-font text-xl transition-all animate-pulse"
            >
              Roll Normal Dice!
            </button>
          )}
          {combatState.phase === 'MELEE_APPLY' && !combatState.isResolved && (combatState.attackerTotalDamage === 0 || !canDefenderTakeDamage) && (combatState.defenderTotalDamage === 0 || !canAttackerTakeDamage) && (
            <button 
              onClick={onNextRound}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold fantasy-font text-xl transition-all animate-pulse"
            >
              Next Round!
            </button>
          )}
          {isCombatFinished && (
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold fantasy-font text-xl transition-all"
            >
              Finish Combat
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Attacker Side */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center font-bold text-white">A</div>
              <h3 className="text-xl font-bold" style={{ color: attacker?.color }}>{attacker?.name} (Attacker)</h3>
              <div className="flex items-center gap-1 bg-yellow-900/30 px-2 py-0.5 rounded border border-yellow-500/20">
                <span className="text-[10px] text-yellow-500 font-bold uppercase">Rerolls:</span>
                <span className="text-sm text-yellow-400 font-bold">{combatState.attackerRerolls}</span>
              </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
              <h4 className="text-xs uppercase text-slate-500 mb-3 tracking-widest">Formation</h4>
              <div className="grid grid-cols-2 gap-3">
                {combatState.attackerUnits && combatState.attackerUnits.map(u => renderUnitCard(u, attacker || null, 'attacker'))}
              </div>
            </div>

            {combatState.phase !== 'INIT' && (
              <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs uppercase text-slate-500 mb-2 tracking-widest">Rolls</h4>
                <div className="flex flex-wrap gap-2">
                  {combatState.attackerRolls && combatState.attackerRolls.map((r, i) => {
                    const isExplosion = r.value === -1 || r.value === -2;
                    const canResolveExplosion = isExplosion && (combatState.phase === 'RANGED_APPLY' || combatState.phase === 'MELEE_APPLY' || combatState.phase === 'RANGED_REROLL' || combatState.phase === 'MELEE_REROLL');
                    return (
                      <div key={i} className="w-10 h-10 flex items-center justify-center relative">
                        <Dice 
                          type={r.type as any} 
                          value={r.value} 
                          size="sm" 
                          isRolling={r.isRolling || combatState.isRolling}
                          delay={i * 100}
                        />
                        {canResolveExplosion && (
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded pointer-events-none">
                            <div className="bg-blue-600 text-white rounded-full p-0.5 shadow-lg animate-bounce">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    Total Defense: 
                    <div className="relative flex items-center justify-center w-6 h-6">
                      <Shield className="w-6 h-6 text-blue-400/20 fill-blue-400/10 absolute" />
                      <span className="text-blue-400 font-bold relative z-10">{combatState.attackerTotalDefense}</span>
                    </div>
                  </span>
                  <span className="text-slate-400">Damage Taken: <span className="text-red-500 font-bold">{combatState.defenderTotalDamage}</span></span>
                </div>
              </div>
            )}
          </div>

          {/* Defender Side */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold text-white">D</div>
              <h3 className="text-xl font-bold" style={{ color: defender?.color || '#94a3b8' }}>
                {combatState.defenderId === 'monster' || combatState.defenderId === 'monster2' || combatState.defenderId === 'monster3' ? 
                 currentMonsterStats?.name : 
                 defender?.name} (Defender)
              </h3>
              <div className="flex items-center gap-1 bg-yellow-900/30 px-2 py-0.5 rounded border border-yellow-500/20">
                <span className="text-[10px] text-yellow-500 font-bold uppercase">Rerolls:</span>
                <span className="text-sm text-yellow-400 font-bold">{combatState.defenderRerolls}</span>
              </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
              <h4 className="text-xs uppercase text-slate-500 mb-3 tracking-widest">Formation</h4>
              <div className="grid grid-cols-2 gap-3">
                {combatState.defenderId === 'monster' || combatState.defenderId === 'monster2' || combatState.defenderId === 'monster3' ? (
                  <div 
                    onMouseEnter={(e) => onHover('MONSTER', { level: combatState.defenderId === 'monster3' ? 3 : combatState.defenderId === 'monster2' ? 2 : 1, isBoss }, e.clientX, e.clientY)}
                    onMouseLeave={onClearHover}
                    className="col-span-2 flex flex-col p-4 bg-black/40 rounded-xl border border-red-500/20 shadow-xl"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-20 h-20 rounded-lg border border-red-500/30 overflow-hidden bg-slate-800 flex-shrink-0 flex items-center justify-center">
                        {currentMonsterStats?.image ? (
                          <img 
                            src={currentMonsterStats.image} 
                            alt={currentMonsterStats.name} 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-4xl">👹</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-red-400">{currentMonsterStats?.name}</h4>
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span>Health</span>
                            <span>{combatState.monsterHp}/{currentMonsterStats?.hp}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500 transition-all" 
                              style={{ width: `${((combatState.monsterHp ?? 0) / (currentMonsterStats?.hp ?? 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest">Abilities & Rolls</div>
                        {(combatState.phase === 'RANGED_APPLY' || combatState.phase === 'MELEE_APPLY') && combatState.attackerTotalDamage > 0 && (combatState.monsterHp ?? 0) > 0 && (
                          <button 
                            onClick={() => onApplyDamage('defender', String(combatState.defenderId))}
                            className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-200 text-[10px] rounded border border-red-500/30 font-bold"
                          >
                            Apply Damage
                          </button>
                        )}
                      </div>
                      
                      <div className="flex gap-1 mt-2">
                        {isBoss ? (
                          <>
                            {[...Array(currentMonsterStats.dice.MELEE)].map((_, i) => <div key={`melee-${i}`} className="w-3 h-3 rounded-sm border border-white/20 bg-red-600" />)}
                            {[...Array(currentMonsterStats.dice.MANA)].map((_, i) => <div key={`mana-${i}`} className="w-3 h-3 rounded-sm border border-white/20 bg-blue-500" />)}
                            {[...Array(currentMonsterStats.dice.DEFENSE)].map((_, i) => <div key={`def-${i}`} className="w-3 h-3 rounded-sm border border-white/20 bg-slate-500" />)}
                            {[...Array(currentMonsterStats.dice.DEFENSE_MANA)].map((_, i) => <div key={`defmana-${i}`} className="w-3 h-3 rounded-sm border border-slate-400 bg-blue-500 ring-1 ring-slate-400" />)}
                          </>
                        ) : combatState.defenderId === 'monster3' ? (
                          <>
                            {[...Array(currentMonsterStats.defenseDice)].map((_, i) => <div key={`def-${i}`} className="w-3 h-3 rounded-sm border border-white/20 bg-slate-500" />)}
                            {[...Array(currentMonsterStats.manaDefenseDice)].map((_, i) => <div key={`defmana-${i}`} className="w-3 h-3 rounded-sm border border-slate-400 bg-blue-500 ring-1 ring-slate-400" />)}
                            {combatState.monsterAttackIndex !== undefined ? (
                              <div className="flex gap-1 ml-2">
                                {[...Array(currentMonsterStats.attackOptions[combatState.monsterAttackIndex].MELEE)].map((_, i) => <div key={`melee-${i}`} className="w-3 h-3 rounded-sm border border-white/20 bg-red-600" />)}
                                {[...Array(currentMonsterStats.attackOptions[combatState.monsterAttackIndex].MANA)].map((_, i) => <div key={`mana-${i}`} className="w-3 h-3 rounded-sm border border-white/20 bg-blue-500" />)}
                                {[...Array(currentMonsterStats.attackOptions[combatState.monsterAttackIndex].RANGED_MANA)].map((_, i) => <div key={`ranged-${i}`} className="w-3 h-3 rounded-sm border border-white/20 bg-purple-500" />)}
                              </div>
                            ) : (
                              <div className="flex gap-0.5 ml-2 items-center">
                                <div className="w-2 h-2 bg-red-600 rounded-full" />
                                <span className="text-[10px] text-slate-400">Attack Options: {currentMonsterStats.attackOptions.length}</span>
                              </div>
                            )}
                          </>
                        ) : combatState.defenderId === 'monster2' ? (
                          <>
                            {[...Array(currentMonsterStats.defenseDice)].map((_, i) => <div key={`def-${i}`} className="w-3 h-3 rounded-sm border border-white/20 bg-slate-500" />)}
                            {combatState.monsterAttackIndex !== undefined ? (
                              <div className="flex gap-1 ml-2">
                                {[...Array(currentMonsterStats.attackOptions[combatState.monsterAttackIndex].MELEE)].map((_, i) => <div key={`melee-${i}`} className="w-3 h-3 rounded-sm border border-white/20 bg-red-600" />)}
                                {[...Array(currentMonsterStats.attackOptions[combatState.monsterAttackIndex].MANA)].map((_, i) => <div key={`mana-${i}`} className="w-3 h-3 rounded-sm border border-white/20 bg-blue-500" />)}
                                {[...Array(currentMonsterStats.attackOptions[combatState.monsterAttackIndex].RANGED_MANA)].map((_, i) => <div key={`ranged-${i}`} className="w-3 h-3 rounded-sm border border-white/20 bg-purple-500" />)}
                              </div>
                            ) : (
                              <div className="flex gap-0.5 ml-2 items-center">
                                <div className="w-2 h-2 bg-red-600 rounded-full" />
                                <span className="text-[10px] text-slate-400">Attack Options: {currentMonsterStats.attackOptions.length}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          currentMonsterStats.dice && currentMonsterStats.dice.map((type: string, i: number) => (
                            <div key={i} className={`w-3 h-3 rounded-sm border border-white/20 ${type === 'DEFENSE' ? 'bg-slate-500' : type === 'MANA' ? 'bg-blue-500' : 'bg-red-600'}`} />
                          ))
                        )}
                      </div>
                      {combatState.phase !== 'INIT' && renderUnitRolls(combatState.defenderId, combatState.defenderRolls, 'defender')}
                    </div>
                  </div>
                ) : (
                  combatState.defenderUnits && combatState.defenderUnits.map(u => renderUnitCard(u, defender || null, 'defender'))
                )}
              </div>
            </div>

            {combatState.phase !== 'INIT' && (
              <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs uppercase text-slate-500 mb-2 tracking-widest">Rolls</h4>
                <div className="flex flex-wrap gap-2">
                  {combatState.defenderRolls && combatState.defenderRolls.map((r, i) => {
                    const isExplosion = r.value === -1 || r.value === -2;
                    const canResolveExplosion = isExplosion && (combatState.phase === 'RANGED_APPLY' || combatState.phase === 'MELEE_APPLY' || combatState.phase === 'RANGED_REROLL' || combatState.phase === 'MELEE_REROLL');
                    return (
                      <div key={i} className="w-10 h-10 flex items-center justify-center relative">
                        <Dice 
                          type={r.type as any} 
                          value={r.value} 
                          size="sm" 
                          isRolling={r.isRolling || combatState.isRolling}
                          delay={i * 100}
                        />
                        {canResolveExplosion && (
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded pointer-events-none">
                            <div className="bg-blue-600 text-white rounded-full p-0.5 shadow-lg animate-bounce">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    Total Defense: 
                    <div className="relative flex items-center justify-center w-6 h-6">
                      <Shield className="w-6 h-6 text-blue-400/20 fill-blue-400/10 absolute" />
                      <span className="text-blue-400 font-bold relative z-10">{combatState.defenderTotalDefense}</span>
                    </div>
                  </span>
                  <span className="text-slate-400">Damage Taken: <span className="text-red-500 font-bold">{combatState.attackerTotalDamage}</span></span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-800 border-t border-white/10">
          <div className="flex flex-col gap-1">
            {combatState.logs && combatState.logs.map((log, i) => (
              <div key={i} className="text-xs text-slate-400">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombatModal;
