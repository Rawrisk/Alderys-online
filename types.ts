
export const MAX_GOLD = 20;
export const MAX_XP = 10;

export enum TileType {
  INITIAL = 'INITIAL',
  PLAINS = 'PLAINS',
  MOUNTAIN = 'MOUNTAIN',
  LAKE = 'LAKE',
  ANCIENT_CITY = 'ANCIENT_CITY',
  DUNGEON_ENTRANCE = 'DUNGEON_ENTRANCE',
  BOSS = 'BOSS',
  PREVIEW = 'PREVIEW'
}

export enum ActionType {
  PRODUCTION = 'PRODUCTION',
  MOVE_1 = 'MOVE_1',
  MOVE_2 = 'MOVE_2',
  ADVENTURE = 'ADVENTURE',
  COMPLETE_QUEST = 'COMPLETE_QUEST',
  BUILD_CASTLE = 'BUILD_CASTLE',
  RECRUIT = 'RECRUIT',
  BUILD_MONUMENT = 'BUILD_MONUMENT',
  COMBAT = 'COMBAT',
  BUY_SKILL = 'BUY_SKILL',
  LEVEL_UP = 'LEVEL_UP',
  EXPLORE = 'EXPLORE'
}

export interface PlayerUnits {
  warriors: number;
  mages: number;
  knights: number;
  castles: number;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  isAI: boolean;
  score: number;
  gold: number;
  xp: number;
  availableUnits: PlayerUnits;
  deployedUnits: PlayerUnits;
  actionSlots: Record<ActionType, number>;
  actionsRemaining: number;
  skills: string[];
  passives: string[];
  quests: string[];
  capitalPosition: { q: number; r: number };
  secretQuest: Quest | null;
  questProgress: {
    monstersDefeated: number;
    level2MonstersDefeated: number;
    level3MonstersDefeated: number;
    enemyUnitsDefeated: number;
    adventuresCompleted: number;
    maxPvpDamage: number;
    maxPvpDefense: number;
    defeatedLevel3Unit: boolean;
  };
  unitTypeSkills: {
    warrior: (Skill | null)[];
    mage: (Skill | null)[];
    knight: (Skill | null)[];
  };
  unitLevels: {
    warrior: number;
    mage: number;
    knight: number;
  };
  initialSkillCount?: number;
  faction?: string;
  personality?: 'COMBAT' | 'CASTLES' | 'UNITS' | 'BALANCED';
  lastActionType?: ActionType | null;
  lastActions?: ActionType[];
  avoidHexes?: { q: number; r: number }[];
  aiStrategy?: {
    currentGoal: 'EXPANSION' | 'MILITARY' | 'QUESTING' | 'BOSS_RUSH' | 'VICTORY_POINTS';
    plannedActions: ActionType[];
    goalProgress: number;
    longTermTarget?: { q: number; r: number };
  };
  actionHistory?: { action: ActionType; round: number; success: boolean }[];
}

export interface Unit {
  id: string;
  playerId: number;
  type: 'warrior' | 'mage' | 'knight';
  q: number;
  r: number;
  hp: number;
  maxHp: number;
  isExhausted?: boolean;
  exhaustionRemainingTurns?: number;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  cost: number;
  costXP?: number;
  effect: string;
  type: 'MAGIC' | 'SWORD' | 'LUCKY' | 'DEFENSE' | 'RANGED' | 'ARMOR';
  isUnique?: boolean;
  tokens?: number;
}

export interface Building {
  id: string;
  playerId: number;
  type: 'capital' | 'castle';
  q: number;
  r: number;
}

export interface HexTile {
  q: number;
  r: number;
  type: TileType;
  isRevealed: boolean;
  castleSlots: number;
  productionGold: number;
  productionXP: number;
  hasAdventureMarker: boolean;
  hasAdvancedAdventureMarker: boolean;
  redLines?: number[];
  hasDungeonEntrance?: boolean;
  dungeonEntranceFaces?: number[];
  monsterLevel?: number;
  ownerId?: number;
}

export type MapMode = 'NORMAL' | 'ADJUSTED';

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  board: HexTile[];
  units: Unit[];
  buildings: Building[];
  logs: string[];
  isChroniclesVisible: boolean;
  isGameOver: boolean;
  isGameOverDismissed: boolean;
  gamePhase: 'SETUP_CAPITAL' | 'SETUP' | 'PLAYING' | 'EVENT' | 'COMBAT' | 'SKILL_DRAFT' | 'YEAR_END_QUESTS';
  gameMode: 'NORMAL' | 'SKILL_DRAFT' | 'MONSTERS_OUT';
  currentSeason: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
  currentYear: number;
  usedEvents: string[];
  activeYearlyEffects: string[];
  pendingEventChoices: Record<number, any>;
  isLowStart: boolean;
  isExplorationMode: boolean;
  mapMode: MapMode;
  skillDraftPool: {
    mages: Skill[];
    knights: Skill[];
  };
  skillDraftChoices: Record<number, { mage: Skill | null, knight: Skill | null }>;
  dungeonLevel: number;
  pendingMoves: number;
  movedUnitIds: string[];
  selectedUnitId: string | null;
  isBuildingCastle: boolean;
  isRecruiting: boolean;
  recruitingUnitType: 'warrior' | 'mage' | 'knight' | null;
  isSelectingCombatHex: boolean;
  combatState: CombatState | null;
  isBuyingSkill: boolean;
  selectedSkill: Skill | null;
  isSelectingSkillSlot: boolean;
  targetUnitId: string | null;
  targetUnitType: 'warrior' | 'mage' | 'knight' | null;
  isSelectingUnitTypeForSkill: boolean;
  currentAdventure: AdventureCard | null;
  isSelectingAdventureHex: boolean;
  isExploring: boolean;
  explorationCount: number;
  isFreeSkill: boolean;
  isCompletingQuest: boolean;
  publicQuests: Quest[];
  isSelectingInitialQuest: boolean;
  isSelectingAdvancedQuest: boolean;
  initialQuestChoices: Record<number, Quest[]>;
  advancedQuestChoices: Record<number, Quest[]>;
  isLevelingUp: boolean;
  availableLevel2Skills: Skill[];
  level2SkillDeck: Skill[];
  availableLevel3Skills: Skill[];
  level3SkillDeck: Skill[];
  advancedQuestDeck: Quest[];
  selectedBorderHex: { q: number; r: number } | null;
  gameStartTime: number;
  round: number;
  freeProductionActions: ActionType[];
  activeActionType: ActionType | null;
  isSelectingMonsterLevel: boolean;
  pendingCombatHex: { q: number; r: number } | null;
  freeSkillLevel: number | null;
  aiSpeed: number;
  isPaused: boolean;
  pauseOnAICombat: boolean;
  currentEvent: string | null;
  isSelectingEventHex: boolean;
  isSelectingFreeRecruitHex: boolean;
  freeRecruitType: 'warrior' | 'mage' | 'knight' | null;
  freeRecruitCount: number;
  isSeasonAdvancePending: boolean;
  actionSnapshot: {
    players: Player[];
    units: Unit[];
    buildings: Building[];
    freeProductionActions: ActionType[];
  } | null;
  aiInsights?: {
    actionSuccessRates: Record<ActionType, number>;
    preferredPersonalities: Record<string, number>;
  };
  yearEndQuestOrder: number[];
  yearEndQuestIndex: number;
}

export interface Quest {
  id: string;
  description: string;
  type: 'SPEND_GOLD' | 'SPEND_XP' | 'ADDED_SKILLS' | 'CASTLES' | 'ADVENTURES' | 'MONSTERS' | 'ENEMY_UNITS' | 'LEVEL_3_SKILLS' | 'PVP_LEVEL_3_UNIT' | 'UNIT_COMPOSITION' | 'PVP_DAMAGE' | 'CONTROL_HEXES' | 'PVP_DEFENSE' | 'UNITS_IN_OLD_CITY' | 'BUILD_CASTLES' | 'DEFEAT_MONSTERS';
  requirement: any;
  rewardVP: number;
}

export interface AdventureCard {
  title: string;
  story: string;
  options: AdventureOption[];
  isAdvanced: boolean;
  q: number;
  r: number;
}

export interface AdventureOption {
  label: string;
  type: 'GOLD' | 'XP' | 'SKILL';
  value: number | Skill;
  skill?: Skill;
}

export interface CombatRoll {
  type: string;
  value: number;
  unitId?: string | 'monster' | 'monster2' | 'monster3';
  purpose?: 'DAMAGE' | 'DEFENSE';
  isRerolled?: boolean;
  isRolling?: boolean;
}

export interface CombatState {
  attackerId: number;
  defenderId: number | 'monster' | 'monster2' | 'monster3';
  q: number;
  r: number;
  attackerUnits: Unit[];
  defenderUnits: Unit[];
  attackerRolls: CombatRoll[];
  defenderRolls: CombatRoll[];
  attackerTotalDamage: number;
  defenderTotalDamage: number;
  attackerTotalDefense: number;
  defenderTotalDefense: number;
  attackerRemainingDefense: number;
  defenderRemainingDefense: number;
  hasAnyRanged: boolean;
  logs: string[];
  isResolved: boolean;
  phase: 'INIT' | 'RANGED_REROLL' | 'RANGED_APPLY' | 'MELEE_REROLL' | 'MELEE_APPLY' | 'RESOLVED';
  monsterHp?: number;
  monsterIndex?: number;
  monsterAttackIndex?: number;
  attackerRerolls: number;
  defenderRerolls: number;
  channellingUnitIds?: string[];
  readyToChannelUnitIds?: string[];
  oozeSkillGranted?: boolean;
  pendingOozeSkillLevel?: number | null;
  goldGained?: number;
  xpGained?: number;
  defenderGoldGained?: number;
  defenderXpGained?: number;
  defeatedUnitNames?: string[];
  attackerDamageApplied: number;
  defenderDamageApplied: number;
  isRolling?: boolean;
}

export interface AIResponse {
  narration: string;
  outcome: {
    scoreChange: number;
    warriorsLost: number;
    item?: string;
  };
}

export interface HoverData {
  type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER';
  data: any;
  x: number;
  y: number;
}
