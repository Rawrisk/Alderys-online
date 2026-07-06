import React from 'react';
import { ActionType, Player, Unit, Building, HexTile, TileType } from '../types';
import { UNIT_STATS, FACTION_UNIT_IMAGES, SKILLS, getDiceFromSkill, FACTION_THEMES } from '../constants';
import { ASSETS } from '../assets';
import { 
  Hammer, 
  Footprints, 
  Compass, 
  Award, 
  Castle, 
  UserPlus, 
  Trophy, 
  Swords, 
  Sparkles, 
  ArrowUpCircle, 
  Eye,
  Coins,
  Compass as NavigationIcon,
  X,
  Target
} from 'lucide-react';

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
  gameMode: string;
  freeProductionActions: ActionType[];
  isSelectingFreeRecruitHex: boolean;
  freeRecruitType: 'warrior' | 'mage' | 'knight' | null;
  freeRecruitCount: number;
  activeYearlyEffects: string[];
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
  isMyTurn?: boolean;
}

const ACTION_LABELS: Record<ActionType, string> = {
  [ActionType.PRODUCTION]: 'Production',
  [ActionType.MOVE_1]: 'Movement I',
  [ActionType.MOVE_2]: 'Movement II',
  [ActionType.ADVENTURE]: 'Adventure',
  [ActionType.COMPLETE_QUEST]: 'Complete Quest',
  [ActionType.BUILD_CASTLE]: 'Build Castle',
  [ActionType.RECRUIT]: 'Recruit',
  [ActionType.BUILD_MONUMENT]: 'Build Monument',
  [ActionType.COMBAT]: 'Combat',
  [ActionType.BUY_SKILL]: 'Buy Skill',
  [ActionType.LEVEL_UP]: 'Level Up',
  [ActionType.EXPLORE]: 'Explore'
};

const ACTION_ICONS: Record<ActionType, React.ComponentType<any>> = {
  [ActionType.PRODUCTION]: Hammer,
  [ActionType.MOVE_1]: Footprints,
  [ActionType.MOVE_2]: Footprints,
  [ActionType.ADVENTURE]: Compass,
  [ActionType.COMPLETE_QUEST]: Award,
  [ActionType.BUILD_CASTLE]: Castle,
  [ActionType.RECRUIT]: UserPlus,
  [ActionType.BUILD_MONUMENT]: Trophy,
  [ActionType.COMBAT]: Swords,
  [ActionType.BUY_SKILL]: Sparkles,
  [ActionType.LEVEL_UP]: ArrowUpCircle,
  [ActionType.EXPLORE]: Eye,
};

const ACTION_DESCRIPTIONS: Record<ActionType, string> = {
  [ActionType.PRODUCTION]: 'Generate Gold & XP from your territories',
  [ActionType.MOVE_1]: 'Move up to 3 units across the hex field',
  [ActionType.MOVE_2]: 'Secondary move order for your forces',
  [ActionType.ADVENTURE]: 'Examine adjacent adventure points',
  [ActionType.COMPLETE_QUEST]: 'Settle active quests for victory points',
  [ActionType.BUILD_CASTLE]: 'Construct fortification for deployment',
  [ActionType.RECRUIT]: 'Enlist fresh combatants to your castles',
  [ActionType.BUILD_MONUMENT]: 'Commence monument for glory & VPs',
  [ActionType.COMBAT]: 'Engage monstrous presence or rivals',
  [ActionType.BUY_SKILL]: 'Unlock powerful faction passive skills',
  [ActionType.LEVEL_UP]: 'Enhance unit properties and skills',
  [ActionType.EXPLORE]: 'Reveal surrounding fog of war tiles'
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
  gameMode,
  freeProductionActions,
  isSelectingFreeRecruitHex,
  freeRecruitType,
  freeRecruitCount,
  activeYearlyEffects,
  onHover,
  onClearHover,
  isMyTurn = true
}) => {
  const theme = FACTION_THEMES[currentPlayer.faction] || FACTION_THEMES.human;
  
  const factionStyles = {
    '--faction-color': theme.color,
    '--faction-glow': theme.glow,
    '--faction-bg': theme.bg,
    '--faction-border': theme.border,
    '--faction-text': theme.text,
  } as React.CSSProperties;

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
      // Match performAction's Progression-mode rule: a monster-occupied hex
      // produces nothing (a castle there stays built, but idle) until cleared.
      if (tile && gameMode === 'PROGRESSION' && tile.monsterLevel) return;
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

  // Modern Styled Layout for Multi-state Active Gameplay Interfaces
  if (isSelectingFreeRecruitHex && freeRecruitType) {
    return (
      <div className={`w-full max-w-4xl mx-auto p-5 panel-wood-translucent backdrop-blur-xl rounded-t-2xl border-t-2 border-x-2 ${theme.border} flex flex-col items-center shadow-2xl relative overflow-hidden`} style={factionStyles}>
        <div className="absolute top-0 left-0 w-full h-1 opacity-50" style={{ backgroundColor: theme.color }}></div>
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserPlus className="animate-pulse" size={20} />
            </div>
            <div>
              <h3 className="fantasy-font text-lg md:text-xl uppercase tracking-wider text-slate-100">
                {isMyTurn ? `Deploy Free ${freeRecruitType}` : `${currentPlayer.name} is deploying units...`}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {isMyTurn ? `You have ${freeRecruitCount} unit(s) remaining to deploy statically.` : 'Please wait for client action.'}
              </p>
            </div>
          </div>
          {isMyTurn && (
            <button 
              onClick={onCancelAction}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 active:scale-95"
            >
              <X size={14} /> Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gamePhase === 'SETUP_CAPITAL') {
    return (
      <div className={`w-full max-w-4xl mx-auto p-5 panel-wood-translucent backdrop-blur-xl rounded-t-2xl border-t-2 border-x-2 ${theme.border} flex flex-col items-center shadow-2xl relative overflow-hidden`} style={factionStyles}>
        <div className="absolute top-0 left-0 w-full h-1 opacity-50" style={{ backgroundColor: theme.color }}></div>
        <div className="flex items-center gap-4 flex-col md:flex-row text-center md:text-left w-full justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 animate-bounce">
              <Castle size={24} />
            </div>
            <div>
              <h3 className="fantasy-font text-xl uppercase tracking-widest text-slate-100">
                {isMyTurn ? `${currentPlayer.name}, Secure Your Capital` : `Waiting for capital placement...`}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5 max-w-md">
                {isMyTurn ? 'Select any border hex (distance 2 or 3 from center) to construct your Capital structure and deploy your starting guardians.' : `Please wait for ${currentPlayer.name} to confirm.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isBuyingSkill && selectedSkill) {
    return (
      <div className={`w-full max-w-4xl mx-auto p-5 panel-wood-translucent backdrop-blur-xl rounded-t-2xl border-t-2 border-x-2 ${theme.border} flex flex-col items-center shadow-2xl relative overflow-hidden`} style={factionStyles}>
        <div className="absolute top-0 left-0 w-full h-1 opacity-50" style={{ backgroundColor: theme.color }}></div>
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 animate-spin-slow">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="fantasy-font text-lg md:text-xl uppercase tracking-wider text-slate-100">
                Select Unit Level for {selectedSkill.name}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Click on a hex containing your unit corps to bind this passive skill.</p>
            </div>
          </div>
          <button 
            onClick={onCancelAction}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 active:scale-95"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  if (isSelectingCombatHex) {
    return (
      <div className={`w-full max-w-4xl mx-auto p-5 panel-wood-translucent backdrop-blur-xl rounded-t-2xl border-t-2 border-x-2 border-red-500/40 flex flex-col items-center shadow-2xl relative overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500/70"></div>
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Swords size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="fantasy-font text-lg md:text-xl uppercase tracking-wider text-red-400">
                Target Combat Hex
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Click a hex containing your active army adjacent to an enemy presence or a Dungeon.</p>
            </div>
          </div>
          <button 
            onClick={onCancelAction}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 active:scale-95"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  if (isSelectingAdventureHex) {
    return (
      <div className={`w-full max-w-4xl mx-auto p-5 panel-wood-translucent backdrop-blur-xl rounded-t-2xl border-t-2 border-x-2 border-amber-500/40 flex flex-col items-center shadow-2xl relative overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/70"></div>
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass size={20} className="animate-spin-slow" />
            </div>
            <div>
              <h3 className="fantasy-font text-lg md:text-xl uppercase tracking-wider text-amber-400">
                Seek Adventure Hex
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Select a neighboring hex containing an active Quest/Adventure (?) marker.</p>
            </div>
          </div>
          <button 
            onClick={onCancelAction}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 active:scale-95"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  if (isExploring) {
    return (
      <div className={`w-full max-w-4xl mx-auto p-5 panel-wood-translucent backdrop-blur-xl rounded-t-2xl border-t-2 border-x-2 border-emerald-500/40 flex flex-col items-center shadow-2xl relative overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/70"></div>
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Eye size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="fantasy-font text-lg md:text-xl uppercase tracking-wider text-emerald-400">
                Scout Surrounding Lands ({explorationCount} moves left)
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Press on any neighboring fog hex relative to your structures and armies to reveal terrain.</p>
            </div>
          </div>
          <button 
            onClick={onCancelAction}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 active:scale-95"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  if (pendingMoves > 0) {
    return (
      <div className={`w-full max-w-4xl mx-auto p-5 panel-wood-translucent backdrop-blur-xl rounded-t-2xl border-t-2 border-x-2 ${theme.border} flex flex-col items-center shadow-2xl relative overflow-hidden`} style={factionStyles}>
        <div className="absolute top-0 left-0 w-full h-1 opacity-50" style={{ backgroundColor: theme.color }}></div>
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Footprints size={20} className="scale-x-[-1]" />
            </div>
            <div>
              <h3 className="fantasy-font text-lg md:text-xl uppercase tracking-wider text-slate-100">
                Move Armies ({pendingMoves} moves remaining)
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Select a unit token, then click an adjacent legal destination hex to march. Crossing red borders costs 2 moves.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onCancelAction}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl font-bold transition-all text-xs active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={onFinishMoves}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 border border-amber-600 text-slate-950 rounded-xl font-black transition-all text-xs shadow-md shadow-amber-500/20 active:scale-95"
            >
              Finish Moves
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isBuildingCastle) {
    return (
      <div className={`w-full max-w-4xl mx-auto p-5 panel-wood-translucent backdrop-blur-xl rounded-t-2xl border-t-2 border-x-2 ${theme.border} flex flex-col items-center shadow-2xl relative overflow-hidden`} style={factionStyles}>
        <div className="absolute top-0 left-0 w-full h-1 opacity-50" style={{ backgroundColor: theme.color }}></div>
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Castle size={20} />
            </div>
            <div>
              <h3 className="fantasy-font text-lg md:text-xl uppercase tracking-wider text-slate-100">
                Erect Castle Fortification
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Select a secure hex under your unit control to construct a secondary recruit depot.</p>
            </div>
          </div>
          <button 
            onClick={onCancelAction}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 active:scale-95"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  if (isRecruiting) {
    if (!recruitingUnitType) {
      return (
        <div className={`w-full max-w-4xl mx-auto p-5 panel-wood-translucent backdrop-blur-xl rounded-t-2xl border-t-2 border-x-2 ${theme.border} flex flex-col items-center shadow-2xl relative overflow-hidden`} style={factionStyles}>
          <div className="absolute top-0 left-0 w-full h-1 opacity-50" style={{ backgroundColor: theme.color }}></div>
          <div className="flex justify-between w-full items-center mb-4 pb-2 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="fantasy-font text-lg uppercase tracking-wider text-slate-200">
                  Select Unit to Recruit
                </h3>
                <p className="text-xs text-slate-500">Recruits are added into your pools and must be static-deployed to a Castle.</p>
              </div>
            </div>
            <button 
              onClick={onCancelAction}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 active:scale-95"
            >
              <X size={14} /> Cancel
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
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
                  className="p-3 bg-slate-900/80 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 hover:border-yellow-500/50 rounded-xl flex items-center gap-3 transition-all relative group overflow-hidden text-left"
                >
                  <div className="absolute right-0 bottom-0 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <img src={unitImage} alt={type} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  
                  <div className="w-12 h-12 rounded-lg bg-slate-800 border border-white/10 overflow-hidden shrink-0 shadow-inner">
                    <img src={unitImage} alt={type} className="w-full h-full object-cover scale-110" referrerPolicy="no-referrer" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm md:text-base capitalize text-slate-100 flex items-center gap-2">
                      {type}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-yellow-500 font-bold flex items-center gap-0.5">
                        <Coins size={12} /> {cost}g
                      </span>
                      <span className="text-[10px] text-slate-500">({left} left)</span>
                    </div>

                    <div className="flex gap-1 mt-1.5">
                      {meleeDice > 0 && (
                        <div className="flex gap-0.5">
                          {Array.from({ length: meleeDice }).map((_, i) => (
                            <div key={i} className="w-4 h-4 rounded bg-orange-600/90 flex items-center justify-center text-[8px] font-bold text-white shadow-sm" title="Melee Die">
                              ⚔️
                            </div>
                          ))}
                        </div>
                      )}
                      {manaDice > 0 && (
                        <div className="flex gap-0.5">
                          {Array.from({ length: manaDice }).map((_, i) => (
                            <div key={i} className="w-4 h-4 rounded bg-purple-600/90 flex items-center justify-center text-[8px] font-bold text-white shadow-sm" title="Mana Die">
                              ✨
                            </div>
                          ))}
                        </div>
                      )}
                      {defenseDice > 0 && (
                        <div className="flex gap-0.5">
                          {Array.from({ length: defenseDice }).map((_, i) => (
                            <div key={i} className="w-4 h-4 rounded bg-emerald-600/90 flex items-center justify-center text-[8px] font-bold text-white shadow-sm" title="Defense Die">
                              🛡️
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    } else {
      return (
        <div className={`w-full max-w-4xl mx-auto p-5 panel-wood-translucent backdrop-blur-xl rounded-t-2xl border-t-2 border-x-2 ${theme.border} flex flex-col items-center shadow-2xl relative overflow-hidden`} style={factionStyles}>
          <div className="absolute top-0 left-0 w-full h-1 opacity-50" style={{ backgroundColor: theme.color }}></div>
          <div className="flex justify-between w-full items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <UserPlus size={20} className="animate-bounce" />
              </div>
              <div>
                <h3 className="fantasy-font text-lg md:text-xl uppercase tracking-wider text-amber-400">
                  Deploy recruited {recruitingUnitType}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Click your Capital hex or any owned Castle to place the newly enlisted corps.</p>
              </div>
            </div>
            <button 
              onClick={onCancelAction}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 active:scale-95"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      );
    }
  }

  // --- Core Actions Dashboard View ---
  return (
    <div className={`w-full max-w-4xl mx-auto p-4 panel-wood-translucent backdrop-blur-2xl rounded-t-2xl border-t-2 border-x-2 ${theme.border} flex flex-col items-center shadow-2xl relative overflow-hidden`} style={factionStyles}>
      {/* Faction Accent line */}
      <div className="absolute top-0 left-0 w-full h-[3px] opacity-75 shadow-lg" style={{ backgroundColor: theme.color, boxShadow: `0 0 10px ${theme.color}` }}></div>
      
      {/* 1. Header Status Bar */}
      <div className="flex flex-col md:flex-row justify-between w-full mb-4 items-center gap-4 relative z-10">
        
        {/* Left: Player Profile Card */}
        <div className="flex items-center gap-3 bg-slate-900/60 px-4 py-1.5 rounded-full border border-white/5 shadow-inner leading-normal">
          <div className="w-8 h-8 rounded-full border-2 overflow-hidden bg-slate-800 flex items-center justify-center shrink-0 shadow-inner" style={{ borderColor: theme.color }}>
            <img 
               src={FACTION_UNIT_IMAGES[currentPlayer.faction]?.warrior || ASSETS.UNITS.warrior} 
               alt={currentPlayer.faction} 
               className="w-full h-full object-cover scale-125"
               referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="fantasy-font text-sm font-black md:text-base tracking-tight text-slate-100" style={{ color: theme.color }}>{currentPlayer.name}</span>
              <span className={`text-[8px] px-1 md:px-1.5 py-0.5 rounded border font-black uppercase tracking-wider ${currentPlayer.isAI ? 'bg-indigo-900/50 text-indigo-400 border-indigo-500/30' : 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30'}`}>
                {currentPlayer.isAI ? 'AI' : 'PLAYER'}
              </span>
            </div>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black leading-none">{currentPlayer.faction}</span>
          </div>
        </div>
        
        {/* Right: Resources & Action Beads + End Turn Button */}
        <div className="flex flex-wrap gap-3 items-center justify-center">
          
          {/* Resource Container */}
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-slate-900/50 border border-white/5 shadow-inner">
            
            {/* Actions Indicator Bead Representation */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Actions</span>
              <div className="flex items-center gap-1.5">
                {[1, 2].map((idx) => {
                  const active = currentPlayer.actionsRemaining >= idx;
                  return (
                    <div 
                      key={idx} 
                      className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                        active 
                          ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse' 
                          : 'bg-slate-800 border-white/10'
                      }`}
                      title={active ? "Action available" : "Action expended"}
                    />
                  );
                })}
              </div>
            </div>
            
            <div className="w-[1px] h-6 bg-white/10" />
            
            {/* Gold */}
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Gold</span>
              <span className="text-xs text-yellow-500 font-extrabold flex items-center gap-0.5">
                <Coins size={12} className="text-yellow-600" /> {currentPlayer.gold}
              </span>
            </div>
            
            <div className="w-[1px] h-6 bg-white/10" />
            
            {/* XP */}
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">XP</span>
              <span className="text-xs text-indigo-400 font-extrabold flex items-center gap-0.5">
                <Sparkles size={11} className="text-indigo-500" /> {currentPlayer.xp}
              </span>
            </div>
          </div>
          
          {/* End Turn prominent button */}
          <button 
            onClick={onEndTurn}
            disabled={!isMyTurn}
            className={`px-5 py-2 bg-red-600/90 hover:bg-red-500 border border-red-500/20 text-white rounded-xl shadow-md font-bold transition-all text-xs uppercase tracking-wider ${!isMyTurn ? 'opacity-40 cursor-not-allowed' : 'active:scale-95 shadow-red-500/10'}`}
          >
            End Turn
          </button>
        </div>
      </div>

      {/* 2. Unified 12 Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 w-full relative z-10">
        {Object.values(ActionType).map((actionType) => {
          const isFreeAction = freeProductionActions.includes(actionType);
          const cubes = currentPlayer.actionSlots[actionType] || 0;
          const cost = isFreeAction ? 0 : cubes * 2;
          const canAfford = currentPlayer.gold >= cost;
          
          let canAct = isMyTurn && (currentPlayer.actionsRemaining > 0 || isFreeAction) && canAfford;
          if (!isFreeAction && actionType === ActionType.PRODUCTION && currentPlayer.actionsRemaining < 2) canAct = false;

          const IconComponent = ACTION_ICONS[actionType] || Target;
          
          // Special Production Details
          let productionInfo = null;
          if (actionType === ActionType.PRODUCTION) {
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
              key={actionType}
              onClick={() => onAction(actionType)}
              disabled={!canAct}
              className={`relative p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all min-h-[75px] group select-none ${
                canAct 
                  ? isFreeAction 
                    ? 'bg-indigo-950/80 hover:bg-indigo-900 border-indigo-500/40 cursor-pointer animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.25)]' 
                    : 'bg-slate-900/90 hover:bg-slate-800/95 border-white/10 hover:border-amber-500/30 cursor-pointer' 
                  : 'bg-slate-950/40 border-white/5 opacity-40 cursor-not-allowed'
              }`}
              title={`${ACTION_DESCRIPTIONS[actionType]} (Cost: ${cost} Gold${actionType === ActionType.PRODUCTION ? ', Requires 2 Action Slots' : ''})`}
            >
              {/* Cost Overlay Badge */}
              {!isFreeAction && cost > 0 && (
                <div className="absolute top-1 right-1 px-1 py-0.5 rounded bg-red-950/90 border border-red-500/20 text-[7px] md:text-[8px] font-bold text-red-400">
                  {cost}g
                </div>
              )}
              {isFreeAction && (
                <div className="absolute top-1 right-1 px-1 py-0.5 rounded bg-indigo-950/90 border border-indigo-500/20 text-[7px] md:text-[8px] font-bold text-indigo-400 uppercase tracking-widest">
                  Free
                </div>
              )}

              {/* Action Cube / Board-Game Wood Bead Overlays */}
              {cubes > 0 && (
                <div className="absolute bottom-1 right-1.5 flex gap-0.5" title={`${cubes} action cube tokens placed here.`}>
                  {Array.from({ length: cubes }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm border border-amber-400"
                    />
                  ))}
                </div>
              )}

              {/* Top: Icon + Label */}
              <div className="flex flex-col items-center w-full mt-1.5 mb-1">
                <IconComponent 
                  size={16} 
                  className={`transition-transform group-hover:scale-110 mb-1.5 ${
                    canAct 
                      ? isFreeAction ? 'text-indigo-400' : 'text-amber-500' 
                      : 'text-slate-600'
                  }`} 
                />
                <span className="text-[9px] md:text-[10px] font-black text-slate-200 tracking-tight leading-none uppercase">
                  {ACTION_LABELS[actionType]}
                </span>
              </div>

              {/* Bottom Details/Projections */}
              {productionInfo ? (
                <div className="w-full flex flex-col items-center">
                  <div className="flex gap-1.5 items-center bg-black/45 px-2 py-0.5 rounded-md border border-white/5">
                    <span className="text-[8px] md:text-[9px] text-yellow-500 font-extrabold">+{productionInfo.gold}g</span>
                    <span className="text-[8px] md:text-[9px] text-blue-400 font-extrabold">+{productionInfo.xp}xp</span>
                  </div>
                  {productionInfo.goldLostToReduction > 0 && (
                    <div className="text-[6px] text-red-400/80 mt-0.5 font-bold italic truncate max-w-full">
                      -{productionInfo.goldLostToReduction}g Event
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-4.5 w-full">
                  {/* Empty spacer or generic subtext */}
                  <span className="text-[7.5px] text-slate-500 hidden sm:block group-hover:text-slate-400 transition-colors truncate max-w-full leading-none">
                    {ACTION_DESCRIPTIONS[actionType].slice(0, 15)}...
                  </span>
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
