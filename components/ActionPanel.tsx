
import React from 'react';
import { ActionType, Player, Unit, Building, HexTile, TileType } from '../types';
import { UNIT_STATS, FACTION_UNIT_IMAGES, DICE, SKILLS, getDiceFromSkill } from '../constants';
import { ASSETS } from '../assets';

interface ActionPanelProps {
  currentPlayer: Player;
  board: HexTile[];
  units: Unit[];
  buildings: Building[];
  onAction: (actionType: ActionType) => void;
  onEndTurn: () => void;
  pendingMoves: number;
  onFinishMoves: () => void;
  isBuildingCastle: boolean;
  onCancelAction: () => void;
  isRecruiting: boolean;
  recruitingUnitType: 'warrior' | 'mage' | 'knight' | null;
  onSelectRecruitUnit: (unitType: 'warrior' | 'mage' | 'knight') => void;
  isSelectingCombatHex: boolean;
  isSelectingAdventureHex: boolean;
  isExploring: boolean;
  explorationCount: number;
  isBuyingSkill: boolean;
  selectedSkill: any;
  gamePhase: string;
  freeProductionActions: ActionType[];
  isSelectingFreeRecruitHex: boolean;
  freeRecruitType: 'warrior' | 'mage' | 'knight' | null;
  freeRecruitCount: number;
  activeYearlyEffects: string[];
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const ACTION_LABELS: Record<ActionType, string> = {
  [ActionType.PRODUCTION]: 'Production',
  [ActionType.MOVE_1]: 'Move 3 Units',
  [ActionType.MOVE_2]: 'Move 3 Units',
  [ActionType.ADVENTURE]: 'Adventure',
  [ActionType.COMPLETE_QUEST]: 'Complete Quest',
  [ActionType.BUILD_CASTLE]: 'Build Castle',
  [ActionType.RECRUIT]: 'Recruit Units',
  [ActionType.BUILD_MONUMENT]: 'Build Monument',
  [ActionType.COMBAT]: 'Combat',
  [ActionType.BUY_SKILL]: 'Buy Skill',
  [ActionType.LEVEL_UP]: 'Level Up',
  [ActionType.EXPLORE]: 'Explore'
};

const ActionPanel: React.FC<ActionPanelProps> = ({ 
  currentPlayer, 
  board,
  units,
  buildings,
  onAction, 
  onEndTurn, 
  pendingMoves, 
  onFinishMoves, 
  isBuildingCastle, 
  onCancelAction,
  isRecruiting,
  recruitingUnitType,
  onSelectRecruitUnit,
  isSelectingCombatHex,
  isSelectingAdventureHex,
  isExploring,
  explorationCount,
  isBuyingSkill,
  selectedSkill,
  gamePhase,
  freeProductionActions,
  isSelectingFreeRecruitHex,
  freeRecruitType,
  freeRecruitCount,
  activeYearlyEffects,
  onHover,
  onClearHover
}) => {
  if (isSelectingFreeRecruitHex && freeRecruitType) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 backdrop-blur rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center">
        <div className="flex justify-between w-full items-center">
          <h3 className="text-blue-500 fantasy-font text-lg md:text-xl animate-pulse uppercase tracking-widest">
            Deploy Free {freeRecruitType} ({freeRecruitCount} remaining)
          </h3>
        </div>
        <p className="text-slate-400 text-[10px] md:text-sm mt-2 text-center">Select your capital or a castle to deploy the unit.</p>
      </div>
    );
  }

  if (gamePhase === 'SETUP_CAPITAL') {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 backdrop-blur rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center">
        <h3 className="text-yellow-500 fantasy-font text-lg md:text-xl animate-pulse uppercase tracking-widest">
          {currentPlayer.name}, Place Your Capital
        </h3>
        <p className="text-slate-400 text-[10px] md:text-sm mt-2 text-center">Click on any border hex (distance 2 or 3 from center) to place your capital and starting units.</p>
      </div>
    );
  }

  if (isBuyingSkill && selectedSkill) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 backdrop-blur rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center">
        <div className="flex justify-between w-full items-center">
          <h3 className="text-yellow-500 fantasy-font text-lg md:text-xl animate-pulse uppercase tracking-widest">
            Select Unit for {selectedSkill.name}
          </h3>
          <button 
            onClick={onCancelAction}
            className="px-3 py-1 md:px-4 md:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
        <p className="text-slate-400 text-[10px] md:text-sm mt-2 text-center">Click on a hex where you have units to apply the skill.</p>
      </div>
    );
  }

  if (isSelectingCombatHex) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 backdrop-blur rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center">
        <div className="flex justify-between w-full items-center">
          <h3 className="text-red-500 fantasy-font text-lg md:text-xl animate-pulse uppercase tracking-widest">
            Select Combat Hex
          </h3>
          <button 
            onClick={onCancelAction}
            className="px-3 py-1 md:px-4 md:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
        <p className="text-slate-400 text-[10px] md:text-sm mt-2 text-center">Select a hex with your units and an enemy or a dungeon entrance.</p>
      </div>
    );
  }

  if (isSelectingAdventureHex) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 backdrop-blur rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center">
        <div className="flex justify-between w-full items-center">
          <h3 className="text-yellow-500 fantasy-font text-lg md:text-xl animate-pulse uppercase tracking-widest">
            Select Adventure Hex
          </h3>
          <button 
            onClick={onCancelAction}
            className="px-3 py-1 md:px-4 md:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
        <p className="text-slate-400 text-[10px] md:text-sm mt-2 text-center">Click on a hex with an adventure marker (?) where you have units.</p>
      </div>
    );
  }

  if (isExploring) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 backdrop-blur rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center">
        <div className="flex justify-between w-full items-center">
          <h3 className="text-emerald-500 fantasy-font text-lg md:text-xl animate-pulse uppercase tracking-widest">
            Explore ({explorationCount} remaining)
          </h3>
          <button 
            onClick={onCancelAction}
            className="px-3 py-1 md:px-4 md:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
        <p className="text-slate-400 text-[10px] md:text-sm mt-2 text-center">Select an unrevealed hex adjacent to your units or castles to reveal it.</p>
      </div>
    );
  }

  if (pendingMoves > 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 backdrop-blur rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center">
        <div className="flex justify-between w-full items-center">
          <h3 className="text-yellow-500 fantasy-font text-lg md:text-xl animate-pulse">
            Move Units ({pendingMoves} remaining)
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={onCancelAction}
              className="px-3 py-1 md:px-4 md:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={onFinishMoves}
              className="px-3 py-1 md:px-4 md:py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-bold transition-colors text-sm"
            >
              Finish Moving
            </button>
          </div>
        </div>
        <p className="text-slate-400 text-[10px] md:text-sm mt-2 text-center">
          Select a unit on the board, then click a destination hex to move it. You can spend an extra move to ignore a red line.
        </p>
      </div>
    );
  }

  if (isBuildingCastle) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 backdrop-blur rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center">
        <div className="flex justify-between w-full items-center">
          <h3 className="text-yellow-500 fantasy-font text-lg md:text-xl animate-pulse">
            Build Castle
          </h3>
          <button 
            onClick={onCancelAction}
            className="px-3 py-1 md:px-4 md:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
        <p className="text-slate-400 text-[10px] md:text-sm mt-2">Select a hex with your units, no enemies, and an available castle slot.</p>
      </div>
    );
  }

  if (isRecruiting) {
    if (!recruitingUnitType) {
      return (
        <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 backdrop-blur rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center">
          <div className="flex justify-between w-full items-center mb-4">
            <h3 className="text-yellow-500 fantasy-font text-lg md:text-xl animate-pulse">
              Recruit Unit
            </h3>
            <button 
              onClick={onCancelAction}
              className="px-3 py-1 md:px-4 md:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-4 w-full">
            {(['warrior', 'mage', 'knight'] as const).map((type) => {
              const stats = UNIT_STATS[type];
              const cost = type === 'warrior' ? 4 : type === 'mage' ? 6 : 8;
              const left = currentPlayer.availableUnits[type === 'warrior' ? 'warriors' : type === 'mage' ? 'mages' : 'knights'];
              const canAfford = currentPlayer.gold >= cost;
              const hasAvailable = left > 0;
              
              const playerFaction = currentPlayer.faction;
              const unitImage = (playerFaction && FACTION_UNIT_IMAGES[playerFaction]) 
                ? FACTION_UNIT_IMAGES[playerFaction][type] 
                : (ASSETS.FACTIONS[playerFaction as keyof typeof ASSETS.FACTIONS] || 'https://picsum.photos/seed/unit/200/200');

              // Calculate initial dice
              const initialSkills = stats.initialSkills.map(id => SKILLS[id]);
              const skillDice = initialSkills.reduce((acc, s) => {
                if (!s) return acc;
                const dicePool = getDiceFromSkill(s, false);
                dicePool.forEach(d => {
                  if (d.type === 'MELEE') acc.melee += d.count;
                  if (d.type === 'MANA') acc.mana += d.count;
                  if (d.type === 'DEFENSE') acc.defense += d.count;
                });
                return acc;
              }, { melee: 0, mana: 0, defense: 0 });

              const meleeDice = skillDice.melee;
              const manaDice = skillDice.mana;
              const defenseDice = skillDice.defense;

              return (
                <button 
                  key={type}
                  onClick={() => onSelectRecruitUnit(type)}
                  onMouseEnter={(e) => onHover('UNIT', { type, level: 1, stats, skills: stats.initialSkills.map(id => SKILLS[id]).filter(Boolean), faction: currentPlayer.faction }, e.clientX, e.clientY)}
                  onMouseLeave={onClearHover}
                  disabled={!canAfford || !hasAvailable}
                  className="p-2 md:p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-xl flex flex-col items-center transition-all relative group overflow-hidden"
                >
                  <div className="absolute -right-2 -bottom-2 w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <img src={unitImage} alt={type} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded bg-slate-700 border border-white/10 overflow-hidden mb-1">
                    <img src={unitImage} alt={type} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  
                  <span className="font-bold text-xs md:text-sm capitalize text-slate-100">{type}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] md:text-xs text-yellow-400 font-bold">{cost} Gold</span>
                    <span className="text-[8px] md:text-[10px] text-slate-500">({left} left)</span>
                  </div>

                  <div className="flex gap-1 mt-1">
                    {meleeDice > 0 && (
                      <div className="flex gap-0.5">
                        {Array.from({ length: meleeDice }).map((_, i) => (
                          <div key={i} className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-orange-500 flex items-center justify-center text-[6px] md:text-[8px] font-bold text-white shadow-sm" title="Melee Die">
                            ⚔️
                          </div>
                        ))}
                      </div>
                    )}
                    {manaDice > 0 && (
                      <div className="flex gap-0.5">
                        {Array.from({ length: manaDice }).map((_, i) => (
                          <div key={i} className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-purple-500 flex items-center justify-center text-[6px] md:text-[8px] font-bold text-white shadow-sm" title="Mana Die">
                            ✨
                          </div>
                        ))}
                      </div>
                    )}
                    {defenseDice > 0 && (
                      <div className="flex gap-0.5">
                        {Array.from({ length: defenseDice }).map((_, i) => (
                          <div key={i} className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-emerald-500 flex items-center justify-center text-[6px] md:text-[8px] font-bold text-white shadow-sm" title="Defense Die">
                            🛡️
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 backdrop-blur rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center">
          <div className="flex justify-between w-full items-center">
            <h3 className="text-yellow-500 fantasy-font text-lg md:text-xl animate-pulse">
              Deploy {recruitingUnitType}
            </h3>
            <button 
              onClick={onCancelAction}
              className="px-3 py-1 md:px-4 md:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
          <p className="text-slate-400 text-[10px] md:text-sm mt-2 text-center">Select your capital or a castle to deploy the unit.</p>
        </div>
      );
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-2 md:p-3 bg-slate-900/60 backdrop-blur rounded-t-xl border-t border-x border-white/10 flex flex-col items-center">
      <div className="flex justify-between w-full mb-1 md:mb-2 items-center">
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-slate-400 text-[9px] md:text-xs italic">Ruling </span>
          <span className="fantasy-font text-sm md:text-lg" style={{ color: currentPlayer.color }}>{currentPlayer.name} ({currentPlayer.faction})</span>
        </div>
        <div className="flex gap-2 md:gap-4 items-center">
          <div className="flex flex-col md:flex-row md:gap-3 items-end md:items-center">
            <span className="text-[9px] md:text-xs text-slate-400">Actions: <span className="text-white font-bold">{currentPlayer.actionsRemaining}/2</span></span>
            <div className="flex gap-2">
               <span className="text-yellow-500 text-[9px] md:text-xs font-bold">{currentPlayer.gold}g</span>
               <span className="text-blue-400 text-[9px] md:text-xs font-bold">{currentPlayer.xp}xp</span>
            </div>
          </div>
          <button 
            onClick={() => onAction(ActionType.LEVEL_UP)}
            className="px-1.5 py-0.5 md:px-3 md:py-1 bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-200 rounded border border-indigo-500/30 transition-colors text-[9px] md:text-xs font-bold"
          >
            Level Up
          </button>
          <button 
            onClick={onEndTurn}
            className="px-1.5 py-0.5 md:px-3 md:py-1 bg-red-900/50 hover:bg-red-800/60 text-red-200 rounded border border-red-500/30 transition-colors text-[9px] md:text-xs font-bold"
          >
            End Turn
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-4 gap-1 md:gap-2 w-full">
        {/* Special Production Group */}
        <div className="flex flex-col gap-1 w-full">
          {(() => {
            const getProductionValues = (playerId: number) => {
              const playerHexes = new Set<string>();
              units.filter(u => u.playerId === playerId).forEach(u => playerHexes.add(`${u.q},${u.r}`));
              buildings.filter(b => b.playerId === playerId).forEach(b => playerHexes.add(`${b.q},${b.r}`));

              let producedGold = 0;
              let producedXP = 0;
              let goldLostToReduction = 0;

              playerHexes.forEach(hexStr => {
                const [hq, hr] = hexStr.split(',').map(Number);
                const tile = board.find(t => t.q === hq && t.r === hr);
                if (tile) {
                  let gold = tile.productionGold || 0;
                  if (tile.type === TileType.PLAINS && activeYearlyEffects.includes('PLAINS_GOLD_REDUCTION')) {
                    const originalGold = gold;
                    gold = Math.ceil(gold / 2);
                    goldLostToReduction += (originalGold - gold);
                  }
                  producedGold += gold;
                  producedXP += tile.productionXP || 0;
                }
              });

              return { gold: producedGold, xp: producedXP, goldLostToReduction };
            };

            const renderBtn = (type: ActionType, isSmall = false) => {
              const isFreeAction = freeProductionActions.includes(type);
              const cubes = currentPlayer.actionSlots[type] || 0;
              const cost = isFreeAction ? 0 : cubes * 2;
              const canAfford = currentPlayer.gold >= cost;
              let canAct = (currentPlayer.actionsRemaining > 0 || isFreeAction) && canAfford;
              if (!isFreeAction && type === ActionType.PRODUCTION && currentPlayer.actionsRemaining < 2) canAct = false;

              let productionInfo = null;
              if (type === ActionType.PRODUCTION) {
                const baseProd = getProductionValues(currentPlayer.id);
                let tokenBonus = 0;
                Object.values(currentPlayer.actionSlots).forEach(count => {
                  tokenBonus += (count as number);
                });
                productionInfo = {
                  gold: baseProd.gold + tokenBonus,
                  xp: baseProd.xp,
                  tokenBonus,
                  goldLostToReduction: baseProd.goldLostToReduction
                };
              }

              return (
                <button
                  key={type}
                  onClick={() => onAction(type)}
                  disabled={!canAct}
                  className={`relative p-1 rounded-lg border flex flex-col items-center justify-center transition-all w-full
                    ${isSmall ? 'min-h-[25px] md:min-h-[30px]' : 'min-h-[45px] md:min-h-[60px]'}
                    ${canAct 
                      ? isFreeAction ? 'bg-indigo-900/80 hover:bg-indigo-800 border-indigo-400/50 cursor-pointer animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-slate-800 hover:bg-slate-700 border-white/20 hover:border-yellow-500/50 cursor-pointer' 
                      : 'bg-slate-900/50 border-white/5 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <span className={`${isSmall ? 'text-[6px] md:text-[8px]' : 'text-[7px] md:text-[10px]'} font-bold text-slate-200 text-center uppercase mb-0.5 leading-tight`}>
                    {isFreeAction ? `Free ${ACTION_LABELS[type]}` : ACTION_LABELS[type]}
                  </span>
                  {productionInfo && (
                    <div className="flex flex-col items-center">
                      <div className="flex gap-1 items-center">
                        <span className="text-[8px] md:text-[10px] text-yellow-500 font-bold">+{productionInfo.gold}g</span>
                        <span className="text-[8px] md:text-[10px] text-blue-400 font-bold">+{productionInfo.xp}xp</span>
                      </div>
                      {productionInfo.goldLostToReduction > 0 && (
                        <div className="text-[6px] md:text-[7px] text-red-400/70 italic leading-tight">
                          -{productionInfo.goldLostToReduction}g (Event)
                        </div>
                      )}
                    </div>
                  )}
                  {productionInfo && productionInfo.tokenBonus > 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-600 text-white text-[6px] md:text-[8px] px-1 rounded-full border border-slate-900 font-bold" title="Token Bonus">
                      +{productionInfo.tokenBonus}
                    </div>
                  )}
                  {cost > 0 && !isFreeAction && (
                    <div className={`absolute top-0.5 right-0.5 ${isSmall ? 'text-[5px] md:text-[7px]' : 'text-[6px] md:text-[8px]'} bg-red-900/80 text-red-200 px-0.5 rounded`}>
                      {cost}g
                    </div>
                  )}
                </button>
              );
            };

            return (
              <>
                {renderBtn(ActionType.PRODUCTION)}
                <div className="flex gap-1 w-full">
                  {renderBtn(ActionType.COMPLETE_QUEST, true)}
                  {renderBtn(ActionType.BUY_SKILL, true)}
                </div>
              </>
            );
          })()}
        </div>

        {/* Other Actions */}
        {Object.values(ActionType)
          .filter(a => a !== ActionType.PRODUCTION && a !== ActionType.COMPLETE_QUEST && a !== ActionType.BUY_SKILL)
          .map((actionType) => {
            const cubes = currentPlayer.actionSlots[actionType] || 0;
            const cost = cubes * 2;
            const canAfford = currentPlayer.gold >= cost;
            const canAct = currentPlayer.actionsRemaining > 0 && canAfford;

            return (
              <button
                key={actionType}
                onClick={() => onAction(actionType)}
                disabled={!canAct}
                className={`relative p-1 md:p-2 rounded-lg border flex flex-col items-center justify-center min-h-[45px] md:min-h-[60px] transition-all
                  ${canAct 
                    ? 'bg-slate-800 hover:bg-slate-700 border-white/20 hover:border-yellow-500/50 cursor-pointer' 
                    : 'bg-slate-900/50 border-white/5 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-[7px] md:text-[10px] font-bold text-slate-200 text-center uppercase mb-0.5 md:mb-1 leading-tight">
                  {ACTION_LABELS[actionType]}
                </span>
                {cost > 0 && (
                  <div className="absolute top-0.5 right-0.5 text-[6px] md:text-[8px] bg-red-900/80 text-red-200 px-0.5 rounded">
                    {cost}g
                  </div>
                )}
              </button>
            );
          })}
      </div>
    </div>

  );
};

export default ActionPanel;

