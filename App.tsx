
import React, { useState, useEffect, useCallback } from 'react';
import { TileType, Player, GameState, HexTile, ActionType, Unit, Building, CombatState, Skill, AdventureCard, AdventureOption, Quest, MapMode, CombatRoll, MAX_GOLD, MAX_XP } from './types';
import { MAX_UNITS, PLAYER_COLORS, DICE, UNIT_STATS, MONSTER_STATS, MONSTER_LEVEL_2_STATS, MONSTER_LEVEL_3_STATS, BOSS_STATS, SKILLS, INITIAL_QUESTS, ADVANCED_QUESTS, LEVEL_2_SKILLS, LEVEL_3_SKILLS, NORMAL_ADVENTURES, ADVANCED_ADVENTURES, YEAR_EVENTS, getDiceFromSkill } from './constants';
import GameBoard from './components/GameBoard';
import Sidebar from './components/Sidebar';
import ActionPanel from './components/ActionPanel';
import CombatModal from './components/CombatModal';
import SkillMarket from './components/SkillMarket';
import SkillSlotSelector from './components/SkillSlotSelector';
import UnitTypeSelector from './components/UnitTypeSelector';
import AdventureModal from './components/AdventureModal';
import QuestSelectionModal from './components/QuestSelectionModal';
import QuestMarket from './components/QuestMarket';
import LevelUpModal from './components/LevelUpModal';
import { MonsterLevelSelector } from './components/MonsterLevelSelector';
import Setup from './components/Setup';
import TutorialOverlay from './components/TutorialOverlay';
import SkillDraftModal from './components/SkillDraftModal';
import RuleBookModal from './components/RuleBookModal';
import Leaderboard from './components/Leaderboard';
import AssetManager from './components/AssetManager';
import Magnifier from './components/Magnifier';
import SeasonsTracker from './src/components/SeasonsTracker';
import EventModal from './src/components/EventModal';

import { io, Socket } from 'socket.io-client';
import { HoverData } from './types';

const socket: Socket = io();

const HEX_DIRECTIONS = [
  { dq: 0, dr: 1 }, { dq: -1, dr: 1 }, { dq: -1, dr: 0 },
  { dq: 0, dr: -1 }, { dq: 1, dr: -1 }, { dq: 1, dr: 0 }
];

const getNeighbors = (q: number, r: number): { q: number, r: number }[] => {
  return HEX_DIRECTIONS.map(dir => ({ q: q + dir.dq, r: r + dir.dr }));
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const App: React.FC = () => {
  const [rawGameState, setRawGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    board: [],
    units: [],
    buildings: [],
    logs: [`[Round 1 | 00:00:00] The Chronicles of Alderys begin...`],
    isGameOver: false,
    isGameOverDismissed: false,
    gamePhase: 'SETUP',
    currentEvent: null,
    currentSeason: 'SPRING',
    currentYear: 1,
    usedEvents: [],
    activeYearlyEffects: [],
    pendingEventChoices: {},
    dungeonLevel: 1,
    pendingMoves: 0,
    movedUnitIds: [],
    selectedUnitId: null,
    isBuildingCastle: false,
    isRecruiting: false,
    recruitingUnitType: null,
    isSelectingCombatHex: false,
    combatState: null,
    isBuyingSkill: false,
    selectedSkill: null,
    isSelectingSkillSlot: false,
    targetUnitId: null,
    targetUnitType: null,
    isSelectingUnitTypeForSkill: false,
    currentAdventure: null,
    isSelectingAdventureHex: false,
    isExploring: false,
    explorationCount: 0,
    isFreeSkill: false,
    isCompletingQuest: false,
    publicQuests: [],
    isSelectingInitialQuest: false,
    initialQuestChoices: {},
    isSelectingAdvancedQuest: false,
    advancedQuestChoices: {},
    isLevelingUp: false,
    availableLevel2Skills: [],
    level2SkillDeck: [],
    availableLevel3Skills: [],
    level3SkillDeck: [],
    advancedQuestDeck: [],
    selectedBorderHex: null,
    gameStartTime: Date.now(),
    round: 1,
    gameMode: 'NORMAL',
    isLowStart: false,
    isExplorationMode: false,
    isSelectingEventHex: false,
    isSelectingFreeRecruitHex: false,
    freeRecruitType: null,
    freeRecruitCount: 0,
    isSeasonAdvancePending: false,
    mapMode: 'NORMAL',
    skillDraftPool: { mages: [], knights: [] },
    skillDraftChoices: {},
    freeProductionActions: [],
    activeActionType: null,
    isSelectingMonsterLevel: false,
    pendingCombatHex: null,
    freeSkillLevel: null,
    aiSpeed: 1000,
    isPaused: false,
    pauseOnAICombat: false,
    isChroniclesVisible: true,
    actionSnapshot: null,
    yearEndQuestOrder: [],
    yearEndQuestIndex: 0
  });

  const [isAltPressed, setIsAltPressed] = useState(false);
  const [hoverData, setHoverData] = useState<HoverData | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleHover = (type: HoverData['type'], data: any, x: number, y: number) => {
    setHoverData({
      type,
      data,
      x,
      y
    });
  };

  const clearHover = () => {
    setHoverData(null);
  };

  const setGameState = useCallback((updater: React.SetStateAction<GameState>) => {
    setRawGameState(prev => {
      let next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      
      // Ensure gold and xp are within limits
      if (next.players) {
        const nextPlayers = next.players.map(p => ({
          ...p,
          gold: Math.min(MAX_GOLD, Math.max(0, p.gold)),
          xp: Math.min(MAX_XP, Math.max(0, p.xp))
        }));
        next = { ...next, players: nextPlayers };
      }

      const getTimeString = () => {
        const elapsed = Math.floor((Date.now() - prev.gameStartTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        return `Round ${prev.round} | ${timeStr}`;
      };

      if (next.logs && prev.logs && next.logs !== prev.logs && next.logs.length > prev.logs.length) {
        const newLogs = next.logs.slice(prev.logs.length).map(log => 
          log.match(/^\[\d{2}:\d{2}:\d{2}\]/) ? log : `[${getTimeString()}] ${log}`
        );
        next = { ...next, logs: [...prev.logs, ...newLogs] };
      }

      if (next.combatState && prev.combatState && next.combatState.logs && prev.combatState.logs && next.combatState.logs !== prev.combatState.logs && next.combatState.logs.length > prev.combatState.logs.length) {
        const newLogs = next.combatState.logs.slice(prev.combatState.logs.length).map(log => 
          log.match(/^\[\d{2}:\d{2}:\d{2}\]/) ? log : `[${getTimeString()}] ${log}`
        );
        next = { 
          ...next, 
          combatState: { ...next.combatState, logs: [...prev.combatState.logs, ...newLogs] } 
        };
      } else if (next.combatState && !prev.combatState && next.combatState.logs && next.combatState.logs.length > 0) {
        const newLogs = next.combatState.logs.map(log => 
          log.match(/^\[\d{2}:\d{2}:\d{2}\]/) ? log : `[${getTimeString()}] ${log}`
        );
        next = { 
          ...next, 
          combatState: { ...next.combatState, logs: newLogs } 
        };
      }

      return next;
    });
  }, []);

  const gameState = rawGameState;

  const [gameId, setGameId] = useState('default-game');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('gameId');
    if (!id) {
      id = Math.random().toString(36).substring(2, 9);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('gameId', id);
      window.history.replaceState({}, '', newUrl.toString());
    }
    setGameId(id);

    socket.on('game-state-sync', (newState: GameState) => {
      // Only sync if we are not the current player or if it's a major phase change
      setRawGameState(newState);
    });

    // Join the room
    socket.emit('join-game', id);

    return () => {
      socket.off('game-state-sync');
    };
  }, []);

  useEffect(() => {
    if (gameState.gamePhase === 'PLAYING') {
      socket.emit('game-state-update', {
        gameId: gameId,
        state: gameState
      });
    }
  }, [gameState, gameId]);

  const [activeTab, setActiveTab] = useState<'GAME' | 'STATS' | 'LOGS'>('GAME');
  const [showQuests, setShowQuests] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [intro, setIntro] = useState("Summon your banners...");
  const [isTutorialActive, setIsTutorialActive] = useState(false);

  const endTutorial = () => {
    setIsTutorialActive(false);
    setActiveTab('GAME');
    setShowQuests(false);
    setShowSkills(false);
    setShowRules(false);
    setRawGameState({
      players: [],
      currentPlayerIndex: 0,
      board: [],
      units: [],
      buildings: [],
      logs: [`[Round 1 | 00:00:00] The Chronicles of Alderys begin...`],
      isGameOver: false,
      isGameOverDismissed: false,
      gamePhase: 'SETUP',
      isLowStart: false,
      isExplorationMode: false,
      isSelectingEventHex: false,
      isSelectingFreeRecruitHex: false,
      freeRecruitType: null,
      freeRecruitCount: 0,
      isSeasonAdvancePending: false,
      currentEvent: null,
      currentSeason: 'SPRING',
      currentYear: 1,
      usedEvents: [],
      activeYearlyEffects: [],
      pendingEventChoices: {},
      dungeonLevel: 1,
      pendingMoves: 0,
      movedUnitIds: [],
      selectedUnitId: null,
      isBuildingCastle: false,
      isRecruiting: false,
      recruitingUnitType: null,
      isSelectingCombatHex: false,
      combatState: null,
      isBuyingSkill: false,
      selectedSkill: null,
      isSelectingSkillSlot: false,
      targetUnitId: null,
      targetUnitType: null,
      isSelectingUnitTypeForSkill: false,
      currentAdventure: null,
      isSelectingAdventureHex: false,
      isExploring: false,
      explorationCount: 0,
      isFreeSkill: false,
      isCompletingQuest: false,
      publicQuests: [],
      yearEndQuestOrder: [],
      yearEndQuestIndex: 0,
      isSelectingInitialQuest: false,
      initialQuestChoices: {},
      isSelectingAdvancedQuest: false,
      advancedQuestChoices: {},
      isLevelingUp: false,
      availableLevel2Skills: [],
      level2SkillDeck: [],
      availableLevel3Skills: [],
      level3SkillDeck: [],
      advancedQuestDeck: [],
      aiInsights: {
        actionSuccessRates: {} as Record<ActionType, number>,
        preferredPersonalities: {} as Record<string, number>
      },
      aiSpeed: 1000,
      isPaused: false,
      pauseOnAICombat: false,
      isChroniclesVisible: true,
      selectedBorderHex: null,
      gameStartTime: Date.now(),
      round: 1,
      gameMode: 'NORMAL',
      mapMode: 'NORMAL',
      skillDraftPool: { mages: [], knights: [] },
      skillDraftChoices: {},
      freeProductionActions: [],
      activeActionType: null,
      isSelectingMonsterLevel: false,
      pendingCombatHex: null,
      freeSkillLevel: null,
      actionSnapshot: null
    });
  };

  useEffect(() => {
    setIntro("Welcome to the ancient lands of Alderys, where factions compete for dominance and face the ultimate Boss.");
  }, []);

  const initBoard = (numPlayers: number, mapMode: MapMode = 'NORMAL', gameMode: 'NORMAL' | 'SKILL_DRAFT' | 'MONSTERS_OUT' = 'NORMAL', isExplorationMode: boolean = false): HexTile[] => {
    const getRing = (radius: number): { q: number, r: number }[] => {
      if (radius === 0) return [{ q: 0, r: 0 }];
      const coords = [];
      let q = radius;
      let r = -radius;
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < radius; j++) {
          coords.push({ q, r });
          q += HEX_DIRECTIONS[i].dq;
          r += HEX_DIRECTIONS[i].dr;
        }
      }
      return coords;
    };

    const allCoords: { q: number, r: number }[] = [];
    allCoords.push(...getRing(0));
    allCoords.push(...shuffleArray(getRing(1)));
    
    if (isExplorationMode) {
      const radius = numPlayers <= 2 ? 2 : 3;
      allCoords.push(...getRing(2));
      if (radius === 3) {
        allCoords.push(...getRing(3));
      }
    } else if (numPlayers === 2) {
      const ring2 = getRing(2);
      allCoords.push(...shuffleArray(ring2.filter((_, idx) => Math.floor(idx / 2) % 2 === 0)));
    } else if (numPlayers === 3) {
      allCoords.push(...shuffleArray(getRing(2)));
    } else if (numPlayers === 4) {
      allCoords.push(...shuffleArray(getRing(2)));
      const ring3 = getRing(3);
      allCoords.push(...shuffleArray(ring3.filter((_, idx) => Math.floor(idx / 3) % 2 === 0 && idx % 3 !== 0)));
    } else if (numPlayers === 5) {
      allCoords.push(...shuffleArray(getRing(2)));
      const ring3 = getRing(3);
      allCoords.push(...shuffleArray(ring3.filter((_, idx) => idx % 3 !== 0)));
    } else if (numPlayers >= 6) {
      allCoords.push(...shuffleArray(getRing(2)));
      allCoords.push(...shuffleArray(getRing(3)));
    }
    const finalCoords = allCoords;

    const pool: TileType[] = [];
    const numTilesNeeded = finalCoords.length - 1; // -1 for BOSS tile
    
    // Base tiles per player
    for (let i = 0; i < numPlayers; i++) {
      pool.push(TileType.PLAINS);
      pool.push(TileType.PLAINS);
      pool.push(TileType.MOUNTAIN);
      pool.push(TileType.LAKE);
    }
    // Special tiles
    for (let i = 0; i < numPlayers - 1; i++) {
      pool.push(TileType.DUNGEON_ENTRANCE);
      pool.push(TileType.ANCIENT_CITY);
    }
    // Fill remaining with Plains if needed
    while (pool.length < numTilesNeeded) {
      pool.push(TileType.PLAINS);
    }
    // If pool is too large (shouldn't happen with current logic but for safety), we'll just use what we need

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const placedTypes = new Map<string, TileType>();

    const tiles: HexTile[] = finalCoords.map(coord => {
      let type: TileType;
      if (coord.q === 0 && coord.r === 0) {
        type = TileType.BOSS;
      } else {
        const adjCounts = new Map<TileType, number>();
        for (const dir of HEX_DIRECTIONS) {
          const adjType = placedTypes.get(`${coord.q + dir.dq},${coord.r + dir.dr}`);
          if (adjType) {
            adjCounts.set(adjType, (adjCounts.get(adjType) || 0) + 1);
          }
        }

        let selectedIdx = -1;
        let minAdjCount = Infinity;
        
        const radius = (Math.abs(coord.q) + Math.abs(coord.q + coord.r) + Math.abs(coord.r)) / 2;
        const isTargetRadius = mapMode === 'ADJUSTED' && (numPlayers <= 4 ? radius === 1 : (radius === 1 || radius === 2));
        const specialTypes = [TileType.DUNGEON_ENTRANCE, TileType.ANCIENT_CITY];

        let filteredPoolIndices: number[] = [];
        if (mapMode === 'ADJUSTED') {
          if (isTargetRadius) {
            // Prefer special types if available in pool
            filteredPoolIndices = pool.map((t, i) => specialTypes.includes(t) ? i : -1).filter(i => i !== -1);
            if (filteredPoolIndices.length === 0) {
              filteredPoolIndices = pool.map((_, i) => i);
            }
          } else {
            // Avoid special types if possible
            filteredPoolIndices = pool.map((t, i) => !specialTypes.includes(t) ? i : -1).filter(i => i !== -1);
            if (filteredPoolIndices.length === 0) {
              filteredPoolIndices = pool.map((_, i) => i);
            }
          }
        } else {
          filteredPoolIndices = pool.map((_, i) => i);
        }

        // Shuffle indices to avoid picking the same types in the same order
        filteredPoolIndices = shuffleArray(filteredPoolIndices);

        for (const i of filteredPoolIndices) {
          const count = adjCounts.get(pool[i]) || 0;
          if (count === 0) {
            selectedIdx = i;
            break;
          }
          if (count < minAdjCount) {
            minAdjCount = count;
            selectedIdx = i;
          }
        }

        if (selectedIdx === -1 && filteredPoolIndices.length > 0) {
          selectedIdx = filteredPoolIndices[0];
        }

        type = pool.splice(selectedIdx, 1)[0];
      }
      placedTypes.set(`${coord.q},${coord.r}`, type);

      let castleSlots = 0;
      let productionGold = 0;
      let productionXP = 0;
      let hasAdventureMarker = false;
      let hasAdvancedAdventureMarker = false;

      if (type === TileType.PLAINS) {
        castleSlots = Math.random() > 0.5 ? 2 : 1;
        productionGold = Math.random() > 0.5 ? 3 : 2;
        hasAdventureMarker = Math.random() > 0.5;
      } else if (type === TileType.MOUNTAIN) {
        productionGold = 4;
        hasAdvancedAdventureMarker = Math.random() > 0.5;
      } else if (type === TileType.LAKE) {
        castleSlots = Math.random() > 0.5 ? 1 : 0;
        productionXP = 2;
        hasAdvancedAdventureMarker = Math.random() > 0.5;
      } else if (type === TileType.ANCIENT_CITY) {
        castleSlots = 0;
        productionGold = 0;
        productionXP = 0;
      } else if (type === TileType.DUNGEON_ENTRANCE) {
        castleSlots = 0;
      }

      let redLines: number[] = [];
      const faces = [0, 1, 2, 3, 4, 5];
      if (type === TileType.PLAINS) {
        redLines = [faces[Math.floor(Math.random() * faces.length)]];
      } else if (type === TileType.MOUNTAIN || type === TileType.LAKE) {
        let missing1 = Math.floor(Math.random() * 6);
        let missing2 = Math.floor(Math.random() * 6);
        while (missing1 === missing2 || Math.abs(missing1 - missing2) === 1 || Math.abs(missing1 - missing2) === 5) {
          missing2 = Math.floor(Math.random() * 6);
        }
        redLines = faces.filter(f => f !== missing1 && f !== missing2);
      }

      return {
        q: coord.q,
        r: coord.r,
        type,
        isRevealed: isExplorationMode ? (type === TileType.BOSS) : true,
        castleSlots,
        productionGold,
        productionXP,
        hasAdventureMarker,
        hasAdvancedAdventureMarker,
        redLines
      };
    });

    tiles.forEach(tile => {
      if (tile.type === TileType.DUNGEON_ENTRANCE) {
        const faceSets = [[0, 2, 4], [1, 3, 5]];
        const chosenFaces = faceSets[Math.floor(Math.random() * 2)];
        tile.dungeonEntranceFaces = chosenFaces;

        if (gameMode === 'MONSTERS_OUT' && !isExplorationMode) {
          const monsterLevels = shuffleArray([1, 2, 3]);
          chosenFaces.forEach((face, idx) => {
            const level = monsterLevels[idx];
            let found = false;
            
            // Try all 6 faces starting from the chosen one
            for (let fOffset = 0; fOffset < 6; fOffset++) {
              const currentFace = (face + fOffset) % 6;
              const dir = HEX_DIRECTIONS[currentFace];
              let adjQ = tile.q + dir.dq;
              let adjR = tile.r + dir.dr;
              let adjTile = tiles.find(t => t.q === adjQ && t.r === adjR);
              
              if (!adjTile) {
                // Opposite side of the map
                adjQ = -adjQ;
                adjR = -adjR;
                adjTile = tiles.find(t => t.q === adjQ && t.r === adjR);
              }

              if (adjTile && adjTile.type !== TileType.BOSS && adjTile.monsterLevel === undefined) {
                adjTile.monsterLevel = level;
                found = true;
                break;
              }
            }

            // Fallback: if no neighbor is available, find any tile that is not the boss and has no monster
            if (!found) {
              const fallbackTile = tiles.find(t => t.type !== TileType.BOSS && t.monsterLevel === undefined);
              if (fallbackTile) {
                fallbackTile.monsterLevel = level;
              }
            }
          });
        } else {
          chosenFaces.forEach(face => {
            const dir = HEX_DIRECTIONS[face];
            const adjQ = tile.q + dir.dq;
            const adjR = tile.r + dir.dr;
            const adjTile = tiles.find(t => t.q === adjQ && t.r === adjR);
            if (adjTile) {
              adjTile.hasDungeonEntrance = true;
            }
          });
        }
      }
    });

    return tiles;
  };

  const getRevealedBoardWithMonsters = (board: HexTile[], q: number, r: number, gameMode: string) => {
    let newBoard = [...board];
    const revealedDungeons: HexTile[] = [];

    newBoard = newBoard.map(tile => {
      if (tile.q === q && tile.r === r) {
        if (!tile.isRevealed && tile.type === TileType.DUNGEON_ENTRANCE && gameMode === 'MONSTERS_OUT') {
          revealedDungeons.push(tile);
        }
        return { ...tile, isRevealed: true };
      }
      const isNeighbor = HEX_DIRECTIONS.some(dir => (q + dir.dq) === tile.q && (r + dir.dr) === tile.r);
      
      if (isNeighbor) {
        if (!tile.isRevealed && tile.type === TileType.DUNGEON_ENTRANCE && gameMode === 'MONSTERS_OUT') {
          revealedDungeons.push(tile);
        }
        return { ...tile, isRevealed: true };
      }
      return tile;
    });

    // Spawn monsters for revealed dungeons
    revealedDungeons.forEach(dungeon => {
      const monsterLevels = shuffleArray([1, 2, 3]);
      const chosenFaces = dungeon.dungeonEntranceFaces || [];
      
      chosenFaces.forEach((face, idx) => {
        const level = monsterLevels[idx];
        let found = false;
        
        for (let fOffset = 0; fOffset < 6; fOffset++) {
          const currentFace = (face + fOffset) % 6;
          const dir = HEX_DIRECTIONS[currentFace];
          let adjQ = dungeon.q + dir.dq;
          let adjR = dungeon.r + dir.dr;
          let adjTileIdx = newBoard.findIndex(t => t.q === adjQ && t.r === adjR);
          
          if (adjTileIdx === -1) {
            adjQ = -adjQ;
            adjR = -adjR;
            adjTileIdx = newBoard.findIndex(t => t.q === adjQ && t.r === adjR);
          }

          if (adjTileIdx !== -1 && newBoard[adjTileIdx].type !== TileType.BOSS && newBoard[adjTileIdx].monsterLevel === undefined) {
            newBoard[adjTileIdx] = { ...newBoard[adjTileIdx], monsterLevel: level };
            found = true;
            break;
          }
        }

        if (!found) {
          const fallbackTileIdx = newBoard.findIndex(t => t.type !== TileType.BOSS && t.monsterLevel === undefined);
          if (fallbackTileIdx !== -1) {
            newBoard[fallbackTileIdx] = { ...newBoard[fallbackTileIdx], monsterLevel: level };
          }
        }
      });
    });

    return newBoard;
  };

  const startGame = (playerData: { name: string, isAI: boolean, faction: string }[], isTutorial: boolean = false, gameMode: 'NORMAL' | 'SKILL_DRAFT' | 'MONSTERS_OUT' = 'NORMAL', mapMode: MapMode = 'NORMAL', isLowStart: boolean = false, isExplorationMode: boolean = false) => {
    if (isTutorial) {
      setIsTutorialActive(true);
    }
    const shuffledPlayerData = [...playerData].sort(() => 0.5 - Math.random());
    const initialPlayers: Player[] = [];
    let initialUnits: Unit[] = [];
    let initialBuildings: Building[] = [];

    const uniqueQuests = Array.from(new Map(INITIAL_QUESTS.map(q => [q.id, q])).values());
    const shuffledQuests = [...uniqueQuests].sort(() => 0.5 - Math.random());
    const initialQuestChoices: Record<number, Quest[]> = {};

    shuffledPlayerData.forEach((p, idx) => {
      const pQuests = shuffledQuests.splice(0, 2);
      initialQuestChoices[idx] = pQuests;
      
      const initUnitTypeSkills = (type: 'warrior' | 'mage' | 'knight', faction: string) => {
        const stats = UNIT_STATS[type];
        let slots = stats.slots;
        if (faction === 'orc' && gameMode !== 'SKILL_DRAFT') {
          slots = type === 'mage' ? 2 : stats.slots - 1;
        }
        const skills: (Skill | null)[] = Array(slots).fill(null);
        
        // Add faction unique skills (Skip in SKILL_DRAFT and LOW_START mode)
        if (gameMode !== 'SKILL_DRAFT' && !isLowStart) {
          if (faction === 'elf') {
            if (type === 'mage') {
              skills[0] = (SKILLS as any).ELF_MAGE_UNIQUE;
            } else if (type === 'knight') {
              skills[0] = (SKILLS as any).ELF_KNIGHT_UNIQUE;
            }
          } else if (faction === 'orc') {
            if (type === 'mage') {
              skills[0] = (SKILLS as any).ORC_MAGE_UNIQUE;
              skills[1] = (SKILLS as any).MAGIC_1;
            } else if (type === 'knight') {
              skills[0] = (SKILLS as any).ORC_KNIGHT_UNIQUE;
            }
          } else if (faction === 'dwarf') {
            if (type === 'mage') {
              skills[0] = (SKILLS as any).DWARF_MAGE_UNIQUE;
            } else if (type === 'knight') {
              skills[0] = (SKILLS as any).DWARF_KNIGHT_UNIQUE;
            }
          } else if (faction === 'ooze') {
            if (type === 'mage') {
              skills[0] = { ...(SKILLS as any).OOZE_MAGE_UNIQUE };
            } else if (type === 'knight') {
              skills[0] = { ...(SKILLS as any).OOZE_KNIGHT_UNIQUE };
            }
          } else if (faction === 'flying') {
            if (type === 'mage') {
              skills[0] = (SKILLS as any).FLYING_MAGE_UNIQUE;
            } else if (type === 'knight') {
              skills[0] = (SKILLS as any).FLYING_KNIGHT_UNIQUE;
            }
          }
        }

        // Fill remaining initial skills
        let skillIdx = 0;
        if (gameMode !== 'SKILL_DRAFT' && !isLowStart) {
          skillIdx = (faction === 'elf' && (type === 'mage' || type === 'knight')) || 
                        (faction === 'orc' && type === 'knight') ||
                        (faction === 'dwarf' && (type === 'mage' || type === 'knight')) ||
                        (faction === 'ooze' && (type === 'mage' || type === 'knight')) ||
                        (faction === 'flying' && (type === 'mage' || type === 'knight')) ? 1 : 0;
          
          if (faction === 'orc' && type === 'mage') {
            skillIdx = 2;
          }
        }
        stats.initialSkills.forEach((skillId) => {
          if (skillIdx < slots) {
            skills[skillIdx] = (SKILLS as any)[skillId];
            skillIdx++;
          }
        });
        return skills;
      };

      initialPlayers.push({
        id: idx,
        name: p.name,
        color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
        isAI: p.isAI,
        faction: p.faction,
        score: 0,
        gold: [2, 4, 4, 6][idx] || 10,
        xp: [1, 1, 2, 2][idx] || 0,
        availableUnits: { 
          warriors: MAX_UNITS.warriors - 2,
          mages: MAX_UNITS.mages,
          knights: MAX_UNITS.knights,
          castles: MAX_UNITS.castles
        },
        deployedUnits: {
          warriors: 2,
          mages: 0,
          knights: 0,
          castles: 0
        },
        actionSlots: {
          [ActionType.PRODUCTION]: 0,
          [ActionType.MOVE_1]: 0,
          [ActionType.MOVE_2]: 0,
          [ActionType.ADVENTURE]: 0,
          [ActionType.EXPLORE]: 0,
          [ActionType.COMPLETE_QUEST]: 0,
          [ActionType.BUILD_CASTLE]: 0,
          [ActionType.RECRUIT]: 0,
          [ActionType.BUILD_MONUMENT]: 0,
          [ActionType.COMBAT]: 0,
          [ActionType.BUY_SKILL]: 0,
          [ActionType.LEVEL_UP]: 0
        },
        actionsRemaining: 2,
        skills: [],
        passives: p.faction === 'dwarf' && !isLowStart ? ['DWARF_PASSIVE'] : [],
        quests: [],
        capitalPosition: { q: 0, r: 0 }, // Will be set during SETUP_CAPITAL
        secretQuest: null,
        questProgress: {
          monstersDefeated: 0,
          level2MonstersDefeated: 0,
          level3MonstersDefeated: 0,
          enemyUnitsDefeated: 0,
          adventuresCompleted: 0,
          maxPvpDamage: 0,
          maxPvpDefense: 0,
          defeatedLevel3Unit: false
        },
        unitTypeSkills: {
          warrior: initUnitTypeSkills('warrior', p.faction),
          mage: initUnitTypeSkills('mage', p.faction),
          knight: initUnitTypeSkills('knight', p.faction)
        },
        unitLevels: {
          warrior: 1,
          mage: 1,
          knight: 1
        },
        initialSkillCount: initUnitTypeSkills('warrior', p.faction).filter(s => s !== null).length + 
                           initUnitTypeSkills('mage', p.faction).filter(s => s !== null).length + 
                           initUnitTypeSkills('knight', p.faction).filter(s => s !== null).length,
        personality: p.isAI ? (['COMBAT', 'CASTLES', 'UNITS', 'BALANCED'] as const)[Math.floor(Math.random() * 4)] : undefined,
        lastActionType: null,
        lastActions: [],
        avoidHexes: []
      });
    });

    const shuffledLevel2Skills = [...LEVEL_2_SKILLS].sort(() => 0.5 - Math.random());
    const availableLevel2Skills = shuffledLevel2Skills.splice(0, 4);
    const level2SkillDeck = shuffledLevel2Skills;

    const shuffledLevel3Skills = [...LEVEL_3_SKILLS].sort(() => 0.5 - Math.random());
    const availableLevel3Skills = shuffledLevel3Skills.splice(0, 4);
    const level3SkillDeck = shuffledLevel3Skills;

    const uniqueAdvanced = Array.from(new Map(ADVANCED_QUESTS.map(q => [q.id, q])).values());
    const advancedQuestDeck = [...uniqueAdvanced].sort(() => 0.5 - Math.random());

    const mageUniques = Object.values(SKILLS).filter((s: any) => s.isUnique && s.type === 'MAGIC');
    const knightUniques = Object.values(SKILLS).filter((s: any) => s.isUnique && (s.type === 'SWORD' || s.type === 'DEFENSE') && s.id !== 'DWARF_PASSIVE');

    const skillDraftPool = {
      mages: mageUniques as Skill[],
      knights: knightUniques as Skill[]
    };

    const skillDraftChoices: Record<number, { mage: Skill | null, knight: Skill | null }> = {};
    initialPlayers.forEach(p => {
      skillDraftChoices[p.id] = { mage: null, knight: null };
    });

    let board = initBoard(playerData.length, mapMode, gameMode, isExplorationMode);
    let gamePhase: 'SETUP_CAPITAL' | 'SKILL_DRAFT' | 'PLAYING' = gameMode === 'SKILL_DRAFT' ? 'SKILL_DRAFT' : 'SETUP_CAPITAL';

    if (isExplorationMode) {
      const radius = playerData.length <= 2 ? 2 : 3;
      const corners = [
        { q: radius, r: -radius },
        { q: -radius, r: radius },
        { q: 0, r: radius },
        { q: 0, r: -radius },
        { q: radius, r: 0 },
        { q: -radius, r: 0 }
      ];

      // Pick corners based on player count
      let selectedCorners: { q: number, r: number }[] = [];
      if (playerData.length === 2) {
        selectedCorners = [corners[0], corners[1]]; // Opposite
      } else if (playerData.length === 3) {
        selectedCorners = [corners[0], corners[1], corners[2]]; // Spread out
      } else {
        selectedCorners = corners.slice(0, playerData.length);
      }

      initialPlayers.forEach((p, idx) => {
        const corner = selectedCorners[idx];
        p.capitalPosition = corner;
        
        // Place capital building
        initialBuildings.push({
          id: `capital-${p.id}`,
          playerId: p.id,
          type: 'capital' as const,
          q: corner.q,
          r: corner.r
        });

        // Place initial units
        const stats = UNIT_STATS['warrior'];
        initialUnits.push(
          {
            id: `warrior-${p.id}-1`,
            playerId: p.id,
            type: 'warrior' as const,
            q: corner.q,
            r: corner.r,
            hp: stats.hp,
            maxHp: stats.hp
          },
          {
            id: `warrior-${p.id}-2`,
            playerId: p.id,
            type: 'warrior' as const,
            q: corner.q,
            r: corner.r,
            hp: stats.hp,
            maxHp: stats.hp
          }
        );

        // Update board: set tile to INITIAL and reveal it + neighbors
        board = board.map(t => {
          if (t.q === corner.q && t.r === corner.r) {
            return { ...t, type: TileType.INITIAL, isRevealed: true, productionGold: 2, productionXP: 1 };
          }
          return t;
        });
        board = getRevealedBoardWithMonsters(board, corner.q, corner.r, gameMode);
      });

      if (gameMode !== 'SKILL_DRAFT') {
        gamePhase = 'PLAYING';
      }
    }

    setGameState({
      ...gameState,
      players: initialPlayers,
      currentPlayerIndex: (gameMode === 'SKILL_DRAFT' || isExplorationMode) ? 0 : initialPlayers.length - 1,
      board,
      units: initialUnits,
      buildings: initialBuildings,
      gamePhase,
      gameMode,
      isLowStart,
      isExplorationMode,
      mapMode,
      skillDraftPool,
      skillDraftChoices,
      isSelectingInitialQuest: isExplorationMode && gameMode !== 'SKILL_DRAFT',
      initialQuestChoices,
      availableLevel2Skills,
      level2SkillDeck,
      availableLevel3Skills,
      level3SkillDeck,
      advancedQuestDeck,
      currentSeason: 'SPRING',
      currentYear: 1,
      usedEvents: [],
      activeYearlyEffects: [],
      pendingEventChoices: {},
      gameStartTime: Date.now(),
      round: 1,
      isGameOverDismissed: false,
      freeProductionActions: [],
      movedUnitIds: [],
      isSelectingEventHex: false,
      logs: [...gameState.logs, gameMode === 'SKILL_DRAFT' ? 'Skill Draft Mode active! Choose your unique skills.' : (isExplorationMode ? 'The adventure begins! Capitals have been placed in the corners.' : 'The adventure begins! Players must choose their capital locations.')]
    });
  };

  const endTurn = () => {
    setGameState(prev => {
      const currentPlayerId = prev.players[prev.currentPlayerIndex].id;
      const nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      const newRound = nextIndex === 0 ? prev.round + 1 : prev.round;
      const newPlayers = [...prev.players];
      newPlayers[nextIndex] = {
        ...newPlayers[nextIndex],
        actionsRemaining: 2
      };

      // Decrement exhaustion for current player's units
      const newUnits = prev.units.map(u => {
        if (u.playerId === currentPlayerId && u.isExhausted) {
          const remaining = (u.exhaustionRemainingTurns || 1) - 1;
          return {
            ...u,
            exhaustionRemainingTurns: remaining,
            isExhausted: remaining > 0
          };
        }
        return u;
      });

      let nextSeason = prev.currentSeason;
      let nextYear = prev.currentYear;
      let newActiveYearlyEffects = prev.activeYearlyEffects;
      let newLogs = [...prev.logs, `It is now ${newPlayers[nextIndex].name}'s turn.`];

      if (prev.isSeasonAdvancePending) {
        const seasons: ('SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER')[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
        const currentIndex = seasons.indexOf(prev.currentSeason);
        
        if (currentIndex === 3) { // End of Winter
          const order = [];
          for (let i = 0; i < prev.players.length; i++) {
            order.push(prev.players[(prev.currentPlayerIndex + i) % prev.players.length].id);
          }
          
          return {
            ...prev,
            gamePhase: 'YEAR_END_QUESTS',
            yearEndQuestOrder: order,
            yearEndQuestIndex: 0,
            currentPlayerIndex: prev.currentPlayerIndex, // Start with the player who finished production
            isSeasonAdvancePending: true, // Keep it true to advance after quests
            logs: [...prev.logs, "Year End: Each player may complete one quest, starting with the player who finished production."]
          };
        }

        const nextSeasonIndex = (currentIndex + 1) % 4;
        nextSeason = seasons[nextSeasonIndex];
        
        newLogs.push(`The season has changed to ${nextSeason}.`);
      }

      return {
        ...prev,
        currentPlayerIndex: nextIndex,
        round: newRound,
        players: newPlayers,
        units: newUnits,
        pendingMoves: 0,
        movedUnitIds: [],
        selectedUnitId: null,
        freeProductionActions: [],
        currentSeason: nextSeason,
        currentYear: nextYear,
        activeYearlyEffects: newActiveYearlyEffects,
        isSeasonAdvancePending: false,
        logs: newLogs
      };
    });
  };

  const getAncientCityVP = (playerId: number, board: HexTile[], units: Unit[], buildings: Building[]) => {
    const playerHexes = new Set<string>();
    units.filter(u => u.playerId === playerId).forEach(u => playerHexes.add(`${u.q},${u.r}`));
    buildings.filter(b => b.playerId === playerId).forEach(b => playerHexes.add(`${b.q},${b.r}`));
    
    let count = 0;
    playerHexes.forEach(hexStr => {
      const [q, r] = hexStr.split(',').map(Number);
      const tile = board.find(t => t.q === q && t.r === r);
      if (tile && tile.type === TileType.ANCIENT_CITY) {
        count++;
      }
    });
    return count;
  };

  const performAction = (actionType: ActionType) => {
    if (gameState.gamePhase !== 'PLAYING') return;

    // Capture snapshot before any changes to allow revert on cancel
    const actionSnapshot = {
      players: JSON.parse(JSON.stringify(gameState.players)),
      units: JSON.parse(JSON.stringify(gameState.units)),
      buildings: JSON.parse(JSON.stringify(gameState.buildings)),
      freeProductionActions: [...gameState.freeProductionActions]
    };
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (actionType === 'LEVEL_UP' as any) {
      setGameState(prev => ({
        ...prev,
        isLevelingUp: true,
        logs: [...prev.logs, `${currentPlayer.name} is leveling up a unit type.`]
      }));
      return;
    }

    const isFreeAction = gameState.freeProductionActions.includes(actionType);

    if (!isFreeAction && currentPlayer.actionsRemaining <= 0) return;

    if (!isFreeAction && actionType === ActionType.PRODUCTION && currentPlayer.actionsRemaining < 2) {
      setGameState(prev => ({
        ...prev,
        logs: [...prev.logs, `${currentPlayer.name} needs 2 actions to perform PRODUCTION.`]
      }));
      return;
    }

    const newPlayers = [...gameState.players];
    const p = { 
      ...newPlayers[gameState.currentPlayerIndex],
      actionSlots: { ...newPlayers[gameState.currentPlayerIndex].actionSlots },
      actionHistory: [...(newPlayers[gameState.currentPlayerIndex].actionHistory || [])]
    };
    newPlayers[gameState.currentPlayerIndex] = p;
    
    // Record action in history (initially assume success for simple actions)
    p.actionHistory.push({ action: actionType, round: gameState.round, success: true });
    
    const cubes = p.actionSlots[actionType];
    const cost = isFreeAction ? 0 : cubes * 2;
    if (p.gold < cost) {
      setGameState(prev => ({
        ...prev,
        logs: [...prev.logs, `${currentPlayer.name} needs ${cost} gold to perform ${actionType}.`]
      }));
      return;
    }

    if (!isFreeAction) {
      p.actionSlots[actionType] += 1;
      p.gold -= cost;
      p.lastActionType = actionType;
      if (!p.lastActions) p.lastActions = [];
      p.lastActions.push(actionType);
      if (p.lastActions.length > 2) {
        p.lastActions.shift();
      }
      
      if (actionType === ActionType.PRODUCTION) {
        p.actionsRemaining -= 2;
      } else {
        p.actionsRemaining -= 1;
      }
    }

    // Handle specific action logic here later
    let actionLog = isFreeAction ? `${p.name} performed a free ${actionType} after Production.` : `${p.name} performed ${actionType}.`;
    let newPendingMoves = 0;
    let newIsBuildingCastle = false;
    let newIsRecruiting = false;
    let newIsGameOver = false;
    let newFreeProductionActions = isFreeAction 
      ? gameState.freeProductionActions.filter(a => a !== actionType)
      : [...gameState.freeProductionActions];

    if (actionType === ActionType.PRODUCTION) {
        const playerHexes = new Set<string>();
        gameState.units.filter(u => u.playerId === p.id).forEach(u => playerHexes.add(`${u.q},${u.r}`));
        gameState.buildings.filter(b => b.playerId === p.id).forEach(b => playerHexes.add(`${b.q},${b.r}`));

        let producedGold = 0;
        let producedXP = 0;
        let goldLostToReduction = 0;

        const isLakeBonus = gameState.activeYearlyEffects.includes('LAKE_XP_BONUS');
        const isPlainsReduction = gameState.activeYearlyEffects.includes('PLAINS_GOLD_REDUCTION');

        playerHexes.forEach(hexStr => {
          const [hq, hr] = hexStr.split(',').map(Number);
          const tile = gameState.board.find(t => t.q === hq && t.r === hr);
          if (tile) {
            let gold = tile.productionGold;
            let xp = tile.productionXP;

            if (isPlainsReduction && tile.type === TileType.PLAINS) {
              const originalGold = gold;
              gold = Math.ceil(gold / 2);
              goldLostToReduction += (originalGold - gold);
            }
            if (isLakeBonus && tile.type === TileType.LAKE) {
              xp *= 2;
            }

            producedGold += gold;
            producedXP += xp;
          }
        });

        // Bonus gold for action tokens used
        let tokenBonus = 0;
        Object.values(p.actionSlots).forEach(count => {
          tokenBonus += (count as number);
        });
        producedGold += tokenBonus;

        p.gold += producedGold;
        p.xp += producedXP;

        // Reset all action slots
        Object.keys(p.actionSlots).forEach(key => {
          p.actionSlots[key as ActionType] = 0;
        });

        actionLog = `${p.name} performed PRODUCTION. Gained ${producedGold} gold (including ${tokenBonus} from tokens), ${producedXP} XP.${goldLostToReduction > 0 ? ` (${goldLostToReduction} less due to Plains Gold Reduction event)` : ''}`;
        newFreeProductionActions = [ActionType.BUY_SKILL, ActionType.COMPLETE_QUEST];
        
        if (p.isAI) {
          const newInsights = gameState.aiInsights ? { ...gameState.aiInsights } : {
            actionSuccessRates: {} as Record<ActionType, number>,
            preferredPersonalities: {} as Record<string, number>
          };
          const currentRate = newInsights.actionSuccessRates[ActionType.PRODUCTION] ?? 0.5;
          newInsights.actionSuccessRates[ActionType.PRODUCTION] = currentRate * 0.9 + 0.1;
          setGameState(prev => ({ ...prev, aiInsights: newInsights }));
        }

        // Advance Season (Pending until end turn)
        setGameState(prev => ({ ...prev, isSeasonAdvancePending: true }));
      } else if (actionType === ActionType.BUILD_MONUMENT) {
        if (p.gold >= 10 && p.xp >= 5) {
            p.gold -= 10;
            p.xp -= 5;
            p.score += 1;
            if (p.score + getAncientCityVP(p.id, gameState.board, gameState.units, gameState.buildings) >= 10) {
              newIsGameOver = true;
            }
            actionLog = `${p.name} built a monument! +1 Score.`;
            
            if (p.isAI) {
              const newInsights = gameState.aiInsights ? { ...gameState.aiInsights } : {
                actionSuccessRates: {} as Record<ActionType, number>,
                preferredPersonalities: {} as Record<string, number>
              };
              const currentRate = newInsights.actionSuccessRates[ActionType.BUILD_MONUMENT] ?? 0.5;
              newInsights.actionSuccessRates[ActionType.BUILD_MONUMENT] = currentRate * 0.9 + 0.1;
              setGameState(prev => ({ ...prev, aiInsights: newInsights }));
            }
        } else {
            // Revert action if not enough resources
            p.actionsRemaining += 1;
            actionLog = `${p.name} failed to build a monument (needs 10 gold, 5 XP).`;
        }
    } else if (actionType === ActionType.MOVE_1 || actionType === ActionType.MOVE_2) {
        newPendingMoves = 3;
        setGameState(prev => ({ ...prev, movedUnitIds: [] }));
        actionLog = `${p.name} is moving up to 3 units. Select a unit to move.`;
    } else if (actionType === ActionType.BUILD_CASTLE) {
        if (p.availableUnits.castles <= 0) {
            p.actionsRemaining += 1;
            actionLog = `${p.name} has no castles left to build.`;
        } else {
            newIsBuildingCastle = true;
            actionLog = `${p.name} is building a castle. Select a valid hex.`;
        }
    } else if (actionType === ActionType.RECRUIT) {
        newIsRecruiting = true;
        actionLog = `${p.name} is recruiting. Select a unit type.`;
    } else if (actionType === ActionType.COMBAT) {
        p.xp += 2;
        setGameState(prev => ({
            ...prev,
            players: newPlayers,
            isSelectingCombatHex: true,
            freeProductionActions: newFreeProductionActions,
            activeActionType: actionType,
            logs: [...prev.logs, `${p.name} is looking for a fight! Gained 2 XP. Select a hex with your units and enemies or a dungeon.`]
        }));
        return; // We handle the rest in handleHexClick
    } else if (actionType === ActionType.BUY_SKILL) {
        setGameState(prev => ({
            ...prev,
            players: newPlayers,
            isBuyingSkill: true,
            freeProductionActions: newFreeProductionActions,
            activeActionType: actionType,
            actionSnapshot: actionSnapshot,
            logs: [...prev.logs, `${p.name} is visiting the Skill Market.`]
        }));
        return;
    } else if (actionType === ActionType.ADVENTURE) {
        setGameState(prev => ({
            ...prev,
            players: newPlayers,
            isSelectingAdventureHex: true,
            freeProductionActions: newFreeProductionActions,
            activeActionType: actionType,
            actionSnapshot: actionSnapshot,
            logs: [...prev.logs, `${p.name} is looking for adventure! Select a hex with an adventure marker (?) where you have units.`]
        }));
        return;
    } else if (actionType === ActionType.EXPLORE) {
        if (!gameState.isExplorationMode) {
            p.actionsRemaining += 1;
            actionLog = `${p.name} tried to explore, but Exploration Mode is not active.`;
        } else {
            setGameState(prev => ({
                ...prev,
                players: newPlayers,
                isExploring: true,
                explorationCount: 2,
                freeProductionActions: newFreeProductionActions,
                activeActionType: actionType,
                actionSnapshot: actionSnapshot,
                logs: [...prev.logs, `${p.name} is exploring! Select 2 unrevealed hexes adjacent to your units or castles to reveal them.`]
            }));
            return;
        }
    } else if (actionType === ActionType.COMPLETE_QUEST) {
        setGameState(prev => ({
            ...prev,
            players: newPlayers,
            isCompletingQuest: true,
            freeProductionActions: newFreeProductionActions,
            activeActionType: actionType,
            actionSnapshot: actionSnapshot,
            logs: [...prev.logs, `${p.name} is attempting to complete a quest.`]
        }));
        return;
    }

    setGameState(prev => ({
      ...prev,
      players: newPlayers,
      pendingMoves: newPendingMoves,
      selectedUnitId: null,
      isBuildingCastle: newIsBuildingCastle,
      isRecruiting: newIsRecruiting,
      recruitingUnitType: null,
      isGameOver: newIsGameOver,
      freeProductionActions: newFreeProductionActions,
      activeActionType: actionType,
      actionSnapshot: actionSnapshot,
      logs: [...prev.logs, actionLog]
    }));
  };

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [savedGames, setSavedGames] = useState<{ id: string, player_name: string, created_at: string, state?: GameState }[]>([]);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const fetchSavedGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const data = await response.json();
        setSavedGames(data);
        setShowLoadModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch saved games:', error);
    }
  };

  const loadGameById = async (id: string) => {
    try {
      const response = await fetch(`/api/games/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRawGameState(data.state);
        setShowLoadModal(false);
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  };

  // Save score to leaderboard when game ends
  useEffect(() => {
    if (rawGameState.isGameOver) {
      const winner = rawGameState.players.reduce((prev, current) => (prev.score > current.score) ? prev : current);
      const saveScore = async () => {
        try {
          await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: winner.name, score: winner.score })
          });
        } catch (error) {
          console.error('Failed to save score:', error);
        }
      };
      saveScore();
    }
  }, [rawGameState.isGameOver]);

  const saveGame = async () => {
    try {
      const playerName = rawGameState.players[rawGameState.currentPlayerIndex].name;
      const response = await fetch('/api/games/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, state: rawGameState })
      });
      if (response.ok) {
        setRawGameState(prev => ({ ...prev, logs: [...prev.logs, `Game saved successfully for ${playerName}.`] }));
      } else {
        throw new Error('Failed to save game');
      }
    } catch (error) {
      console.error('Failed to save game:', error);
      throw error;
    }
  };

  const goToMainMenu = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'SETUP' }));
  };

  const handleEventChoice = (choice: any) => {
    setGameState(prev => {
      const newPlayers = [...prev.players];
      const pIndex = newPlayers.findIndex(p => p.id === prev.currentPlayerIndex + 1); // This is wrong, currentPlayerIndex is 0-based index
      // Actually, pendingEventChoices is keyed by player.id
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      const newPendingChoices = { ...prev.pendingEventChoices };
      
      if (choice.type === 'COMPLETE_EVENT_CHOICE') {
        const p = currentPlayer;
        newPendingChoices[p.id] = { ...newPendingChoices[p.id], completed: true };
        
        const allCompleted = Object.values(newPendingChoices).every((c: any) => c.completed);
        
        if (allCompleted) {
          const seasons: ('SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER')[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
          const currentIndex = seasons.indexOf(prev.currentSeason);
          const nextSeasonIndex = (currentIndex + 1) % 4;
          const nextSeason = seasons[nextSeasonIndex];
          const nextYear = prev.currentYear + 1;

          return {
            ...prev,
            pendingEventChoices: newPendingChoices,
            gamePhase: 'PLAYING',
            currentSeason: nextSeason,
            currentYear: nextYear,
            isSeasonAdvancePending: false,
            currentPlayerIndex: 0,
            currentEvent: null,
            logs: [...prev.logs, `Winter has ended. A new year begins! Year ${nextYear}.`]
          };
        }

        return {
          ...prev,
          pendingEventChoices: newPendingChoices,
          gamePhase: 'EVENT',
          currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
          currentEvent: prev.currentEvent,
        };
      }

      if (choice.type === 'FREE_RECRUIT') {
        const p = { ...currentPlayer };
        const unitType = choice.unitType as 'warrior' | 'mage' | 'knight';
        const count = unitType === 'warrior' ? 2 : 1;
        
        if (p.isAI) {
          // Check limits
          const currentCount = prev.units.filter(u => u.playerId === p.id && u.type === unitType).length;
          const limit = UNIT_STATS[unitType].slots;
          const canAdd = Math.min(count, limit - currentCount);
          
          const newUnits = [...prev.units];
          for (let i = 0; i < canAdd; i++) {
            newUnits.push({
              id: `unit-${Date.now()}-${Math.random()}`,
              playerId: p.id,
              type: unitType,
              q: p.capitalPosition.q,
              r: p.capitalPosition.r,
              isExhausted: false,
              hp: UNIT_STATS[unitType].hp,
              maxHp: UNIT_STATS[unitType].hp
            });
          }
          
          newPendingChoices[p.id] = { ...newPendingChoices[p.id], completed: true };
          
          const allCompleted = Object.values(newPendingChoices).every((c: any) => c.completed);
          
          if (allCompleted) {
            const seasons: ('SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER')[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
            const currentIndex = seasons.indexOf(prev.currentSeason);
            const nextSeasonIndex = (currentIndex + 1) % 4;
            const nextSeason = seasons[nextSeasonIndex];
            const nextYear = prev.currentYear + 1;

            return {
              ...prev,
              units: newUnits,
              pendingEventChoices: newPendingChoices,
              gamePhase: 'PLAYING',
              currentSeason: nextSeason,
              currentYear: nextYear,
              isSeasonAdvancePending: false,
              currentPlayerIndex: 0,
              currentEvent: null,
              logs: [...prev.logs, `${p.name} recruited ${canAdd} ${unitType}(s) for free.`, `Winter has ended. A new year begins! Year ${nextYear}.`]
            };
          }

          return {
            ...prev,
            units: newUnits,
            pendingEventChoices: newPendingChoices,
            gamePhase: 'EVENT',
            currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
            currentEvent: prev.currentEvent,
            logs: [...prev.logs, `${p.name} recruited ${canAdd} ${unitType}(s) for free.`]
          };
        } else {
          // Human player: start selection phase
          return {
            ...prev,
            isSelectingFreeRecruitHex: true,
            freeRecruitType: unitType,
            freeRecruitCount: count,
            logs: [...prev.logs, `${p.name} chose to recruit ${count} ${unitType}(s). Select a hex with your capital or a castle to place them.`]
          };
        }
      }

      if (choice.type === 'FREE_SKILL') {
        const p = { ...currentPlayer };
        const skill = choice.skill as Skill;
        
        return {
          ...prev,
          isBuyingSkill: true,
          isFreeSkill: true,
          freeSkillLevel: skill.level,
          selectedSkill: skill,
          isSelectingUnitTypeForSkill: true,
          // Keep gamePhase as EVENT to ensure handleApplySkill knows it's an event
          logs: [...prev.logs, `${p.name} is applying their free skill: ${skill.name}.`]
        };
      }

      if (choice.type === 'START_HEX_SELECTION') {
        return {
          ...prev,
          isSelectingEventHex: true
        };
      }

      if (choice.type === 'DUNGEON_ATTACK') {
        const p = { ...currentPlayer };
        const { q, r, unitDamages } = choice;
        
        // If we have unitDamages, apply them directly
        if (unitDamages) {
          const newUnits = prev.units.map(u => {
            const damage = unitDamages[u.id] || 0;
            if (damage > 0) {
              return { ...u, hp: Math.max(0, u.hp - damage) };
            }
            return u;
          }).filter(u => u.hp > 0);

          const newPendingChoices = { ...prev.pendingEventChoices };
          newPendingChoices[p.id] = { ...newPendingChoices[p.id], completed: true };
          const allCompleted = Object.values(newPendingChoices).every((c: any) => c.completed);

          if (allCompleted) {
            const seasons: ('SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER')[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
            const currentIndex = seasons.indexOf(prev.currentSeason);
            const nextSeasonIndex = (currentIndex + 1) % 4;
            const nextSeason = seasons[nextSeasonIndex];
            const nextYear = prev.currentYear + 1;

            return {
              ...prev,
              units: newUnits,
              pendingEventChoices: newPendingChoices,
              gamePhase: 'PLAYING',
              currentSeason: nextSeason,
              currentYear: nextYear,
              isSeasonAdvancePending: false,
              currentPlayerIndex: 0,
              currentEvent: null,
              isSelectingEventHex: false,
              logs: [...prev.logs, `${p.name} applied damage to their units.`, `Winter has ended. A new year begins! Year ${nextYear}.`]
            };
          }

          return {
            ...prev,
            units: newUnits,
            pendingEventChoices: newPendingChoices,
            gamePhase: 'EVENT',
            currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
            currentEvent: prev.currentEvent,
            isSelectingEventHex: false,
            logs: [...prev.logs, `${p.name} applied damage to their units.`]
          };
        }

        // This part is for AI or direct application if no unitDamages provided
        if (q !== undefined && r !== undefined) {
          const playerUnits = prev.units.filter(u => u.playerId === p.id && u.q === q && u.r === r);
          const pendingChoice = prev.pendingEventChoices[p.id];
          const monsterRolls = pendingChoice.monsterRolls || [];
          
          let totalDamage = monsterRolls.reduce((sum: number, r: any) => sum + Math.max(0, r.value), 0);
          
          let totalDefense = 0;
          playerUnits.forEach(u => {
            const uStats = UNIT_STATS[u.type];
            for (let i = 0; i < uStats.dice.defense; i++) {
              let def = rollDice('DEFENSE');
              if (prev.activeYearlyEffects.includes('DEFENSE_DICE_BONUS')) def *= 2;
              totalDefense += def;
            }
          });

          const finalDamage = Math.max(0, totalDamage - totalDefense);
          
          const newPendingChoices = { ...prev.pendingEventChoices };
          newPendingChoices[p.id] = { 
            ...newPendingChoices[p.id], 
            selectedHex: { q, r },
            hexUnits: playerUnits,
            totalDamage,
            totalDefense,
            finalDamage
          };

          return {
            ...prev,
            pendingEventChoices: newPendingChoices,
            isSelectingEventHex: false
          };
        }
        return prev;
      }

      if (choice.type === 'CONTINUE' || choice.type === 'SKIP') {
        const p = { ...currentPlayer };
        newPendingChoices[p.id] = { ...newPendingChoices[p.id], completed: true };
        const allCompleted = Object.values(newPendingChoices).every((c: any) => c.completed);

        if (allCompleted) {
          const seasons: ('SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER')[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
          const currentIndex = seasons.indexOf(prev.currentSeason);
          const nextSeasonIndex = (currentIndex + 1) % 4;
          const nextSeason = seasons[nextSeasonIndex];
          const nextYear = prev.currentYear + 1;

          return {
            ...prev,
            pendingEventChoices: newPendingChoices,
            gamePhase: 'PLAYING',
            currentSeason: nextSeason,
            currentYear: nextYear,
            isSeasonAdvancePending: false,
            currentPlayerIndex: 0,
            currentEvent: null,
            logs: [...prev.logs, choice.type === 'SKIP' ? `${p.name} skipped their event choice.` : `${p.name} acknowledged the event.`, `Winter has ended. A new year begins! Year ${nextYear}.`]
          };
        }

        return {
          ...prev,
          pendingEventChoices: newPendingChoices,
          gamePhase: 'EVENT',
          currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
          currentEvent: prev.currentEvent,
          logs: [...prev.logs, choice.type === 'SKIP' ? `${p.name} skipped their event choice.` : `${p.name} acknowledged the event.`]
        };
      }

      return prev;
    });
  };
  const handleFinishMoves = () => {
    setGameState(prev => ({
      ...prev,
      pendingMoves: 0,
      movedUnitIds: [],
      selectedUnitId: null,
      activeActionType: null,
      actionSnapshot: null,
      logs: [...prev.logs, `${prev.players[prev.currentPlayerIndex].name} finished moving.`]
    }));
  };

  const handleSkillDraftComplete = (mageSkill: Skill, knightSkill: Skill) => {
    setGameState(prev => {
      const newPlayers = [...prev.players];
      const p = { ...newPlayers[prev.currentPlayerIndex] };
      
      const newMageSkills = [...p.unitTypeSkills.mage];
      const newKnightSkills = [...p.unitTypeSkills.knight];
      
      if (newMageSkills[0] === null) newMageSkills[0] = mageSkill;
      else newMageSkills.unshift(mageSkill);
      
      if (newKnightSkills[0] === null) newKnightSkills[0] = knightSkill;
      else newKnightSkills.unshift(knightSkill);

      const isOrc = p.faction === 'orc';
      const hasOrcWarCry = mageSkill.id === 'ORC_MAGE_UNIQUE';
      const mageSlots = (isOrc || hasOrcWarCry) ? 2 : UNIT_STATS.mage.slots;
      const knightSlots = isOrc ? UNIT_STATS.knight.slots - 1 : UNIT_STATS.knight.slots;
      const warriorSlots = isOrc ? UNIT_STATS.warrior.slots - 1 : UNIT_STATS.warrior.slots;

      p.unitTypeSkills = {
        ...p.unitTypeSkills,
        warrior: p.unitTypeSkills.warrior.slice(0, warriorSlots),
        mage: newMageSkills.slice(0, mageSlots),
        knight: newKnightSkills.slice(0, knightSlots)
      };

      newPlayers[prev.currentPlayerIndex] = p;

      const nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      const allDrafted = nextIndex === 0;

      return {
        ...prev,
        players: newPlayers,
        currentPlayerIndex: allDrafted ? (prev.isExplorationMode ? 0 : prev.players.length - 1) : nextIndex,
        gamePhase: allDrafted ? (prev.isExplorationMode ? 'PLAYING' : 'SETUP_CAPITAL') : 'SKILL_DRAFT',
        isSelectingInitialQuest: allDrafted && prev.isExplorationMode,
        logs: [...prev.logs, `${p.name} drafted ${mageSkill.name} and ${knightSkill.name}.`]
      };
    });
  };

  const handleUnitClick = (unitId: string) => {
    if (gameState.pendingMoves <= 0) return;
    const unit = gameState.units.find(u => u.id === unitId);
    if (!unit || unit.playerId !== gameState.players[gameState.currentPlayerIndex].id) return;
    
    if (gameState.movedUnitIds.includes(unitId)) {
      setGameState(prev => ({ ...prev, logs: [...prev.logs, "This unit has already moved in this action."] }));
      return;
    }

    if (unit.isExhausted) {
      setGameState(prev => ({ ...prev, logs: [...prev.logs, "This unit is exhausted and cannot move."] }));
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      selectedUnitId: unitId
    }));
  };

  const getHexDistance = (q1: number, r1: number, q2: number, r2: number): number => {
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
  };

  const getAllOutsideNeighbors = (q: number, r: number, board: HexTile[]): { q: number, r: number }[] => {
    const neighbors = [
      { dq: 1, dr: -1 }, { dq: 1, dr: 0 }, { dq: 0, dr: 1 },
      { dq: -1, dr: 1 }, { dq: -1, dr: 0 }, { dq: 0, dr: -1 }
    ];
    
    return neighbors.map(n => ({ q: q + n.dq, r: r + n.dr }))
      .filter(pos => !board.some(t => t.q === pos.q && t.r === pos.r && t.type !== TileType.PREVIEW));
  };

  const getHexDirection = (dq: number, dr: number): number => {
    if (dq === 1 && dr === -1) return 0;
    if (dq === 1 && dr === 0) return 1;
    if (dq === 0 && dr === 1) return 2;
    if (dq === -1 && dr === 1) return 3;
    if (dq === -1 && dr === 0) return 4;
    if (dq === 0 && dr === -1) return 5;
    return -1;
  };

  const getMoveCost = (fromQ: number, fromR: number, toQ: number, toR: number, board: HexTile[], skills?: Skill[], passives?: string[]): number => {
    const dir = getHexDirection(toQ - fromQ, toR - fromR);
    if (dir === -1) return Infinity;
    const oppDir = (dir + 3) % 6;
    const fromTile = board.find(t => t.q === fromQ && t.r === fromR);
    const toTile = board.find(t => t.q === toQ && t.r === toR);
    let cost = 1;
    if (fromTile?.redLines?.includes(dir) || toTile?.redLines?.includes(oppDir)) {
      if (skills?.some(s => s.id === 'DWARF_PASSIVE') || passives?.includes('DWARF_PASSIVE')) {
        cost = 1;
      } else {
        cost = 2;
      }
    }
    return cost;
  };

  const isHexStuck = (q: number, r: number, board: HexTile[], passives?: string[]): boolean => {
    const neighbors = [
      { dq: 1, dr: -1 }, { dq: 1, dr: 0 }, { dq: 0, dr: 1 },
      { dq: -1, dr: 1 }, { dq: -1, dr: 0 }, { dq: 0, dr: -1 }
    ];
    
    // A temporary tile for the capital (which has no red lines)
    const tempCapitalTile: HexTile = {
      q,
      r,
      type: TileType.INITIAL,
      isRevealed: true,
      castleSlots: 0,
      productionGold: 2,
      productionXP: 1,
      hasAdventureMarker: false,
      hasAdvancedAdventureMarker: false,
      redLines: []
    };
    const tempBoard = [...board, tempCapitalTile];

    const reachableNeighbors = neighbors
      .map(n => ({ q: q + n.dq, r: r + n.dr }))
      .filter(nPos => board.some(t => t.q === nPos.q && t.r === nPos.r))
      .filter(nPos => getMoveCost(q, r, nPos.q, nPos.r, tempBoard, undefined, passives) < 2);

    return reachableNeighbors.length === 0;
  };

  const calculateMaxRange = (type: 'warrior' | 'mage' | 'knight', level: number, faction?: string): number => {
    let maxRange = UNIT_STATS[type].move;
    if (type === 'warrior' && level === 2) maxRange = 2;
    if (type === 'mage' && level === 2) maxRange = 2;
    if (type === 'mage' && level === 3) {
      maxRange = faction === 'dwarf' ? 2 : 3;
    }
    if (type === 'knight' && level === 2) maxRange = 3;
    if (type === 'knight' && level === 3) {
      maxRange = faction === 'dwarf' ? 3 : 4;
    }
    return maxRange;
  };

  // Year End Event Trigger
  // Removed: now triggered at end of YEAR_END_QUESTS phase

  useEffect(() => {
    if (gameState.gamePhase === 'EVENT' && gameState.currentEvent) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const pendingChoice = gameState.pendingEventChoices[currentPlayer.id];
      
      if (currentPlayer.isAI && pendingChoice && !pendingChoice.completed) {
        // Simple AI logic for events
        if (pendingChoice.type === 'FREE_RECRUIT') {
          handleEventChoice({ type: 'FREE_RECRUIT', unitType: 'warrior' });
        } else if (pendingChoice.type === 'FREE_SKILL') {
          const available = pendingChoice.level3Allowed ? [...gameState.availableLevel3Skills, ...gameState.availableLevel2Skills] : gameState.availableLevel2Skills;
          if (available.length > 0) {
            handleEventChoice({ type: 'FREE_SKILL', skill: available[0] });
          } else {
            handleEventChoice({ type: 'SKIP' });
          }
        } else if (pendingChoice.type === 'DUNGEON_ATTACK') {
          // AI picks a random valid hex
          const validHexes = gameState.board.filter(tile => {
            const neighbors = getNeighbors(tile.q, tile.r);
            const isAdjacentToDungeon = neighbors.some(n => 
              gameState.board.find(t => t.q === n.q && t.r === n.r && t.hasDungeonEntrance)
            );
            const hasUnits = gameState.units.some(u => u.playerId === currentPlayer.id && u.q === tile.q && u.r === tile.r);
            return isAdjacentToDungeon && hasUnits;
          });

          if (validHexes.length > 0) {
            // For AI, we need to make sure isSelectingEventHex is true so handleHexClick works, 
            // or just call handleEventChoice directly with q and r.
            // Calling handleEventChoice directly is better for AI.
            handleEventChoice({ type: 'DUNGEON_ATTACK', q: validHexes[0].q, r: validHexes[0].r });
          } else {
            handleEventChoice({ type: 'SKIP' });
          }
        }
      }
    }
  }, [gameState.gamePhase, gameState.currentPlayerIndex, gameState.currentEvent]);

  const getYearEndEventState = (prev: GameState) => {
    let availableEvents = YEAR_EVENTS.filter(e => !prev.usedEvents.includes(e.id));
    if (availableEvents.length === 0) {
      availableEvents = YEAR_EVENTS;
    }
    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    const newUsedEvents = [...prev.usedEvents, event.id];
    
    let nextPhase: GameState['gamePhase'] = 'EVENT';
    let activeYearlyEffects: string[] = [];
    let pendingEventChoices: Record<number, any> = {};
    let newBoard = [...prev.board];
    let newUnits = [...prev.units];
    let newLogs = [...prev.logs, `YEAR END EVENT: ${event.title}`];

    if (event.id === 'DUNGEON_SPAWN') {
      const anyPlayerHas5VP = prev.players.some(p => p.score >= 5);
      const monsterLevel = anyPlayerHas5VP ? 3 : 2;
      newBoard = prev.board.map(tile => {
        if (tile.hasDungeonEntrance && !tile.monsterLevel) {
          return { ...tile, monsterLevel };
        }
        return tile;
      });
      newLogs.push(`Monsters have emerged from the dungeons! Level ${monsterLevel} monsters spawned.`);
      prev.players.forEach(p => {
        pendingEventChoices[p.id] = { type: 'INFO', completed: false };
      });
    } else if (event.id === 'FREE_RECRUIT') {
      prev.players.forEach(p => {
        const canRecruitWarrior = prev.units.filter(u => u.playerId === p.id && u.type === 'warrior').length < UNIT_STATS['warrior'].slots;
        const canRecruitMage = prev.units.filter(u => u.playerId === p.id && u.type === 'mage').length < UNIT_STATS['mage'].slots;
        const canRecruitKnight = prev.units.filter(u => u.playerId === p.id && u.type === 'knight').length < UNIT_STATS['knight'].slots;
        
        if (canRecruitWarrior || canRecruitMage || canRecruitKnight) {
          pendingEventChoices[p.id] = { type: 'FREE_RECRUIT', completed: false };
        } else {
          pendingEventChoices[p.id] = { type: 'INFO', message: "You have reached your unit limits and cannot recruit any more units.", completed: false };
        }
      });
    } else if (event.id === 'DUNGEON_ATTACK') {
      const anyPlayerHas6VP = prev.players.some(p => p.score >= 6);
      const monsterLevel = anyPlayerHas6VP ? 3 : 2;
      
      // Roll damage once for the event
      const stats = (monsterLevel === 3 ? MONSTER_LEVEL_3_STATS : MONSTER_LEVEL_2_STATS)[0];
      const attackOption = stats.attackOptions[Math.floor(Math.random() * stats.attackOptions.length)];
      
      const monsterRolls: { type: string, value: number }[] = [];
      if (attackOption.MELEE) {
        for (let i = 0; i < attackOption.MELEE; i++) {
          monsterRolls.push({ type: 'MELEE', value: rollDice('MELEE') });
        }
      }
      if (attackOption.MANA) {
        for (let i = 0; i < attackOption.MANA; i++) {
          monsterRolls.push({ type: 'MANA', value: rollDice('MANA') });
        }
      }
      if (attackOption.RANGED_MANA) {
        for (let i = 0; i < attackOption.RANGED_MANA; i++) {
          monsterRolls.push({ type: 'MANA', value: rollDice('MANA') });
        }
      }

      prev.players.forEach(p => {
        const validHexes = prev.board.filter(tile => {
          const neighbors = getNeighbors(tile.q, tile.r);
          const isAdjacentToDungeon = neighbors.some(n => 
            prev.board.find(t => t.q === n.q && t.r === n.r && t.hasDungeonEntrance)
          );
          const hasUnits = prev.units.some(u => u.playerId === p.id && u.q === tile.q && u.r === tile.r);
          return isAdjacentToDungeon && hasUnits;
        });

        if (validHexes.length > 0) {
          pendingEventChoices[p.id] = { type: 'DUNGEON_ATTACK', monsterLevel, monsterRolls, completed: false };
        } else {
          pendingEventChoices[p.id] = { type: 'INFO', message: "You have no units adjacent to a dungeon. You are safe from the attack.", completed: false };
        }
      });
    } else if (event.id === 'FREE_SKILL') {
      const anyPlayerHas5VP = prev.players.some(p => p.score >= 5);
      prev.players.forEach(p => {
        const skills = anyPlayerHas5VP ? [...prev.availableLevel3Skills, ...prev.availableLevel2Skills] : prev.availableLevel2Skills;
        if (skills.length > 0) {
          pendingEventChoices[p.id] = { type: 'FREE_SKILL', level3Allowed: anyPlayerHas5VP, completed: false };
        } else {
          pendingEventChoices[p.id] = { type: 'INFO', message: "There are no skills available in the market to learn.", completed: false };
        }
      });
    } else if (event.id === 'LAKE_XP_BONUS') {
      activeYearlyEffects.push('LAKE_XP_BONUS');
      prev.players.forEach(p => {
        pendingEventChoices[p.id] = { type: 'INFO', completed: false };
      });
    } else if (event.id === 'DEFENSE_DICE_BONUS') {
      activeYearlyEffects.push('DEFENSE_DICE_BONUS');
      prev.players.forEach(p => {
        pendingEventChoices[p.id] = { type: 'INFO', completed: false };
      });
    } else if (event.id === 'PLAINS_GOLD_REDUCTION') {
      activeYearlyEffects.push('PLAINS_GOLD_REDUCTION');
      prev.players.forEach(p => {
        pendingEventChoices[p.id] = { type: 'INFO', completed: false };
      });
    } else if (event.id === 'BOSS_MOVE') {
      const bossTile = prev.board.find(t => t.type === TileType.BOSS);
      const mountainTiles = prev.board.filter(t => t.type === TileType.MOUNTAIN && !prev.units.some(u => u.q === t.q && u.r === t.r) && !prev.buildings.some(b => b.q === t.q && b.r === t.r));
      
      if (bossTile && mountainTiles.length > 0) {
        const newBossTile = mountainTiles[Math.floor(Math.random() * mountainTiles.length)];
        newBoard = prev.board.map(t => {
          if (t.q === bossTile.q && t.r === bossTile.r) return { ...t, type: TileType.MOUNTAIN };
          if (t.q === newBossTile.q && t.r === newBossTile.r) return { ...t, type: TileType.BOSS };
          return t;
        });
        newLogs.push(`The Great Dragon has moved its lair to ${newBossTile.q}, ${newBossTile.r}!`);
      }
      prev.players.forEach(p => {
        pendingEventChoices[p.id] = { type: 'INFO', completed: false };
      });
    }

    return {
      ...prev,
      gamePhase: nextPhase,
      currentEvent: event.id,
      usedEvents: newUsedEvents.length === YEAR_EVENTS.length ? [] : newUsedEvents,
      activeYearlyEffects,
      pendingEventChoices,
      board: newBoard,
      units: newUnits,
      currentPlayerIndex: 0, // Start event choices with player 1
      logs: newLogs
    };
  };

  const triggerYearEndEvent = () => {
    setGameState(prev => getYearEndEventState(prev));
  };

  const handleHexClick = (q: number, r: number) => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    if (gameState.gamePhase === 'EVENT') {
      const pendingChoice = gameState.pendingEventChoices[currentPlayer.id];
      if (pendingChoice?.type === 'DUNGEON_ATTACK' && !pendingChoice.completed && gameState.isSelectingEventHex) {
        const tile = gameState.board.find(t => t.q === q && t.r === r);
        if (!tile) return;

        // Check if hex is adjacent to a dungeon entrance
        const neighbors = getNeighbors(q, r);
        const isAdjacentToDungeon = neighbors.some(n => 
          gameState.board.find(t => t.q === n.q && t.r === n.r && t.hasDungeonEntrance)
        );

        if (!isAdjacentToDungeon) {
          setGameState(prev => ({ ...prev, logs: [...prev.logs, "Select a hex adjacent to a dungeon entrance."] }));
          return;
        }

        // Check if player has units there
        const playerUnits = gameState.units.filter(u => u.playerId === currentPlayer.id && u.q === q && u.r === r);
        if (playerUnits.length === 0) {
          setGameState(prev => ({ ...prev, logs: [...prev.logs, "Select a hex where you have units."] }));
          return;
        }

        handleEventChoice({ type: 'DUNGEON_ATTACK', q, r });
        return;
      }
    }

    if (gameState.isSelectingFreeRecruitHex && gameState.freeRecruitType) {
      const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
      const buildingsOnTile = gameState.buildings.filter(b => b.q === q && b.r === r && b.playerId === currentPlayerId);
      const tile = gameState.board.find(t => t.q === q && t.r === r);
      const isMyCapital = tile?.type === TileType.INITIAL && tile.ownerId === currentPlayerId;
      
      if (buildingsOnTile.length > 0 || isMyCapital) {
        const friendlyUnitsOnHex = gameState.units.filter(u => u.q === q && u.r === r && u.playerId === currentPlayerId);
        const isCapital = tile?.type === TileType.INITIAL;
        if (friendlyUnitsOnHex.length >= 3 && !isCapital) {
          setGameState(prev => ({
            ...prev,
            logs: [...prev.logs, `Cannot recruit here. Hex already has 3 friendly units (Capitals are exempt).`]
          }));
          return;
        }

        const unitType = gameState.freeRecruitType;
        const currentCount = gameState.units.filter(u => u.playerId === currentPlayerId && u.type === unitType).length;
        const limit = UNIT_STATS[unitType].slots;

        if (currentCount >= limit) {
          setGameState(prev => ({
            ...prev,
            isSelectingFreeRecruitHex: false,
            freeRecruitType: null,
            freeRecruitCount: 0,
            logs: [...prev.logs, `Limit reached for ${unitType}s. Recruitment ended.`]
          }));
          // We should also complete the event choice if they can't recruit anymore
          handleEventChoice({ type: 'COMPLETE_EVENT_CHOICE' }); 
          return;
        }

        setGameState(prev => {
          const newUnits = [...prev.units];
          newUnits.push({
            id: `unit-${Date.now()}-${Math.random()}`,
            playerId: currentPlayerId,
            type: unitType,
            q,
            r,
            isExhausted: false,
            hp: UNIT_STATS[unitType].hp,
            maxHp: UNIT_STATS[unitType].hp
          });

          const newCount = prev.freeRecruitCount - 1;
          const isDone = newCount <= 0 || (currentCount + 1) >= limit;

          if (isDone) {
            // Use a temporary state to call handleEventChoice correctly
            setTimeout(() => {
              handleEventChoice({ type: 'COMPLETE_EVENT_CHOICE' });
            }, 0);

            return {
              ...prev,
              units: newUnits,
              isSelectingFreeRecruitHex: false,
              freeRecruitType: null,
              freeRecruitCount: 0,
              logs: [...prev.logs, `Placed ${unitType}. Recruitment complete.`]
            };
          }

          return {
            ...prev,
            units: newUnits,
            freeRecruitCount: newCount,
            logs: [...prev.logs, `Placed ${unitType}. ${newCount} more to place.`]
          };
        });
      } else {
        setGameState(prev => ({ ...prev, logs: [...prev.logs, "Select a hex with your capital or a castle."] }));
      }
      return;
    }

    if (gameState.gamePhase === 'SETUP_CAPITAL') {
      const clickedTile = gameState.board.find(t => t.q === q && t.r === r);
      
      // Case 1: Clicking a PREVIEW hex to place the capital
      if (clickedTile?.type === TileType.PREVIEW) {
        setGameState(prev => {
          const newPlayers = [...prev.players];
          const p = { ...newPlayers[prev.currentPlayerIndex] };
          newPlayers[prev.currentPlayerIndex] = p;
          p.capitalPosition = { q, r };
          
          const newBuildings = [...prev.buildings, {
            id: `capital-${p.id}`,
            playerId: p.id,
            type: 'capital' as const,
            q,
            r
          }];

          const stats = UNIT_STATS['warrior'];
          const newUnits = [...prev.units, 
            {
              id: `warrior-${p.id}-1`,
              playerId: p.id,
              type: 'warrior' as const,
              q,
              r,
              hp: stats.hp,
              maxHp: stats.hp
            },
            {
              id: `warrior-${p.id}-2`,
              playerId: p.id,
              type: 'warrior' as const,
              q,
              r,
              hp: stats.hp,
              maxHp: stats.hp
            }
          ];

          // Clean up preview hexes and add the new capital hex as INITIAL
          let newBoard = prev.board.filter(t => t.type !== TileType.PREVIEW);
          newBoard.push({
            q,
            r,
            type: TileType.INITIAL,
            isRevealed: true,
            castleSlots: 0,
            productionGold: 2,
            productionXP: 1,
            hasAdventureMarker: false,
            hasAdvancedAdventureMarker: false,
            redLines: []
          });

          // Also reveal the border hex that was selected
          if (prev.selectedBorderHex) {
            newBoard = newBoard.map(t => {
              if (prev.selectedBorderHex && t.q === prev.selectedBorderHex.q && t.r === prev.selectedBorderHex.r) {
                return { ...t, isRevealed: true };
              }
              return t;
            });
          }

          // Reveal tiles around the new capital (Important for both modes, but especially when isExplorationMode is false)
          newBoard = getRevealedBoardWithMonsters(newBoard, q, r, prev.gameMode);

          const nextIndex = prev.currentPlayerIndex - 1;
          if (nextIndex < 0) {
            return {
              ...prev,
              players: newPlayers,
              buildings: newBuildings,
              units: newUnits,
              board: newBoard,
              gamePhase: 'PLAYING',
              currentPlayerIndex: 0,
              isSelectingInitialQuest: true,
              selectedBorderHex: null,
              logs: [...prev.logs, `${p.name} placed their capital. All capitals placed! Choose your starting quests.`]
            };
          } else {
            return {
              ...prev,
              players: newPlayers,
              buildings: newBuildings,
              units: newUnits,
              board: newBoard,
              currentPlayerIndex: nextIndex,
              selectedBorderHex: null,
              logs: [...prev.logs, `${p.name} placed their capital. ${newPlayers[nextIndex].name}, choose a border hex for your capital.`]
            };
          }
        });
        return;
      }

      // Case 2: Clicking a border hex to show previews
      const distance = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
      if (distance < 2) {
        setGameState(prev => ({ ...prev, logs: [...prev.logs, "Select a border hex to see potential capital locations."] }));
        return;
      }

      const boardWithoutPreviews = gameState.board.filter(t => t.type !== TileType.PREVIEW);
      const outsideNeighbors = getAllOutsideNeighbors(q, r, boardWithoutPreviews).filter(pos => {
        // Must be at least 2 hexes away from any existing capital
        const isFarEnough = !gameState.buildings.some(b => 
          b.type === 'capital' && getHexDistance(pos.q, pos.r, b.q, b.r) < 2
        );
        if (!isFarEnough) return false;

        // Must not be "stuck" (all neighbors cost 2 or more)
        return !isHexStuck(pos.q, pos.r, boardWithoutPreviews, currentPlayer.passives);
      });

      if (outsideNeighbors.length === 0) {
        setGameState(prev => ({ ...prev, logs: [...prev.logs, "This hex has no available outside faces that are far enough from other capitals."] }));
        return;
      }

      setGameState(prev => {
        // Remove existing previews
        let newBoard = prev.board.filter(t => t.type !== TileType.PREVIEW);
        
        // Add new previews
        outsideNeighbors.forEach(pos => {
          if (!prev.buildings.some(b => b.q === pos.q && b.r === pos.r && b.type === 'capital')) {
            newBoard.push({
              q: pos.q,
              r: pos.r,
              type: TileType.PREVIEW,
              isRevealed: true,
              castleSlots: 0,
              productionGold: 0,
              productionXP: 0,
              hasAdventureMarker: false,
              hasAdvancedAdventureMarker: false,
              redLines: []
            });
          }
        });

        return {
          ...prev,
          board: newBoard,
          selectedBorderHex: { q, r },
          logs: [...prev.logs, "Select one of the highlighted hexes to place your capital."]
        };
      });
      return;
    }

    if (gameState.isExploring) {
      const tile = gameState.board.find(t => t.q === q && t.r === r);
      if (!tile) return;

      if (tile.isRevealed) {
        setGameState(prev => ({ ...prev, logs: [...prev.logs, "This hex is already revealed. Select an unrevealed hex."] }));
        return;
      }

      // Check adjacency to current player's units or castles
      const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
      const myUnits = gameState.units.filter(u => u.playerId === currentPlayerId);
      const myCastles = gameState.buildings.filter(b => b.playerId === currentPlayerId && (b.type === 'castle' || b.type === 'capital'));

      const isAdjacent = [...myUnits, ...myCastles].some(obj => getHexDistance(q, r, obj.q, obj.r) === 1);

      if (!isAdjacent) {
        setGameState(prev => ({ ...prev, logs: [...prev.logs, "You can only reveal hexes adjacent to your units or castles."] }));
        return;
      }

      setGameState(prev => {
        let newBoard = [...prev.board];
        let revealedDungeons: HexTile[] = [];

        newBoard = newBoard.map(t => {
          if (t.q === q && t.r === r) {
            if (!t.isRevealed && t.type === TileType.DUNGEON_ENTRANCE && prev.gameMode === 'MONSTERS_OUT') {
              revealedDungeons.push(t);
            }
            return { ...t, isRevealed: true };
          }
          return t;
        });

        // Spawn monsters for revealed dungeons
        revealedDungeons.forEach(dungeon => {
          const monsterLevels = [1, 2, 3].sort(() => 0.5 - Math.random());
          const chosenFaces = dungeon.dungeonEntranceFaces || [];
          
          chosenFaces.forEach((face, idx) => {
            const level = monsterLevels[idx];
            
            for (let fOffset = 0; fOffset < 6; fOffset++) {
              const currentFace = (face + fOffset) % 6;
              const dir = [
                { dq: 1, dr: -1 }, { dq: 1, dr: 0 }, { dq: 0, dr: 1 },
                { dq: -1, dr: 1 }, { dq: -1, dr: 0 }, { dq: 0, dr: -1 }
              ][currentFace];
              let adjQ = dungeon.q + dir.dq;
              let adjR = dungeon.r + dir.dr;
              
              const adjTileIndex = newBoard.findIndex(t => t.q === adjQ && t.r === adjR);
              if (adjTileIndex !== -1 && !newBoard[adjTileIndex].monsterLevel && newBoard[adjTileIndex].type !== TileType.DUNGEON_ENTRANCE) {
                newBoard[adjTileIndex] = { ...newBoard[adjTileIndex], monsterLevel: level };
                break;
              }
            }
          });
        });

        const newExplorationCount = prev.explorationCount - 1;
        const isDone = newExplorationCount <= 0;

        return {
          ...prev,
          board: newBoard,
          explorationCount: newExplorationCount,
          isExploring: !isDone,
          activeActionType: isDone ? null : prev.activeActionType,
          actionSnapshot: isDone ? null : prev.actionSnapshot,
          logs: [...prev.logs, `${prev.players[prev.currentPlayerIndex].name} revealed hex at ${q}, ${r}. ${isDone ? "Exploration complete." : "Select 1 more hex."}`]
        };
      });
      return;
    }

    if (gameState.isRecruiting && gameState.recruitingUnitType) {
      const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
      const buildingsOnTile = gameState.buildings.filter(b => b.q === q && b.r === r && b.playerId === currentPlayerId);
      const tile = gameState.board.find(t => t.q === q && t.r === r);
      const isMyCapital = tile?.type === TileType.INITIAL && tile.ownerId === currentPlayerId;
      
      if (buildingsOnTile.length > 0 || isMyCapital) {
        const friendlyUnitsOnHex = gameState.units.filter(u => u.q === q && u.r === r && u.playerId === currentPlayerId);
        const isCapital = tile?.type === TileType.INITIAL;
        if (friendlyUnitsOnHex.length >= 3 && !isCapital) {
          setGameState(prev => ({
            ...prev,
            logs: [...prev.logs, `Cannot recruit here. Hex already has 3 friendly units (Capitals are exempt).`]
          }));
          return;
        }

        const unitCost = gameState.recruitingUnitType === 'warrior' ? 4 : gameState.recruitingUnitType === 'mage' ? 6 : 8;
        
        setGameState(prev => {
          const newPlayers = [...prev.players];
          const p = { 
            ...newPlayers[prev.currentPlayerIndex],
            availableUnits: { ...newPlayers[prev.currentPlayerIndex].availableUnits },
            deployedUnits: { ...newPlayers[prev.currentPlayerIndex].deployedUnits }
          };
          newPlayers[prev.currentPlayerIndex] = p;
          
          if (p.gold < unitCost || p.availableUnits[`${prev.recruitingUnitType}s` as keyof typeof p.availableUnits] <= 0) {
            if (prev.actionSnapshot) {
              return {
                ...prev,
                players: prev.actionSnapshot.players,
                units: prev.actionSnapshot.units,
                buildings: prev.actionSnapshot.buildings,
                isRecruiting: false,
                recruitingUnitType: null,
                actionSnapshot: null,
                logs: [...prev.logs, `Cannot deploy ${prev.recruitingUnitType} (insufficient gold or units). Action canceled.`]
              };
            }
            return {
              ...prev,
              isRecruiting: false,
              recruitingUnitType: null,
              logs: [...prev.logs, `Cannot deploy ${prev.recruitingUnitType} (insufficient gold or units). Action canceled.`]
            };
          }

          p.gold -= unitCost;
          p.availableUnits[`${prev.recruitingUnitType}s` as keyof typeof p.availableUnits] -= 1;
          p.deployedUnits[`${prev.recruitingUnitType}s` as keyof typeof p.deployedUnits] += 1;
          p.avoidHexes = [];

          if (!prev.recruitingUnitType) return prev;
          const unitType = prev.recruitingUnitType;
          const unitLevel = p.unitLevels[unitType];
          
          const maxHp = calculateMaxHp(unitType, unitLevel, p.unitTypeSkills[unitType]);

          const newUnits = [...prev.units, {
            id: `${unitType}-${currentPlayerId}-${Date.now()}`,
            playerId: currentPlayerId,
            type: unitType,
            q,
            r,
            hp: maxHp,
            maxHp: maxHp
          }];

          const win = (p.score + getAncientCityVP(p.id, prev.board, newUnits, prev.buildings)) >= 10;

          if (p.isAI) {
            const newInsights = prev.aiInsights ? { ...prev.aiInsights } : {
              actionSuccessRates: {} as Record<ActionType, number>,
              preferredPersonalities: {} as Record<string, number>
            };
            const currentRate = newInsights.actionSuccessRates[ActionType.RECRUIT] ?? 0.5;
            newInsights.actionSuccessRates[ActionType.RECRUIT] = currentRate * 0.9 + 0.1;
            
            return {
              ...prev,
              units: newUnits,
              players: newPlayers,
              isRecruiting: false,
              recruitingUnitType: null,
              activeActionType: null,
              actionSnapshot: null,
              isGameOver: win,
              aiInsights: newInsights,
              logs: [...prev.logs, `${p.name} recruited a ${unitType} at ${q}, ${r}.`]
            };
          }

          return {
            ...prev,
            units: newUnits,
            players: newPlayers,
            isRecruiting: false,
            recruitingUnitType: null,
            activeActionType: null,
            actionSnapshot: null,
            isGameOver: win,
            logs: [...prev.logs, `${p.name} recruited a ${unitType} at ${q}, ${r}.`]
          };
        });
      } else {
        setGameState(prev => ({
          ...prev,
          logs: [...prev.logs, `Must deploy in your capital or a castle.`]
        }));
      }
      return;
    }

    if (gameState.isBuildingCastle) {
      const tile = gameState.board.find(t => t.q === q && t.r === r);
      if (!tile) return;

      const unitsOnTile = gameState.units.filter(u => u.q === q && u.r === r);
      const buildingsOnTile = gameState.buildings.filter(b => b.q === q && b.r === r);
      
      const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
      
      const hasMyUnits = unitsOnTile.some(u => u.playerId === currentPlayerId);
      const hasEnemyUnits = unitsOnTile.some(u => u.playerId !== currentPlayerId);
      const currentCastles = buildingsOnTile.filter(b => b.type === 'castle').length;

      if (hasMyUnits && !hasEnemyUnits && currentCastles < tile.castleSlots) {
        const myUnitsOnTile = unitsOnTile.filter(u => u.playerId === currentPlayerId && !u.isExhausted);
        if (myUnitsOnTile.length === 0) {
          setGameState(prev => ({ ...prev, logs: [...prev.logs, "Exhausted units cannot build castles."] }));
          return;
        }
        const newBuildings = [...gameState.buildings, {
          id: `castle-${currentPlayerId}-${Date.now()}`,
          playerId: currentPlayerId,
          type: 'castle' as const,
          q,
          r
        }];

        setGameState(prev => {
          const newPlayers = [...prev.players];
          const p = { 
            ...newPlayers[prev.currentPlayerIndex],
            availableUnits: { ...newPlayers[prev.currentPlayerIndex].availableUnits }
          };
          newPlayers[prev.currentPlayerIndex] = p;
          p.availableUnits.castles -= 1;

          const win = (p.score + getAncientCityVP(p.id, prev.board, prev.units, newBuildings)) >= 10;

          if (p.isAI) {
            const newInsights = prev.aiInsights ? { ...prev.aiInsights } : {
              actionSuccessRates: {} as Record<ActionType, number>,
              preferredPersonalities: {} as Record<string, number>
            };
            const currentRate = newInsights.actionSuccessRates[ActionType.BUILD_CASTLE] ?? 0.5;
            newInsights.actionSuccessRates[ActionType.BUILD_CASTLE] = currentRate * 0.9 + 0.1;
            
            return {
              ...prev,
              buildings: newBuildings,
              players: newPlayers,
              isBuildingCastle: false,
              activeActionType: null,
              actionSnapshot: null,
              isGameOver: win,
              aiInsights: newInsights,
              logs: [...prev.logs, `${p.name} built a castle at ${q}, ${r}.`]
            };
          }

          return {
            ...prev,
            buildings: newBuildings,
            players: newPlayers,
            isBuildingCastle: false,
            activeActionType: null,
            actionSnapshot: null,
            isGameOver: win,
            logs: [...prev.logs, `${p.name} built a castle at ${q}, ${r}.`]
          };
        });
      } else {
        setGameState(prev => ({
          ...prev,
          logs: [...prev.logs, `Cannot build castle here. Need your units, no enemies, and available slots.`]
        }));
      }
      return;
    }

    if (gameState.isSelectingAdventureHex) {
      const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
      const myUnits = gameState.units.filter(u => u.q === q && u.r === r && u.playerId === currentPlayerId && !u.isExhausted);
      
      if (myUnits.length === 0) {
        setGameState(prev => ({ ...prev, logs: [...prev.logs, "You must have non-exhausted units in the hex to explore."] }));
        return;
      }

      const tile = gameState.board.find(t => t.q === q && t.r === r);
      if (!tile || (!tile.hasAdventureMarker && !tile.hasAdvancedAdventureMarker)) {
        setGameState(prev => ({ ...prev, logs: [...prev.logs, "No adventure here."] }));
        return;
      }

      // Generate Adventure Card
      const adventureCard = generateAdventureCard(q, r, !!tile.hasAdvancedAdventureMarker);
      
      setGameState(prev => ({
        ...prev,
        isSelectingAdventureHex: false,
        currentAdventure: adventureCard,
        logs: [...prev.logs, `Found an adventure: ${adventureCard.title}!`]
      }));
      return;
    }

    if (gameState.isSelectingCombatHex) {
      const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
      const myUnits = gameState.units.filter(u => u.q === q && u.r === r && u.playerId === currentPlayerId && !u.isExhausted);
      
      if (myUnits.length === 0) {
        setGameState(prev => ({ ...prev, logs: [...prev.logs, "You must have non-exhausted units in the hex to start combat."] }));
        return;
      }

      const enemyUnits = gameState.units.filter(u => u.q === q && u.r === r && u.playerId !== currentPlayerId);
      const tile = gameState.board.find(t => t.q === q && t.r === r);
      const isDungeon = tile?.type === TileType.DUNGEON_ENTRANCE || tile?.hasDungeonEntrance;
      const isBoss = tile?.type === TileType.BOSS;
      const isMonster = !!tile?.monsterLevel;

      if (enemyUnits.length > 0) {
        // Player vs Player
        startCombat(currentPlayerId, enemyUnits[0].playerId, q, r);
      } else if (isBoss) {
        startCombat(currentPlayerId, 'monster', q, r);
      } else if (isMonster) {
        const mId = tile?.monsterLevel === 1 ? 'monster' : (tile?.monsterLevel === 2 ? 'monster2' : 'monster3');
        startCombat(currentPlayerId, mId, q, r);
      } else if (isDungeon) {
        if (currentPlayer.questProgress.monstersDefeated > 0) {
          setGameState(prev => ({
            ...prev,
            isSelectingCombatHex: false,
            isSelectingMonsterLevel: true,
            pendingCombatHex: { q, r }
          }));
        } else {
          startCombat(currentPlayerId, 'monster', q, r);
        }
      } else {
        setGameState(prev => ({ ...prev, logs: [...prev.logs, "No enemies, dungeon or boss here."] }));
      }
      return;
    }

    if (gameState.pendingMoves <= 0 || !gameState.selectedUnitId) return;
    
    const unit = gameState.units.find(u => u.id === gameState.selectedUnitId);
    if (!unit) return;

    const unitLevel = currentPlayer.unitLevels[unit.type];
    const maxRange = calculateMaxRange(unit.type, unitLevel, currentPlayer.faction);
    
    const calculatePathCost = (startQ: number, startR: number, targetQ: number, targetR: number, maxExtraMoves: number): {cost: number, extraMoves: number} | null => {
      const dist = new Map<string, number>();
      const pq: {q: number, r: number, cost: number, extraMoves: number}[] = [];
      
      dist.set(`${startQ},${startR},0`, 0);
      pq.push({q: startQ, r: startR, cost: 0, extraMoves: 0});
      
      const neighbors = [
        {dq: 1, dr: -1}, {dq: 1, dr: 0}, {dq: 0, dr: 1},
        {dq: -1, dr: 1}, {dq: -1, dr: 0}, {dq: 0, dr: -1}
      ];

      const bestCosts: number[] = Array(maxExtraMoves + 1).fill(Infinity);

      while (pq.length > 0) {
        pq.sort((a, b) => a.cost - b.cost);
        const current = pq.shift();
        if (!current) continue;
        
        if (current.q === targetQ && current.r === targetR) {
          if (current.cost < bestCosts[current.extraMoves]) {
            bestCosts[current.extraMoves] = current.cost;
          }
          continue;
        }

        if (current.cost > (dist.get(`${current.q},${current.r},${current.extraMoves}`) ?? Infinity)) continue;

        for (const n of neighbors) {
          const nq = current.q + n.dq;
          const nr = current.r + n.dr;
          const nTile = gameState.board.find(t => t.q === nq && t.r === nr);
          if (!nTile) continue;

          const moveCost = getMoveCost(current.q, current.r, nq, nr, gameState.board, currentPlayer.unitTypeSkills[unit.type].filter((s): s is Skill => s !== null), currentPlayer.passives);
          
          const newCost1 = current.cost + moveCost;
          const nKey1 = `${nq},${nr},${current.extraMoves}`;
          if (newCost1 < (dist.get(nKey1) ?? Infinity)) {
            dist.set(nKey1, newCost1);
            pq.push({q: nq, r: nr, cost: newCost1, extraMoves: current.extraMoves});
          }

          if (moveCost === 2 && current.extraMoves < maxExtraMoves) {
            const newCost2 = current.cost + 1;
            const newExtra2 = current.extraMoves + 1;
            const nKey2 = `${nq},${nr},${newExtra2}`;
            if (newCost2 < (dist.get(nKey2) ?? Infinity)) {
              dist.set(nKey2, newCost2);
              pq.push({q: nq, r: nr, cost: newCost2, extraMoves: newExtra2});
            }
          }
        }
      }
      
      for (let e = 0; e <= maxExtraMoves; e++) {
        if (bestCosts[e] <= maxRange) {
          return { cost: bestCosts[e], extraMoves: e };
        }
      }
      
      let minCost = Infinity;
      let minE = 0;
      for (let e = 0; e <= maxExtraMoves; e++) {
        if (bestCosts[e] < minCost) {
          minCost = bestCosts[e];
          minE = e;
        }
      }
      
      if (minCost === Infinity) return null;
      return { cost: minCost, extraMoves: minE };
    };

    const maxExtraMoves = Math.max(0, gameState.pendingMoves - 1);
    const pathResult = calculatePathCost(unit.q, unit.r, q, r, maxExtraMoves);
    
    if (pathResult && pathResult.cost > 0 && pathResult.cost <= maxRange) {
      const { cost: pathCost, extraMoves } = pathResult;
      // Valid move
      const friendlyUnitsOnTarget = gameState.units.filter(u => u.q === q && u.r === r && u.playerId === currentPlayer.id);
      const targetTile = gameState.board.find(t => t.q === q && t.r === r);
      const isTargetCapital = targetTile?.type === TileType.INITIAL;
      if (friendlyUnitsOnTarget.length >= 3 && !isTargetCapital) {
        setGameState(prev => ({
          ...prev,
          logs: [...prev.logs, `Cannot move to ${q}, ${r}. Hex already has 3 friendly units (Capitals are exempt).`]
        }));
        return;
      }

      const newUnits = gameState.units.map(u => 
        u.id === gameState.selectedUnitId ? { ...u, q, r } : u
      );
      
      setGameState(prev => {
        const p = prev.players[prev.currentPlayerIndex];
        const win = (p.score + getAncientCityVP(p.id, prev.board, newUnits, prev.buildings)) >= 10;
        
        const newPendingMoves = prev.pendingMoves - 1 - extraMoves;
        const extraLog = extraMoves > 0 ? ` (Ignored ${extraMoves} red line${extraMoves > 1 ? 's' : ''})` : '';

        let nextState: any = {
          ...prev,
          units: newUnits,
          selectedUnitId: null,
          movedUnitIds: prev.selectedUnitId ? [...prev.movedUnitIds, prev.selectedUnitId] : prev.movedUnitIds,
          pendingMoves: newPendingMoves,
          isGameOver: win,
          logs: [...prev.logs, `Moved unit to ${q}, ${r} (Cost: ${pathCost})${extraLog}. ${newPendingMoves} moves remaining.`]
        };

        if (p.isAI && newPendingMoves <= 0) {
          const newInsights = prev.aiInsights ? { ...prev.aiInsights } : {
            actionSuccessRates: {} as Record<ActionType, number>,
            preferredPersonalities: {} as Record<string, number>
          };
          const actionType = prev.activeActionType || ActionType.MOVE_1;
          const currentRate = newInsights.actionSuccessRates[actionType] ?? 0.5;
          newInsights.actionSuccessRates[actionType] = currentRate * 0.9 + 0.1;
          nextState.aiInsights = newInsights;
        }

        return nextState;
      });
    } else if (pathResult && pathResult.cost > maxRange) {
      setGameState(prev => ({ 
        ...prev, 
        selectedUnitId: null,
        pendingMoves: prev.pendingMoves - 1,
        logs: [...prev.logs, `Target is too far. Path cost is ${pathResult.cost}, max range is ${maxRange}.`] 
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        selectedUnitId: null,
        pendingMoves: prev.pendingMoves - 1,
        logs: [...prev.logs, `Invalid move to ${q}, ${r}.`]
      }));
    }
  };

  const handleCancelAction = () => {
    setGameState(prev => {
      const p = { ...prev.players[prev.currentPlayerIndex] };
      
      if (p.isAI && p.actionHistory && p.actionHistory.length > 0) {
        const newHistory = [...p.actionHistory];
        newHistory[newHistory.length - 1] = { ...newHistory[newHistory.length - 1], success: false };
        p.actionHistory = newHistory;
      }

      // If we have a snapshot, revert to it
      if (prev.actionSnapshot) {
        return {
          ...prev,
          players: prev.actionSnapshot.players,
          units: prev.actionSnapshot.units,
          buildings: prev.actionSnapshot.buildings,
          isBuildingCastle: false,
          isRecruiting: false,
          isSelectingCombatHex: false,
          isSelectingAdventureHex: false,
          isExploring: false,
          isBuyingSkill: false,
          isCompletingQuest: false,
          isFreeSkill: false,
          selectedSkill: null,
          isSelectingSkillSlot: false,
          targetUnitId: null,
          targetUnitType: null,
          isSelectingUnitTypeForSkill: false,
          recruitingUnitType: null,
          pendingMoves: 0,
          movedUnitIds: [],
          selectedUnitId: null,
          activeActionType: null,
          actionSnapshot: null,
          freeProductionActions: prev.actionSnapshot.freeProductionActions,
          logs: [...prev.logs, `${p.name} canceled the action and reverted changes.`]
        };
      }

      return {
        ...prev,
        isBuildingCastle: false,
        isRecruiting: false,
        isSelectingCombatHex: false,
        isSelectingAdventureHex: false,
        isExploring: false,
        isBuyingSkill: false,
        isCompletingQuest: false,
        isFreeSkill: false,
        selectedSkill: null,
        isSelectingSkillSlot: false,
        targetUnitId: null,
        targetUnitType: null,
        isSelectingUnitTypeForSkill: false,
        recruitingUnitType: null,
        pendingMoves: 0,
        movedUnitIds: [],
        selectedUnitId: null,
        activeActionType: null,
        freeSkillLevel: null,
        logs: [...prev.logs, `${p.name} canceled the action.`]
      };
    });
  };

  const handleSelectRecruitUnit = (unitType: 'warrior' | 'mage' | 'knight') => {
    setGameState(prev => ({
      ...prev,
      recruitingUnitType: unitType,
      logs: [...prev.logs, `${prev.players[prev.currentPlayerIndex].name} is deploying a ${unitType}.`]
    }));
  };

  const rollDice = (diceType: string): number => {
    const faces = DICE[diceType as keyof typeof DICE];
    return faces[Math.floor(Math.random() * faces.length)];
  };

  const calculateCombatTotals = (aRolls: any[], dRolls: any[], isBossFight: boolean, defenderId: string | number, aInitialDefense: number = 0, dInitialDefense: number = 0) => {
    const getVal = (r: any) => {
      let v = typeof r.value === 'number' ? r.value : Number(r.value);
      if (v < 0) v = 0;
      if (gameState.activeYearlyEffects.includes('DEFENSE_DICE_BONUS') && r.purpose === 'DEFENSE') {
        v *= 2;
      }
      return v;
    };
    
    const aDamageRaw = aRolls.filter(r => r.purpose === 'DAMAGE').reduce((sum, r) => sum + getVal(r), 0);
    const aDefense = aRolls.filter(r => r.purpose === 'DEFENSE').reduce((sum, r) => sum + getVal(r), aInitialDefense);

    const dDamageRaw = dRolls.filter(r => r.purpose === 'DAMAGE').reduce((sum, r) => sum + getVal(r), 0);
    const dDefenseRaw = dRolls.filter(r => r.purpose === 'DEFENSE').reduce((sum, r) => sum + getVal(r), dInitialDefense);

    // Dwarf Knight Counter Logic
    const aDwarfDefense = aRolls.filter(r => r.type === 'DEFENSE').reduce((sum, r) => {
        const unit = gameState.units.find(u => u.id === r.unitId);
        if (!unit) return sum;
        const owner = gameState.players.find(p => p.id === unit.playerId);
        const skills = owner?.unitTypeSkills[unit.type] || [];
        if (skills.some(s => s?.id === 'DWARF_KNIGHT_UNIQUE')) return sum + getVal(r);
        return sum;
    }, 0);
    const aBonusDamage = Math.floor(aDwarfDefense / 2);

    const dDwarfDefense = dRolls.filter(r => r.type === 'DEFENSE').reduce((sum, r) => {
        const unit = gameState.units.find(u => u.id === r.unitId);
        if (!unit) return sum;
        const owner = gameState.players.find(p => p.id === unit.playerId);
        const skills = owner?.unitTypeSkills[unit.type] || [];
        if (skills.some(s => s?.id === 'DWARF_KNIGHT_UNIQUE')) return sum + getVal(r);
        return sum;
    }, 0);
    const dBonusDamage = Math.floor(dDwarfDefense / 2);

    const aDamage = aDamageRaw + aBonusDamage;
    const dDamage = dDamageRaw + dBonusDamage;

    const attackerId = gameState.combatState?.attackerId;
    const attacker = gameState.players.find(p => p.id === attackerId);
    const hasElfKnightSkill = attacker?.unitTypeSkills?.knight?.some(s => s?.id === 'ELF_KNIGHT_UNIQUE');
    const hasKnightsInCombat = aRolls.some(r => {
        const unit = gameState.units.find(u => u.id === r.unitId);
        return unit?.type === 'knight';
    });

    let dDefense = dDefenseRaw;
    if (hasElfKnightSkill && hasKnightsInCombat) {
        dDefense = Math.floor(dDefenseRaw / 2);
    }

    return {
      aDamage: Math.max(0, aDamage - dDefense),
      dDamage: Math.max(0, dDamage - aDefense),
      aDefense,
      dDefense,
      aRemainingDefense: Math.max(0, aDefense - dDamage),
      dRemainingDefense: Math.max(0, dDefense - aDamage)
    };
  };

  const startCombat = (attackerId: number, defenderId: number | 'monster' | 'monster2' | 'monster3', q: number, r: number) => {
    const attackerUnits = gameState.units.filter(u => u.q === q && u.r === r && u.playerId === attackerId);
    const defenderUnits = (defenderId === 'monster' || defenderId === 'monster2' || defenderId === 'monster3')
      ? [] 
      : gameState.units.filter(u => u.q === q && u.r === r && u.playerId === defenderId);

    const tile = gameState.board.find(t => t.q === q && t.r === r);
    const isBoss = tile?.type === TileType.BOSS;
    let monsterHp: number | undefined;
    let monsterIndex = 0;
    let monsterAttackIndex: number | undefined;
    
    if (defenderId === 'monster') {
      const stats = isBoss ? BOSS_STATS : MONSTER_STATS;
      monsterIndex = Math.floor(Math.random() * stats.length);
      monsterHp = stats[monsterIndex].hp;
    } else if (defenderId === 'monster2') {
      monsterIndex = Math.floor(Math.random() * MONSTER_LEVEL_2_STATS.length);
      monsterHp = MONSTER_LEVEL_2_STATS[monsterIndex].hp;
      monsterAttackIndex = Math.floor(Math.random() * MONSTER_LEVEL_2_STATS[monsterIndex].attackOptions.length);
    } else if (defenderId === 'monster3') {
      monsterIndex = Math.floor(Math.random() * MONSTER_LEVEL_3_STATS.length);
      monsterHp = MONSTER_LEVEL_3_STATS[monsterIndex].hp;
      monsterAttackIndex = Math.floor(Math.random() * MONSTER_LEVEL_3_STATS[monsterIndex].attackOptions.length);
    }

    const combatState: CombatState = {
      attackerId,
      defenderId,
      q,
      r,
      attackerUnits,
      defenderUnits,
      attackerRolls: [],
      defenderRolls: [],
      attackerTotalDamage: 0,
      defenderTotalDamage: 0,
      attackerTotalDefense: 0,
      defenderTotalDefense: 0,
      attackerRemainingDefense: 0,
      defenderRemainingDefense: 0,
      hasAnyRanged: false,
      logs: [`Combat started at ${q}, ${r}! ${isBoss ? 'A Boss Dragon appears!' : ''}`],
      isResolved: false,
      phase: 'INIT',
      monsterHp,
      monsterIndex,
      monsterAttackIndex,
      attackerRerolls: 0,
      defenderRerolls: 0,
      oozeSkillGranted: false,
      goldGained: 0,
      xpGained: 0,
      defenderGoldGained: 0,
      defenderXpGained: 0,
      defeatedUnitNames: [],
      attackerDamageApplied: 0,
      defenderDamageApplied: 0,
      channellingUnitIds: [],
      readyToChannelUnitIds: []
    };

    setGameState(prev => {
      const attacker = prev.players.find(p => p.id === attackerId);
      const defender = typeof defenderId === 'number' ? prev.players.find(p => p.id === defenderId) : null;
      const isAIOnly = attacker?.isAI && (!defender || defender.isAI);
      
      return {
        ...prev,
        isSelectingCombatHex: false,
        isPaused: (isAIOnly && prev.pauseOnAICombat) ? true : prev.isPaused,
        combatState
      };
    });
  };

  const resolveCombat = () => {
    if (!gameState.combatState) return;
    
    setGameState(prev => {
      if (!prev.combatState) return prev;
      const { attackerUnits, defenderUnits, defenderId, phase } = prev.combatState;

      let isRangedPhase = phase === 'INIT';
      let nextPhase: 'RANGED_REROLL' | 'MELEE_REROLL' = isRangedPhase ? 'RANGED_REROLL' : 'MELEE_REROLL';

      const monster2Stats = defenderId === 'monster2' ? MONSTER_LEVEL_2_STATS[prev.combatState.monsterIndex || 0] : null;
      const monster2AttackOption = (monster2Stats && prev.combatState.monsterAttackIndex !== undefined) ? monster2Stats.attackOptions[prev.combatState.monsterAttackIndex] : null;
      const monster3Stats = defenderId === 'monster3' ? MONSTER_LEVEL_3_STATS[prev.combatState.monsterIndex || 0] : null;
      const monster3AttackOption = (monster3Stats && prev.combatState.monsterAttackIndex !== undefined) ? monster3Stats.attackOptions[prev.combatState.monsterAttackIndex] : null;

      const attackerHasFlyingMage = attackerUnits.some(u => {
        const owner = prev.players.find(p => p.id === u.playerId);
        return owner?.unitTypeSkills.mage.some(s => s?.id === 'FLYING_MAGE_UNIQUE');
      });
      const defenderHasFlyingMage = defenderUnits.some(u => {
        const owner = prev.players.find(p => p.id === u.playerId);
        return owner?.unitTypeSkills.mage.some(s => s?.id === 'FLYING_MAGE_UNIQUE');
      });

      const hasAnyRanged = attackerHasFlyingMage || defenderHasFlyingMage || attackerUnits.some(u => {
        const owner = prev.players.find(p => p.id === u.playerId);
        const skills = owner?.unitTypeSkills[u.type] || [];
        return skills.some(s => s && getDiceFromSkill(s, true).length > 0);
      }) || defenderUnits.some(u => {
        const owner = prev.players.find(p => p.id === u.playerId);
        const skills = owner?.unitTypeSkills[u.type] || [];
        return skills.some(s => s && getDiceFromSkill(s, true).length > 0);
      }) || (defenderId === 'monster' && Array.isArray(MONSTER_STATS[prev.combatState?.monsterIndex || 0]?.dice) && MONSTER_STATS[prev.combatState?.monsterIndex || 0].dice.some((d: string) => d === 'RANGED')) ||
         ((defenderId === 'monster2' || defenderId === 'monster3') && ( (defenderId === 'monster2' ? MONSTER_LEVEL_2_STATS : MONSTER_LEVEL_3_STATS)[prev.combatState?.monsterIndex || 0]?.attackOptions?.[prev.combatState?.monsterAttackIndex || 0]?.RANGED_MANA > 0 || false));

      const rollDiceForPhase = (ranged: boolean) => {
        const attackerRolls: any[] = [];
        
        // Orc passive checks for attackers
        const attackerHasOrcKnightSkill = attackerUnits.some(u => {
          const owner = prev.players.find(p => p.id === u.playerId);
          return u.type === 'knight' && owner?.unitTypeSkills.knight.some(s => s?.id === 'ORC_KNIGHT_UNIQUE');
        });
        const attackerOrcMage = attackerUnits.find(u => {
          const owner = prev.players.find(p => p.id === u.playerId);
          return u.type === 'mage' && owner?.unitTypeSkills.mage.some(s => s?.id === 'ORC_MAGE_UNIQUE');
        });
        const attackerSharedSkill = attackerOrcMage ? (prev.players.find(p => p.id === attackerOrcMage.playerId)?.unitTypeSkills.mage[1]) : null;

        const attackerHasFlyingMageSkill = attackerUnits.some(u => {
          const owner = prev.players.find(p => p.id === u.playerId);
          return u.type === 'mage' && owner?.unitTypeSkills.mage.some(s => s?.id === 'FLYING_MAGE_UNIQUE');
        });

        attackerUnits.forEach(u => {
          if (u.hp <= 0) return; // Dead units don't roll
          const owner = prev.players.find(p => p.id === u.playerId);
          let skills = [...(owner?.unitTypeSkills[u.type] || [])];
          
          // Orc Mage sharing logic
          if (attackerSharedSkill && u.type !== 'mage') {
            skills.push(attackerSharedSkill);
          }

          const hasElfMageSkill = u.type === 'mage' && owner?.unitTypeSkills?.mage?.some(s => s?.id === 'ELF_MAGE_UNIQUE');
          
          skills.forEach(skill => {
            if (!skill) return;
            const isChannelling = prev.combatState?.channellingUnitIds?.includes(u.id);
            const isReadyToChannel = prev.combatState?.readyToChannelUnitIds?.includes(u.id);
            
            let dice: any[] = [];
            if (ranged) {
              // Ranged phase: roll ranged damage dice AND defense dice
              dice = getDiceFromSkill(skill, true);
              const defenseDice = getDiceFromSkill(skill, false).filter(d => d.purpose === 'DEFENSE');
              dice = [...dice, ...defenseDice];
            } else {
              // Melee phase: roll melee damage dice
              dice = getDiceFromSkill(skill, false).filter(d => d.purpose !== 'DEFENSE');
              // ONLY roll defense dice if they weren't rolled in ranged phase
              if (!prev.combatState.hasAnyRanged) {
                const defenseDice = getDiceFromSkill(skill, false).filter(d => d.purpose === 'DEFENSE');
                dice = [...dice, ...defenseDice];
              }
            }

            if (attackerHasFlyingMageSkill) {
              if (ranged) {
                // In ranged phase, also add melee/mana damage dice
                const meleeDice = getDiceFromSkill(skill, false);
                const damageDice = meleeDice.filter(d => d.purpose === 'DAMAGE');
                dice = [...dice, ...damageDice];
              } else {
                // In melee phase, remove damage dice that were already rolled in ranged phase
                dice = dice.filter(d => d.purpose !== 'DAMAGE');
              }
            }

            dice.forEach(d => {
              if (isChannelling && d.type === 'MANA') return; // Skip mana dice if channelling
              let count = d.count;
              for (let i = 0; i < count; i++) {
                let diceType = d.type;
                if (attackerHasOrcKnightSkill && diceType === 'MELEE') {
                  diceType = 'ORC_MELEE';
                }
                if (diceType === 'DEFENSE' && skills.some(s => s?.id === 'FLYING_KNIGHT_UNIQUE')) {
                  diceType = 'FLYING_DEFENSE';
                }
                let val = rollDice(diceType);
                if (hasElfMageSkill && d.type === 'MANA' && val === 0) {
                  val = -2; // Elf Mage explosion on 0
                }
                attackerRolls.push({ type: d.type, value: val, unitId: u.id, purpose: d.purpose });
              }
            });

            // Ooze Mage token bonus
            if (skill.id === 'OOZE_MAGE_UNIQUE' && !ranged) {
              const tokens = skill.tokens || 0;
              console.log(`[Ooze Mage] Unit ${u.id} has ${tokens} tokens. Rolling bonus dice.`);
              for (let i = 0; i < tokens; i++) {
                let val = rollDice('MANA');
                if (hasElfMageSkill && val === 0) val = -2;
                attackerRolls.push({ type: 'MANA', value: val, unitId: u.id, purpose: 'DAMAGE' });
              }
            }
          });
        });

        const defenderRolls: any[] = [];
        if (defenderId === 'monster' || defenderId === 'monster2' || defenderId === 'monster3') {
          const monsterIdx = prev.combatState?.monsterIndex || 0;
          if (defenderId === 'monster2' && monster2Stats && monster2AttackOption) {
            const stats = monster2Stats;
            const attackOption = monster2AttackOption;
            if (ranged) {
              for (let i = 0; i < attackOption.RANGED_MANA; i++) defenderRolls.push({ type: 'MANA', value: rollDice('MANA'), purpose: 'DAMAGE', unitId: 'monster2' });
              // Roll defense in ranged phase
              for (let i = 0; i < stats.defenseDice; i++) defenderRolls.push({ type: 'DEFENSE', value: rollDice('DEFENSE'), purpose: 'DEFENSE', unitId: 'monster2' });
            } else {
              for (let i = 0; i < attackOption.MELEE; i++) defenderRolls.push({ type: 'MELEE', value: rollDice('MELEE'), purpose: 'DAMAGE', unitId: 'monster2' });
              for (let i = 0; i < attackOption.MANA; i++) defenderRolls.push({ type: 'MANA', value: rollDice('MANA'), purpose: 'DAMAGE', unitId: 'monster2' });
              // Only roll defense if not already rolled
              if (!prev.combatState.hasAnyRanged) {
                const stats = MONSTER_LEVEL_2_STATS[0];
                for (let i = 0; i < stats.defenseDice; i++) defenderRolls.push({ type: 'DEFENSE', value: rollDice('DEFENSE'), purpose: 'DEFENSE', unitId: 'monster2' });
              }
            }
          } else if (defenderId === 'monster3' && monster3Stats && monster3AttackOption) {
            const stats = monster3Stats;
            const attackOption = monster3AttackOption;
            if (ranged) {
              for (let i = 0; i < attackOption.RANGED_MANA; i++) defenderRolls.push({ type: 'MANA', value: rollDice('MANA'), purpose: 'DAMAGE', unitId: 'monster3' });
              // Roll defense in ranged phase
              for (let i = 0; i < stats.defenseDice; i++) defenderRolls.push({ type: 'DEFENSE', value: rollDice('DEFENSE'), purpose: 'DEFENSE', unitId: 'monster3' });
              for (let i = 0; i < stats.manaDefenseDice; i++) defenderRolls.push({ type: 'MANA', value: rollDice('MANA'), purpose: 'DEFENSE', unitId: 'monster3' });
            } else {
              for (let i = 0; i < attackOption.MELEE; i++) defenderRolls.push({ type: 'MELEE', value: rollDice('MELEE'), purpose: 'DAMAGE', unitId: 'monster3' });
              for (let i = 0; i < attackOption.MANA; i++) defenderRolls.push({ type: 'MANA', value: rollDice('MANA'), purpose: 'DAMAGE', unitId: 'monster3' });
              // Only roll defense if not already rolled
              if (!prev.combatState.hasAnyRanged) {
                const stats = MONSTER_LEVEL_3_STATS[0];
                for (let i = 0; i < stats.defenseDice; i++) defenderRolls.push({ type: 'DEFENSE', value: rollDice('DEFENSE'), purpose: 'DEFENSE', unitId: 'monster3' });
                for (let i = 0; i < stats.manaDefenseDice; i++) defenderRolls.push({ type: 'MANA', value: rollDice('MANA'), purpose: 'DEFENSE', unitId: 'monster3' });
              }
            }
          } else {
            const tile = prev.board.find(t => t.q === prev.combatState?.q && t.r === prev.combatState?.r);
            const isBoss = tile?.type === TileType.BOSS;
            const monsterIdx = prev.combatState?.monsterIndex || 0;

            if (isBoss) {
              const stats = BOSS_STATS[monsterIdx];
              if (ranged) {
                // Roll defense in ranged phase
                for (let i = 0; i < stats.dice.DEFENSE; i++) defenderRolls.push({ type: 'DEFENSE', value: rollDice('DEFENSE'), purpose: 'DEFENSE', unitId: 'monster' });
                for (let i = 0; i < stats.dice.DEFENSE_MANA; i++) defenderRolls.push({ type: 'MANA', value: rollDice('MANA'), purpose: 'DEFENSE', unitId: 'monster' });
              } else {
                for (let i = 0; i < stats.dice.MANA; i++) defenderRolls.push({ type: 'MANA', value: rollDice('MANA'), purpose: 'DAMAGE', unitId: 'monster' });
                for (let i = 0; i < stats.dice.MELEE; i++) defenderRolls.push({ type: 'MELEE', value: rollDice('MELEE'), purpose: 'DAMAGE', unitId: 'monster' });
                // Only roll defense if not already rolled
                if (!prev.combatState.hasAnyRanged) {
                  for (let i = 0; i < stats.dice.DEFENSE; i++) defenderRolls.push({ type: 'DEFENSE', value: rollDice('DEFENSE'), purpose: 'DEFENSE', unitId: 'monster' });
                  for (let i = 0; i < stats.dice.DEFENSE_MANA; i++) defenderRolls.push({ type: 'MANA', value: rollDice('MANA'), purpose: 'DEFENSE', unitId: 'monster' });
                }
              }
            } else {
              const stats = MONSTER_STATS[monsterIdx];
              if (ranged) {
                // Roll defense in ranged phase
                stats.dice.filter((d: string) => d === 'DEFENSE').forEach((d: string) => {
                  defenderRolls.push({ type: d, value: rollDice(d), purpose: 'DEFENSE', unitId: 'monster' });
                });
              } else {
                stats.dice.forEach((d: string) => {
                  if (d !== 'DEFENSE' || !prev.combatState.hasAnyRanged) {
                    defenderRolls.push({ type: d, value: rollDice(d), purpose: d === 'DEFENSE' ? 'DEFENSE' : 'DAMAGE', unitId: 'monster' });
                  }
                });
              }
            }
          }
        } else {
          // Orc passive checks for defenders
          const defenderHasOrcKnightSkill = defenderUnits.some(u => {
            const owner = prev.players.find(p => p.id === u.playerId);
            return u.type === 'knight' && owner?.unitTypeSkills.knight.some(s => s?.id === 'ORC_KNIGHT_UNIQUE');
          });
          const defenderOrcMage = defenderUnits.find(u => {
            const owner = prev.players.find(p => p.id === u.playerId);
            return u.type === 'mage' && owner?.unitTypeSkills.mage.some(s => s?.id === 'ORC_MAGE_UNIQUE');
          });
          const defenderSharedSkill = defenderOrcMage ? (prev.players.find(p => p.id === defenderOrcMage.playerId)?.unitTypeSkills.mage[1]) : null;

          const defenderHasFlyingMageSkill = defenderUnits.some(u => {
            const owner = prev.players.find(p => p.id === u.playerId);
            return u.type === 'mage' && owner?.unitTypeSkills.mage.some(s => s?.id === 'FLYING_MAGE_UNIQUE');
          });

          defenderUnits.forEach(u => {
            if (u.hp <= 0) return; // Dead units don't roll
            const owner = prev.players.find(p => p.id === u.playerId);
            let skills = [...(owner?.unitTypeSkills[u.type] || [])];
            
            // Orc Mage sharing logic
            if (defenderSharedSkill && u.type !== 'mage') {
              skills.push(defenderSharedSkill);
            }

            const hasElfMageSkill = u.type === 'mage' && owner?.unitTypeSkills?.mage?.some(s => s?.id === 'ELF_MAGE_UNIQUE');

            skills.forEach(skill => {
              if (!skill) return;
              const isChannelling = prev.combatState?.channellingUnitIds?.includes(u.id);
              const isReadyToChannel = prev.combatState?.readyToChannelUnitIds?.includes(u.id);
              
              let dice: any[] = [];
              if (ranged) {
                // Ranged phase: roll ranged damage dice AND defense dice
                dice = getDiceFromSkill(skill, true);
                const defenseDice = getDiceFromSkill(skill, false).filter(d => d.purpose === 'DEFENSE');
                dice = [...dice, ...defenseDice];
              } else {
                // Melee phase: roll melee damage dice
                dice = getDiceFromSkill(skill, false).filter(d => d.purpose !== 'DEFENSE');
                // ONLY roll defense dice if they weren't rolled in ranged phase
                if (!prev.combatState.hasAnyRanged) {
                  const defenseDice = getDiceFromSkill(skill, false).filter(d => d.purpose === 'DEFENSE');
                  dice = [...dice, ...defenseDice];
                }
              }

              if (defenderHasFlyingMageSkill) {
                if (ranged) {
                  // In ranged phase, also add melee/mana damage dice
                  const meleeDice = getDiceFromSkill(skill, false);
                  const damageDice = meleeDice.filter(d => d.purpose === 'DAMAGE');
                  dice = [...dice, ...damageDice];
                } else {
                  // In melee phase, remove damage dice that were already rolled in ranged phase
                  dice = dice.filter(d => d.purpose !== 'DAMAGE');
                }
              }

              dice.forEach(d => {
                if (isChannelling && d.type === 'MANA') return; // Skip mana dice if channelling
                let count = d.count;
                for (let i = 0; i < count; i++) {
                  let diceType = d.type;
                  if (defenderHasOrcKnightSkill && diceType === 'MELEE') {
                    diceType = 'ORC_MELEE';
                  }
                  if (diceType === 'DEFENSE' && skills.some(s => s?.id === 'FLYING_KNIGHT_UNIQUE')) {
                    diceType = 'FLYING_DEFENSE';
                  }
                  let val = rollDice(diceType);
                  if (hasElfMageSkill && d.type === 'MANA' && val === 0) {
                    val = -2; // Elf Mage explosion on 0
                  }
                  defenderRolls.push({ type: d.type, value: val, unitId: u.id, purpose: d.purpose });
                }
              });

              // Ooze Mage token bonus
              if (skill.id === 'OOZE_MAGE_UNIQUE' && !ranged) {
                const tokens = skill.tokens || 0;
                console.log(`[Ooze Mage] Unit ${u.id} has ${tokens} tokens. Rolling bonus dice.`);
                for (let i = 0; i < tokens; i++) {
                  let val = rollDice('MANA');
                  if (hasElfMageSkill && val === 0) val = -2;
                  defenderRolls.push({ type: 'MANA', value: val, unitId: u.id, purpose: 'DAMAGE' });
                }
              }
            });
          });
        }
        return { attackerRolls, defenderRolls };
      };

      let { attackerRolls, defenderRolls } = rollDiceForPhase(isRangedPhase);

      // If it's ranged phase and no one has ranged skills, skip to melee roll
      if (isRangedPhase && attackerRolls.filter(r => r.purpose === 'DAMAGE').length === 0 && defenderRolls.filter(r => r.purpose === 'DAMAGE').length === 0) {
        isRangedPhase = false;
        nextPhase = 'MELEE_REROLL';
        const newRolls = rollDiceForPhase(isRangedPhase);
        attackerRolls = newRolls.attackerRolls;
        defenderRolls = newRolls.defenderRolls;
      }

      const getRerolls = (units: Unit[]) => {
        return units.reduce((sum, u) => {
          if (u.hp <= 0) return sum;
          const owner = prev.players.find(p => p.id === u.playerId);
          const skills = owner?.unitTypeSkills[u.type] || [];
          return sum + skills.filter(s => s && (s.effect?.toLowerCase().includes('reroll') || ['LUCKY_1', 'SWORD_2B', 'ARMOR_2B', 'MAGIC_2A', 'SWORD_3B', 'MAGIC_3A'].includes(s.id))).length;
        }, 0);
      };

      const applyLucky = (rolls: any[], units: Unit[], isBoss?: boolean, monsterLevel?: number) => {
          let rerollsAvailable = 0;
          const monsterIdx = prev.combatState?.monsterIndex || 0;
          if (isBoss) rerollsAvailable = BOSS_STATS[monsterIdx]?.rerolls || 0;
          else if (monsterLevel === 3) rerollsAvailable = MONSTER_LEVEL_3_STATS[monsterIdx]?.rerolls || 0;
          else if (monsterLevel === 2) rerollsAvailable = MONSTER_LEVEL_2_STATS[monsterIdx]?.rerolls || 0;
          else rerollsAvailable = getRerolls(units);

          // For monsters, apply automatically on 0s
          if (isBoss || monsterLevel) {
            let changed = true;
            while (changed && rerollsAvailable > 0) {
              changed = false;
              for (let i = 0; i < rolls.length && rerollsAvailable > 0; i++) {
                  if (rolls[i].value === 0) {
                      rolls[i].value = rollDice(rolls[i].type);
                      rolls[i].isRerolled = true;
                      rerollsAvailable--;
                      changed = true;
                  }
              }
            }
          }
          return rerollsAvailable;
      };

      const tile = prev.board.find(t => t.q === prev.combatState?.q && t.r === prev.combatState?.r);
      const isBossFight = defenderId === 'monster' && tile?.type === TileType.BOSS;

      // Monsters reroll automatically, players get a pool to use manually
      const attackerRerolls = applyLucky(attackerRolls, attackerUnits);
      let defenderRerolls = 0;
      if (defenderId !== 'monster' && defenderId !== 'monster2' && defenderId !== 'monster3') {
        defenderRerolls = applyLucky(defenderRolls, defenderUnits);
      } else if (isBossFight) {
        defenderRerolls = applyLucky(defenderRolls, [], true);
      } else {
        let mLevel = 1;
        if (defenderId === 'monster2') mLevel = 2;
        if (defenderId === 'monster3') mLevel = 3;
        defenderRerolls = applyLucky(defenderRolls, [], false, mLevel);
      }

      // Use remaining defense if we are in melee phase and defense was already rolled in ranged phase
      const wasRangedPhase = prev.combatState.hasAnyRanged;
      const aInitialDefense = (!isRangedPhase && wasRangedPhase) ? prev.combatState.attackerRemainingDefense : 0;
      const dInitialDefense = (!isRangedPhase && wasRangedPhase) ? prev.combatState.defenderRemainingDefense : 0;

      const totals = calculateCombatTotals(attackerRolls, defenderRolls, isBossFight, defenderId, aInitialDefense, dInitialDefense);

      const newPlayers = [...prev.players];
      if (typeof defenderId === 'number' && nextPhase === 'MELEE_REROLL') {
        // PvP Combat - track max damage
        const attacker = newPlayers.find(p => p.id === prev.combatState?.attackerId);
        if (attacker) {
          attacker.questProgress = {
            ...attacker.questProgress,
            maxPvpDamage: Math.max(attacker.questProgress.maxPvpDamage, totals.aDamage),
            maxPvpDefense: Math.max(attacker.questProgress.maxPvpDefense, totals.aDefense)
          };
        }
        const defender = newPlayers.find(p => p.id === defenderId);
        if (defender) {
          defender.questProgress = {
            ...defender.questProgress,
            maxPvpDamage: Math.max(defender.questProgress.maxPvpDamage, totals.dDamage),
            maxPvpDefense: Math.max(defender.questProgress.maxPvpDefense, totals.dDefense)
          };
        }
      }

      // Clear rolling state after animation
      setTimeout(() => {
        setGameState(s => {
          if (!s.combatState) return s;
          return {
            ...s,
            combatState: {
              ...s.combatState,
              isRolling: false
            }
          };
        });
      }, 2500);

      return {
        ...prev,
        players: newPlayers,
        combatState: {
          ...prev.combatState,
          attackerRolls,
          defenderRolls,
          attackerTotalDamage: totals.aDamage,
          defenderTotalDamage: totals.dDamage,
          attackerTotalDefense: totals.aDefense,
          defenderTotalDefense: totals.dDefense,
          attackerRemainingDefense: totals.aRemainingDefense,
          defenderRemainingDefense: totals.dRemainingDefense,
          hasAnyRanged,
          attackerRerolls,
          defenderRerolls,
          attackerDamageApplied: 0,
          defenderDamageApplied: 0,
          phase: nextPhase,
          isRolling: true,
          logs: [
            ...prev.combatState.logs,
            `[${isRangedPhase ? 'Ranged' : 'Melee'}] Initial Damage: Attacker deals ${totals.aDamage}, Defender deals ${totals.dDamage}.`
          ]
        }
      };
    });
  };

  const handleSelectInitialQuest = (questId: string) => {
    setGameState(prev => {
      const currentPlayerIndex = prev.currentPlayerIndex;
      const choices = prev.initialQuestChoices[currentPlayerIndex];
      const selectedQuest = choices.find(q => q.id === questId);
      const otherQuest = choices.find(q => q.id !== questId);
      if (!selectedQuest || !otherQuest) return prev;

      const newPlayers = [...prev.players];
      newPlayers[currentPlayerIndex] = { ...newPlayers[currentPlayerIndex], secretQuest: selectedQuest };

      const nextPlayerIndex = (currentPlayerIndex + 1) % prev.players.length;
      const isLastPlayer = nextPlayerIndex === 0;

      const newPublicQuests = [...prev.publicQuests];
      if (otherQuest && !newPublicQuests.some(q => q.id === otherQuest.id)) {
        newPublicQuests.push(otherQuest);
      }

      return {
        ...prev,
        players: newPlayers,
        publicQuests: newPublicQuests,
        currentPlayerIndex: isLastPlayer ? 0 : nextPlayerIndex,
        isSelectingInitialQuest: !isLastPlayer,
        logs: [...prev.logs, `${newPlayers[currentPlayerIndex].name} has chosen a secret quest.`]
      };
    });
  };

  const handleSelectAdvancedQuest = (questId: string) => {
    setGameState(prev => {
      const currentPlayerIndex = prev.currentPlayerIndex;
      const playerId = prev.players[currentPlayerIndex].id;
      const choices = prev.advancedQuestChoices[playerId];
      if (!choices) return prev;
      
      const selectedQuest = choices.find(q => q.id === questId);
      const otherQuest = choices.find(q => q.id !== questId);
      if (!selectedQuest || !otherQuest) return prev;

      const newPlayers = [...prev.players];
      newPlayers[currentPlayerIndex] = { ...newPlayers[currentPlayerIndex], secretQuest: selectedQuest };

      if (prev.gamePhase === 'YEAR_END_QUESTS') {
        const nextQuestIndex = prev.yearEndQuestIndex + 1;
        if (nextQuestIndex < prev.yearEndQuestOrder.length) {
          const nextPlayerId = prev.yearEndQuestOrder[nextQuestIndex];
          const nextPlayerIndex = prev.players.findIndex(p => p.id === nextPlayerId);
          return {
            ...prev,
            players: newPlayers,
            isSelectingAdvancedQuest: false,
            yearEndQuestIndex: nextQuestIndex,
            currentPlayerIndex: nextPlayerIndex,
            logs: [...prev.logs, `${newPlayers[currentPlayerIndex].name} has chosen an advanced secret quest.`]
          };
        } else {
          return getYearEndEventState({
            ...prev,
            players: newPlayers,
            isSelectingAdvancedQuest: false,
            logs: [...prev.logs, `${newPlayers[currentPlayerIndex].name} has chosen an advanced secret quest.`]
          });
        }
      }

      return {
        ...prev,
        players: newPlayers,
        isSelectingAdvancedQuest: false,
        logs: [...prev.logs, `${newPlayers[currentPlayerIndex].name} has chosen an advanced secret quest.`]
      };
    });
  };

  const checkQuestFulfillment = (player: Player, quest: Quest, board: HexTile[], units: Unit[], buildings: Building[]): boolean => {
    switch (quest.type) {
      case 'SPEND_GOLD':
        return player.gold >= quest.requirement;
      case 'SPEND_XP':
        return player.xp >= quest.requirement;
      case 'ADDED_SKILLS': {
        const warriorSkills = player.unitTypeSkills.warrior.filter(s => s !== null).length;
        const mageSkills = player.unitTypeSkills.mage.filter(s => s !== null).length;
        const knightSkills = player.unitTypeSkills.knight.filter(s => s !== null).length;
        const totalSkills = warriorSkills + mageSkills + knightSkills;
        const initialCount = player.initialSkillCount || 5;
        return (totalSkills - initialCount) >= quest.requirement;
      }
      case 'CASTLES':
        return buildings.filter(b => b.playerId === player.id && b.type === 'castle').length >= quest.requirement;
      case 'ADVENTURES':
        return player.questProgress.adventuresCompleted >= quest.requirement;
      case 'MONSTERS':
        return player.questProgress.monstersDefeated >= quest.requirement;
      case 'ENEMY_UNITS':
        return player.questProgress.enemyUnitsDefeated >= quest.requirement;
      case 'LEVEL_3_SKILLS': {
        const warriorSkills = player.unitTypeSkills.warrior.filter(s => s !== null && s.level === 3).length;
        const mageSkills = player.unitTypeSkills.mage.filter(s => s !== null && s.level === 3).length;
        const knightSkills = player.unitTypeSkills.knight.filter(s => s !== null && s.level === 3).length;
        return (warriorSkills + mageSkills + knightSkills) >= quest.requirement;
      }
      case 'PVP_LEVEL_3_UNIT':
        return player.questProgress.defeatedLevel3Unit;
      case 'UNIT_COMPOSITION': {
        const mages = units.filter(u => u.playerId === player.id && u.type === 'mage').length;
        const knights = units.filter(u => u.playerId === player.id && u.type === 'knight').length;
        return mages >= quest.requirement.mages && knights >= quest.requirement.knights;
      }
      case 'PVP_DAMAGE':
        return player.questProgress.maxPvpDamage >= quest.requirement;
      case 'CONTROL_HEXES': {
        const playerUnits = units.filter(u => u.playerId === player.id);
        const playerBuildings = buildings.filter(b => b.playerId === player.id);
        const controlledHexes = new Set<string>();
        playerUnits.forEach(u => controlledHexes.add(`${u.q},${u.r}`));
        playerBuildings.forEach(b => controlledHexes.add(`${b.q},${b.r}`));
        
        // Exclude capital
        const capitalHex = `${player.capitalPosition.q},${player.capitalPosition.r}`;
        controlledHexes.delete(capitalHex);
        
        return controlledHexes.size >= quest.requirement;
      }
      case 'PVP_DEFENSE':
        return player.questProgress.maxPvpDefense >= quest.requirement;
      case 'UNITS_IN_OLD_CITY': {
        const oldCityHexes = board.filter(t => t.type === TileType.ANCIENT_CITY);
        return oldCityHexes.some(hex => {
          const unitsInHex = units.filter(u => u.playerId === player.id && u.q === hex.q && u.r === hex.r);
          return unitsInHex.length >= quest.requirement;
        });
      }
      default:
        return false;
    }
  };

  const handleCompleteQuest = (questId: string, isSecret: boolean) => {
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      const quest = isSecret ? currentPlayer.secretQuest : prev.publicQuests.find(q => q.id === questId);
      
      if (!quest) return prev;
      
      if (!checkQuestFulfillment(currentPlayer, quest, prev.board, prev.units, prev.buildings)) {
        return {
          ...prev,
          isCompletingQuest: false,
          logs: [...prev.logs, `Requirements for ${quest.description} not met.`]
        };
      }

      if (quest.type === 'SPEND_GOLD' && currentPlayer.gold < quest.requirement) {
        return {
          ...prev,
          isCompletingQuest: false,
          logs: [...prev.logs, `Not enough gold to complete ${quest.description}.`]
        };
      }

      if (quest.type === 'SPEND_XP' && currentPlayer.xp < quest.requirement) {
        return {
          ...prev,
          isCompletingQuest: false,
          logs: [...prev.logs, `Not enough XP to complete ${quest.description}.`]
        };
      }

      const newPlayers = [...prev.players];
      const p = { ...newPlayers[prev.currentPlayerIndex] };
      newPlayers[prev.currentPlayerIndex] = p;
      
      // Deduct resources if applicable
      if (quest.type === 'SPEND_GOLD') p.gold -= quest.requirement;
      if (quest.type === 'SPEND_XP') p.xp -= quest.requirement;

      p.score += quest.rewardVP;
      
      let newPublicQuests = [...prev.publicQuests];
      let isSelectingAdvancedQuest = false;
      let advancedQuestChoices = { ...prev.advancedQuestChoices };
      let newAdvancedQuestDeck = [...prev.advancedQuestDeck];

      if (isSecret) {
        p.secretQuest = null;
        // If it was an initial quest (1 VP), offer advanced quests
        if (quest.rewardVP === 1) {
          isSelectingAdvancedQuest = true;
          const choices = newAdvancedQuestDeck.splice(0, 2);
          advancedQuestChoices[p.id] = choices;
        }
      } else {
        newPublicQuests = newPublicQuests.filter(q => q.id !== questId);
      }

      const win = (p.score + getAncientCityVP(p.id, prev.board, prev.units, prev.buildings)) >= 10;

      if (p.isAI) {
        const newInsights = prev.aiInsights ? { ...prev.aiInsights } : {
          actionSuccessRates: {} as Record<ActionType, number>,
          preferredPersonalities: {} as Record<string, number>
        };
        const currentRate = newInsights.actionSuccessRates[ActionType.COMPLETE_QUEST] ?? 0.5;
        newInsights.actionSuccessRates[ActionType.COMPLETE_QUEST] = currentRate * 0.9 + 0.1;

        if (prev.gamePhase === 'YEAR_END_QUESTS' && !isSelectingAdvancedQuest) {
          const nextQuestIndex = prev.yearEndQuestIndex + 1;
          if (nextQuestIndex < prev.yearEndQuestOrder.length) {
            const nextPlayerId = prev.yearEndQuestOrder[nextQuestIndex];
            const nextPlayerIndex = prev.players.findIndex(p => p.id === nextPlayerId);
            return {
              ...prev,
              players: newPlayers,
              publicQuests: newPublicQuests,
              isCompletingQuest: false,
              isSelectingAdvancedQuest,
              advancedQuestChoices,
              advancedQuestDeck: newAdvancedQuestDeck,
              isGameOver: win,
              yearEndQuestIndex: nextQuestIndex,
              currentPlayerIndex: nextPlayerIndex,
              aiInsights: newInsights,
              logs: [...prev.logs, `${p.name} completed quest: ${quest.description}! +${quest.rewardVP} VP.`]
            };
          } else {
            return getYearEndEventState({
              ...prev,
              players: newPlayers,
              publicQuests: newPublicQuests,
              isCompletingQuest: false,
              isSelectingAdvancedQuest,
              advancedQuestChoices,
              advancedQuestDeck: newAdvancedQuestDeck,
              isGameOver: win,
              aiInsights: newInsights,
              logs: [...prev.logs, `${p.name} completed quest: ${quest.description}! +${quest.rewardVP} VP.`]
            });
          }
        }

        return {
          ...prev,
          players: newPlayers,
          publicQuests: newPublicQuests,
          isCompletingQuest: false,
          isSelectingAdvancedQuest,
          advancedQuestChoices,
          advancedQuestDeck: newAdvancedQuestDeck,
          isGameOver: win,
          freeProductionActions: prev.freeProductionActions,
          activeActionType: null,
          actionSnapshot: null,
          aiInsights: newInsights,
          logs: [...prev.logs, `${p.name} completed quest: ${quest.description}! +${quest.rewardVP} VP.`]
        };
      }

      if (prev.gamePhase === 'YEAR_END_QUESTS' && !isSelectingAdvancedQuest) {
        const nextQuestIndex = prev.yearEndQuestIndex + 1;
        if (nextQuestIndex < prev.yearEndQuestOrder.length) {
          const nextPlayerId = prev.yearEndQuestOrder[nextQuestIndex];
          const nextPlayerIndex = prev.players.findIndex(p => p.id === nextPlayerId);
          return {
            ...prev,
            players: newPlayers,
            publicQuests: newPublicQuests,
            isCompletingQuest: false,
            isSelectingAdvancedQuest,
            advancedQuestChoices,
            advancedQuestDeck: newAdvancedQuestDeck,
            isGameOver: win,
            yearEndQuestIndex: nextQuestIndex,
            currentPlayerIndex: nextPlayerIndex,
            logs: [...prev.logs, `${p.name} completed quest: ${quest.description}! +${quest.rewardVP} VP.`]
          };
        } else {
          return getYearEndEventState({
            ...prev,
            players: newPlayers,
            publicQuests: newPublicQuests,
            isCompletingQuest: false,
            isSelectingAdvancedQuest,
            advancedQuestChoices,
            advancedQuestDeck: newAdvancedQuestDeck,
            isGameOver: win,
            logs: [...prev.logs, `${p.name} completed quest: ${quest.description}! +${quest.rewardVP} VP.`]
          });
        }
      }

      return {
        ...prev,
        players: newPlayers,
        publicQuests: newPublicQuests,
        isCompletingQuest: false,
        isSelectingAdvancedQuest,
        advancedQuestChoices,
        advancedQuestDeck: newAdvancedQuestDeck,
        isGameOver: win,
        freeProductionActions: prev.freeProductionActions,
        activeActionType: null,
        actionSnapshot: null,
        logs: [...prev.logs, `${p.name} completed quest: ${quest.description}! +${quest.rewardVP} VP.`]
      };
    });
  };

  const handleYearEndQuestSkip = () => {
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      const nextQuestIndex = prev.yearEndQuestIndex + 1;
      const newLogs = [...prev.logs, `${currentPlayer.name} skipped the year-end quest option.`];
      
      if (nextQuestIndex < prev.yearEndQuestOrder.length) {
        const nextPlayerId = prev.yearEndQuestOrder[nextQuestIndex];
        const nextPlayerIndex = prev.players.findIndex(p => p.id === nextPlayerId);
        return {
          ...prev,
          yearEndQuestIndex: nextQuestIndex,
          currentPlayerIndex: nextPlayerIndex,
          logs: newLogs
        };
      } else {
        return getYearEndEventState({
          ...prev,
          logs: newLogs
        });
      }
    });
  };

  const handleFinishReroll = () => {
    setGameState(prev => {
      if (!prev.combatState) return prev;
      const combat = { ...prev.combatState };
      if (combat.phase === 'RANGED_REROLL') {
        combat.phase = 'RANGED_APPLY';
      } else if (combat.phase === 'MELEE_REROLL') {
        combat.phase = 'MELEE_APPLY';
      }
      return { ...prev, combatState: combat };
    });
  };

  const handleRerollDice = (participant: 'attacker' | 'defender', rollIndex: number) => {
    setGameState(prev => {
      if (!prev.combatState) return prev;
      const combat = { ...prev.combatState };
      const rolls = participant === 'attacker' ? [...combat.attackerRolls] : [...combat.defenderRolls];
      const rerolls = participant === 'attacker' ? combat.attackerRerolls : combat.defenderRerolls;

      if (rerolls <= 0) return prev;

      const roll = { ...rolls[rollIndex] };
      let diceType = roll.type;

      // Check for Orc Knight skill
      const combatUnits = participant === 'attacker' ? combat.attackerUnits : combat.defenderUnits;
      const hasOrcKnightSkill = combatUnits.some(u => {
        const uOwner = prev.players.find(p => p.id === u.playerId);
        return u.type === 'knight' && uOwner?.unitTypeSkills.knight.some(s => s?.id === 'ORC_KNIGHT_UNIQUE');
      });

      if (hasOrcKnightSkill && diceType === 'MELEE') {
        diceType = 'ORC_MELEE';
      }

      let newVal = rollDice(diceType);

      // Check for Elf Mage skill
      const unit = prev.units.find(u => u.id === roll.unitId);
      const owner = prev.players.find(p => p.id === unit?.playerId);
      const hasElfMageSkill = unit?.type === 'mage' && owner?.unitTypeSkills.mage.some(s => s?.id === 'ELF_MAGE_UNIQUE');
      
      if (hasElfMageSkill && roll.type === 'MANA' && newVal === 0) {
          newVal = -2;
      }

      roll.value = newVal;
      roll.isRerolled = true;
      roll.isRolling = true;
      rolls[rollIndex] = roll;

      if (participant === 'attacker') {
        combat.attackerRolls = rolls;
        combat.attackerRerolls -= 1;
      } else {
        combat.defenderRolls = rolls;
        combat.defenderRerolls -= 1;
      }

      // Recalculate totals
      const tile = prev.board.find(t => t.q === combat.q && t.r === combat.r);
      const isBossFight = combat.defenderId === 'monster' && tile?.type === TileType.BOSS;

      const totals = calculateCombatTotals(combat.attackerRolls, combat.defenderRolls, isBossFight, combat.defenderId);

      combat.attackerTotalDamage = Math.max(0, totals.aDamage - combat.defenderDamageApplied);
      combat.defenderTotalDamage = Math.max(0, totals.dDamage - combat.attackerDamageApplied);
      combat.attackerTotalDefense = totals.aDefense;
      combat.defenderTotalDefense = totals.dDefense;

      combat.logs = [...combat.logs, `${participant === 'attacker' ? 'Attacker' : 'Defender'} rerolled a ${roll.type} die: new value ${roll.value}`];

      // Clear rolling state after animation
      setTimeout(() => {
        setGameState(s => {
          if (!s.combatState) return s;
          const updatedCombat = { ...s.combatState };
          const pRolls = participant === 'attacker' ? [...updatedCombat.attackerRolls] : [...updatedCombat.defenderRolls];
          if (pRolls[rollIndex]) {
            pRolls[rollIndex] = { ...pRolls[rollIndex], isRolling: false };
          }
          if (participant === 'attacker') updatedCombat.attackerRolls = pRolls;
          else updatedCombat.defenderRolls = pRolls;
          return { ...s, combatState: updatedCombat };
        });
      }, 1500);

      return { ...prev, combatState: combat };
    });
  };

  const handleResolveExplosion = (participant: 'attacker' | 'defender', rollIndex: number) => {
    setGameState(prev => {
      if (!prev.combatState) return prev;
      const combat = { ...prev.combatState };
      
      // Ensure we work with fresh arrays
      const attackerRolls = [...combat.attackerRolls];
      const defenderRolls = [...combat.defenderRolls];
      const rolls = participant === 'attacker' ? attackerRolls : defenderRolls;
      
      if (rolls[rollIndex].value !== -1 && rolls[rollIndex].value !== -2) return prev;

      const isZeroExplosion = rolls[rollIndex].value === -2;

      // Original die becomes 1 for standard, 0 for zero explosion
      const updatedRoll = { ...rolls[rollIndex], value: isZeroExplosion ? 0 : 1 };
      rolls[rollIndex] = updatedRoll;
      
      // Add new die of same type
      let newVal = rollDice(updatedRoll.type);

      // Check for Elf Mage skill again for the new die
      const unit = prev.units.find(u => u.id === updatedRoll.unitId);
      const owner = prev.players.find(p => p.id === unit?.playerId);
      const hasElfMageSkill = unit?.type === 'mage' && owner?.unitTypeSkills.mage.some(s => s?.id === 'ELF_MAGE_UNIQUE');
      
      if (hasElfMageSkill && updatedRoll.type === 'MANA' && newVal === 0) {
          newVal = -2;
      }

      const newRoll = {
        type: updatedRoll.type,
        value: newVal,
        unitId: updatedRoll.unitId,
        purpose: updatedRoll.purpose,
        isRolling: true
      };
      
      rolls.push(newRoll);

      if (participant === 'attacker') {
        combat.attackerRolls = attackerRolls;
      } else {
        combat.defenderRolls = defenderRolls;
      }

      // Recalculate totals
      const tile = prev.board.find(t => t.q === combat.q && t.r === combat.r);
      const isBossFight = combat.defenderId === 'monster' && tile?.type === TileType.BOSS;

      const totals = calculateCombatTotals(combat.attackerRolls, combat.defenderRolls, isBossFight, combat.defenderId);

      combat.attackerTotalDamage = Math.max(0, totals.aDamage - combat.defenderDamageApplied);
      combat.defenderTotalDamage = Math.max(0, totals.dDamage - combat.attackerDamageApplied);
      combat.attackerTotalDefense = totals.aDefense;
      combat.defenderTotalDefense = totals.dDefense;

      combat.logs = [...combat.logs, `${participant === 'attacker' ? 'Attacker' : 'Defender'} resolved a mana explosion! Bonus die rolled ${newRoll.value}`];

      // Clear rolling state after animation
      setTimeout(() => {
        setGameState(s => {
          if (!s.combatState) return s;
          const updatedCombat = { ...s.combatState };
          const pRolls = participant === 'attacker' ? [...updatedCombat.attackerRolls] : [...updatedCombat.defenderRolls];
          const lastIdx = pRolls.length - 1;
          if (pRolls[lastIdx]) {
            pRolls[lastIdx] = { ...pRolls[lastIdx], isRolling: false };
          }
          if (participant === 'attacker') updatedCombat.attackerRolls = pRolls;
          else updatedCombat.defenderRolls = pRolls;
          return { ...s, combatState: updatedCombat };
        });
      }, 1500);

      return { ...prev, combatState: combat };
    });
  };

  const handleToggleChannel = (unitId: string) => {
    setGameState(prev => {
      if (!prev.combatState) return prev;
      const channelling = prev.combatState.channellingUnitIds || [];
      const newChannelling = channelling.includes(unitId)
        ? channelling.filter(id => id !== unitId)
        : [...channelling, unitId];
      return {
        ...prev,
        combatState: {
          ...prev.combatState,
          channellingUnitIds: newChannelling
        }
      };
    });
  };

  const handleApplyCombatDamage = (participant: 'attacker' | 'defender', unitId: string | 'monster' | 'monster2' | 'monster3') => {
    setGameState(prev => {
      if (!prev.combatState) return prev;
      const combat = prev.combatState;
      const newPlayers = prev.players.map(p => ({
        ...p,
        questProgress: { ...p.questProgress },
        unitTypeSkills: {
          warrior: [...p.unitTypeSkills.warrior],
          mage: [...p.unitTypeSkills.mage],
          knight: [...p.unitTypeSkills.knight]
        }
      }));
      let newUnits = [...prev.units];
      let newAttackerUnits = [...combat.attackerUnits];
      let newDefenderUnits = [...combat.defenderUnits];
      let newBoard = [...prev.board];
      let attackerDamageLeft = combat.defenderTotalDamage;
      let defenderDamageLeft = combat.attackerTotalDamage;
      let isGameOver = prev.isGameOver;
      let newPendingOozeSkillLevel = combat.pendingOozeSkillLevel || null;
      let newOozeSkillGranted = combat.oozeSkillGranted || false;
      let newGoldGained = combat.goldGained || 0;
      let newXpGained = combat.xpGained || 0;
      let newDefenderGoldGained = combat.defenderGoldGained || 0;
      let newDefenderXpGained = combat.defenderXpGained || 0;
      let newDefeatedUnitNames = [...(combat.defeatedUnitNames || [])];
      let newAttackerDamageApplied = combat.attackerDamageApplied || 0;
      let newDefenderDamageApplied = combat.defenderDamageApplied || 0;

      if (participant === 'attacker') {
        if (attackerDamageLeft <= 0) return prev;
        const unitIndex = newAttackerUnits.findIndex(u => u.id === unitId);
        if (unitIndex !== -1 && newAttackerUnits[unitIndex].hp > 0) {
          const unit = { ...newAttackerUnits[unitIndex] };
          unit.hp -= 1;
          attackerDamageLeft -= 1;
          newAttackerDamageApplied += 1;
          
          if (unit.hp <= 0) {
            // Unit defeated!
            newDefeatedUnitNames.push(`${unit.type} (${unit.id})`);
            // Defender gets 2XP per enemy unit defeated
            if (combat.defenderId !== 'monster' && combat.defenderId !== 'monster2' && combat.defenderId !== 'monster3') {
               const defenderPlayer = newPlayers.find(p => p.id === combat.defenderId);
               if (defenderPlayer) {
                 defenderPlayer.xp += 2;
                 newDefenderXpGained += 2;
                 defenderPlayer.questProgress.enemyUnitsDefeated += 1;

                 if (defenderPlayer.faction === 'ooze') {
                   const hasMageInCombat = combat.defenderUnits.some(u => u.type === 'mage');
                   const hasKnightInCombat = combat.defenderUnits.some(u => u.type === 'knight');

                   const mageSkillIndex = defenderPlayer.unitTypeSkills.mage.findIndex(s => s?.id === 'OOZE_MAGE_UNIQUE');
                   if (mageSkillIndex !== -1 && hasMageInCombat) {
                     const originalSkill = defenderPlayer.unitTypeSkills.mage[mageSkillIndex];
                     if (originalSkill) {
                       const skill = { ...originalSkill };
                       skill.tokens = Math.min((skill.tokens || 0) + 1, 3);
                       defenderPlayer.unitTypeSkills.mage[mageSkillIndex] = skill;
                     }
                   }
                   
                   if (!newOozeSkillGranted && hasKnightInCombat) {
                     const knightSkill = defenderPlayer.unitTypeSkills.knight.find(s => s?.id === 'OOZE_KNIGHT_UNIQUE');
                     if (knightSkill) {
                       const ownerPlayer = prev.players.find(p => p.id === unit.playerId);
                       const defeatedLevel = ownerPlayer ? ownerPlayer.unitLevels[unit.type] : 1;
                       newPendingOozeSkillLevel = defeatedLevel;
                       newOozeSkillGranted = true;
                     }
                   }
                 }
               }
            }

            // Move back to capital
            const ownerPlayer = newPlayers.find(p => p.id === unit.playerId);
            if (ownerPlayer) {
              unit.q = ownerPlayer.capitalPosition.q;
              unit.r = ownerPlayer.capitalPosition.r;
              unit.hp = unit.maxHp;
              unit.isExhausted = true;
              // If it's the current player's turn, it needs to last through this endTurn and the next endTurn
              unit.exhaustionRemainingTurns = (unit.playerId === prev.players[prev.currentPlayerIndex].id) ? 2 : 1;
            }
            
            // Remove from combat modal
            newAttackerUnits.splice(unitIndex, 1);
          } else {
            newAttackerUnits[unitIndex] = unit;
          }
          
          // Update global units list
          const globalUnitIndex = newUnits.findIndex(u => u.id === unitId);
          if (globalUnitIndex !== -1) {
            newUnits[globalUnitIndex] = unit;
          }
        }
      } else {
        if (defenderDamageLeft <= 0) return prev;
        if (unitId === 'monster' || unitId === 'monster2' || unitId === 'monster3') {
          defenderDamageLeft -= 1;
          newDefenderDamageApplied += 1;
          const currentMonsterHp = combat.monsterHp ?? 1;
          const newMonsterHp = Math.max(0, currentMonsterHp - 1);

          const tileIndex = prev.board.findIndex(t => t.q === combat.q && t.r === combat.r);
          const tile = prev.board[tileIndex];
          const isBoss = tile?.type === TileType.BOSS;
          const monsterIdx = combat.monsterIndex || 0;
          const currentMonsterStats = isBoss ? BOSS_STATS[monsterIdx] : 
                                     unitId === 'monster3' ? MONSTER_LEVEL_3_STATS[monsterIdx] :
                                     unitId === 'monster2' ? MONSTER_LEVEL_2_STATS[monsterIdx] :
                                     MONSTER_STATS[monsterIdx];

          if (newMonsterHp <= 0) {
            // Monster defeated!
            newDefeatedUnitNames.push(currentMonsterStats?.name || 'Monster');
            
            // Remove monster from board if it was a Monsters Out monster
            if (tile?.monsterLevel) {
              newBoard[tileIndex] = {
                ...tile,
                monsterLevel: undefined
              };
            }

            const attackerPlayer = newPlayers.find(p => p.id === combat.attackerId);
            if (attackerPlayer) {
              if (attackerPlayer.faction === 'ooze') {
                const hasMageInCombat = combat.attackerUnits.some(u => u.type === 'mage');
                const hasKnightInCombat = combat.attackerUnits.some(u => u.type === 'knight');

                const mageSkillIndex = attackerPlayer.unitTypeSkills.mage.findIndex(s => s?.id === 'OOZE_MAGE_UNIQUE');
                if (mageSkillIndex !== -1 && hasMageInCombat) {
                  const originalSkill = attackerPlayer.unitTypeSkills.mage[mageSkillIndex];
                  if (originalSkill) {
                    const skill = { ...originalSkill };
                    skill.tokens = Math.min((skill.tokens || 0) + 1, 3);
                    attackerPlayer.unitTypeSkills.mage[mageSkillIndex] = skill;
                  }
                }
                
                if (!newOozeSkillGranted && hasKnightInCombat) {
                  const knightSkill = attackerPlayer.unitTypeSkills.knight.find(s => s?.id === 'OOZE_KNIGHT_UNIQUE');
                  if (knightSkill) {
                    let defeatedLevel = 1;
                    if (unitId === 'monster2') defeatedLevel = 2;
                    else if (unitId === 'monster3' || (unitId === 'monster' && isBoss)) defeatedLevel = 3;
                    
                    newPendingOozeSkillLevel = defeatedLevel;
                    newOozeSkillGranted = true;
                  }
                }
              }
              
              if (isBoss && unitId === 'monster') {
                const stats = BOSS_STATS[combat.monsterIndex || 0];
                attackerPlayer.xp += stats.rewards.xp;
                attackerPlayer.gold += stats.rewards.gold;
                newXpGained += stats.rewards.xp;
                newGoldGained += stats.rewards.gold;
                attackerPlayer.score += stats.rewards.vp;
                
                if (attackerPlayer.score + getAncientCityVP(attackerPlayer.id, newBoard, newUnits, prev.buildings) >= 10) {
                  isGameOver = true;
                }
                
                // Change boss tile to Ancient City after defeat
                newBoard[tileIndex] = {
                    ...tile,
                    type: TileType.ANCIENT_CITY,
                    productionGold: 0,
                    productionXP: 0,
                    castleSlots: 0
                };
              } else if (unitId === 'monster3') {
                const stats = MONSTER_LEVEL_3_STATS[combat.monsterIndex || 0];
                attackerPlayer.xp += stats.rewards.xp;
                attackerPlayer.gold += stats.rewards.gold;
                newXpGained += stats.rewards.xp;
                newGoldGained += stats.rewards.gold;
                if (attackerPlayer.questProgress.level3MonstersDefeated === 0) {
                  attackerPlayer.score += stats.rewards.vp;
                }
                attackerPlayer.questProgress.level3MonstersDefeated += 1;
              } else if (unitId === 'monster2') {
                const stats = MONSTER_LEVEL_2_STATS[combat.monsterIndex || 0];
                attackerPlayer.xp += stats.rewards.xp;
                attackerPlayer.gold += stats.rewards.gold;
                newXpGained += stats.rewards.xp;
                newGoldGained += stats.rewards.gold;
                if (attackerPlayer.questProgress.level2MonstersDefeated === 0) {
                  attackerPlayer.score += stats.rewards.vp;
                }
                attackerPlayer.questProgress.level2MonstersDefeated += 1;
              } else if (unitId === 'monster') {
                const stats = MONSTER_STATS[combat.monsterIndex || 0];
                attackerPlayer.xp += stats.rewards.xp;
                attackerPlayer.gold += stats.rewards.gold;
                newXpGained += stats.rewards.xp;
                newGoldGained += stats.rewards.gold;
              }
              
              if (!isBoss) {
                attackerPlayer.questProgress.monstersDefeated += 1;
              }
            }
          }
        } else {
          const unitIndex = newDefenderUnits.findIndex(u => u.id === unitId);
          if (unitIndex !== -1 && newDefenderUnits[unitIndex].hp > 0) {
            const unit = { ...newDefenderUnits[unitIndex] };
            unit.hp -= 1;
            defenderDamageLeft -= 1;
            newDefenderDamageApplied += 1;

            if (unit.hp <= 0) {
              // Unit defeated!
              newDefeatedUnitNames.push(`${unit.type} (${unit.id})`);
              // Attacker gets 2XP per enemy unit defeated
              const attackerPlayer = newPlayers.find(p => p.id === combat.attackerId);
              if (attackerPlayer) {
                attackerPlayer.xp += 2;
                newXpGained += 2;
                attackerPlayer.questProgress.enemyUnitsDefeated += 1;

                if (attackerPlayer.faction === 'ooze') {
                  const hasMageInCombat = combat.attackerUnits.some(u => u.type === 'mage');
                  const hasKnightInCombat = combat.attackerUnits.some(u => u.type === 'knight');

                  const mageSkillIndex = attackerPlayer.unitTypeSkills.mage.findIndex(s => s?.id === 'OOZE_MAGE_UNIQUE');
                  if (mageSkillIndex !== -1 && hasMageInCombat) {
                    const originalSkill = attackerPlayer.unitTypeSkills.mage[mageSkillIndex];
                    if (originalSkill) {
                      const skill = { ...originalSkill };
                      skill.tokens = Math.min((skill.tokens || 0) + 1, 3);
                      attackerPlayer.unitTypeSkills.mage[mageSkillIndex] = skill;
                    }
                  }
                  
                  if (!newOozeSkillGranted && hasKnightInCombat) {
                    const knightSkill = attackerPlayer.unitTypeSkills.knight.find(s => s?.id === 'OOZE_KNIGHT_UNIQUE');
                    if (knightSkill) {
                      const defenderOwner = prev.players.find(p => p.id === unit.playerId);
                      const defeatedLevel = defenderOwner ? defenderOwner.unitLevels[unit.type] : 1;
                      newPendingOozeSkillLevel = defeatedLevel;
                      newOozeSkillGranted = true;
                    }
                  }
                }
                
                // Track level 3 unit defeat
                const defenderOwner = prev.players.find(p => p.id === unit.playerId);
                if (defenderOwner && defenderOwner.unitLevels[unit.type] === 3) {
                  attackerPlayer.questProgress.defeatedLevel3Unit = true;
                }
                
                if (attackerPlayer.score + getAncientCityVP(attackerPlayer.id, newBoard, newUnits, prev.buildings) >= 10) {
                  isGameOver = true;
                }
              }

              // Move back to capital
              const ownerPlayer = newPlayers.find(p => p.id === unit.playerId);
              if (ownerPlayer) {
                unit.q = ownerPlayer.capitalPosition.q;
                unit.r = ownerPlayer.capitalPosition.r;
                unit.hp = unit.maxHp;
                unit.isExhausted = true;
                // If it's the current player's turn, it needs to last through this endTurn and the next endTurn
                unit.exhaustionRemainingTurns = (unit.playerId === prev.players[prev.currentPlayerIndex].id) ? 2 : 1;
              }
              
              // Remove from combat modal
              newDefenderUnits.splice(unitIndex, 1);
            } else {
              newDefenderUnits[unitIndex] = unit;
            }
            
            // Update global units list
            const globalUnitIndex = newUnits.findIndex(u => u.id === unitId);
            if (globalUnitIndex !== -1) {
              newUnits[globalUnitIndex] = unit;
            }
          }
        }
      }

      const newMonsterHp = (unitId === 'monster' || unitId === 'monster2' || unitId === 'monster3') ? Math.max(0, (combat.monsterHp ?? 1) - 1) : combat.monsterHp;
      const isMonsterDead = (combat.defenderId === 'monster' || combat.defenderId === 'monster2' || combat.defenderId === 'monster3') && newMonsterHp === 0;
      const isDefenderDead = newDefenderUnits.length === 0 && (combat.defenderId !== 'monster' && combat.defenderId !== 'monster2' && combat.defenderId !== 'monster3');
      const isAttackerDead = newAttackerUnits.length === 0;

      const isDamagePhaseOver = (attackerDamageLeft === 0 || isAttackerDead) && 
                               (defenderDamageLeft === 0 || isDefenderDead || isMonsterDead);
      
      let finalCombatState = {
        ...combat,
        attackerUnits: newAttackerUnits,
        defenderUnits: newDefenderUnits,
        attackerTotalDamage: defenderDamageLeft,
        defenderTotalDamage: attackerDamageLeft,
        monsterHp: newMonsterHp,
        logs: [...combat.logs, `Damage applied to ${unitId}.`],
        pendingOozeSkillLevel: newPendingOozeSkillLevel,
        oozeSkillGranted: newOozeSkillGranted,
        goldGained: newGoldGained,
        xpGained: newXpGained,
        defenderGoldGained: newDefenderGoldGained,
        defenderXpGained: newDefenderXpGained,
        defeatedUnitNames: newDefeatedUnitNames,
        attackerDamageApplied: newAttackerDamageApplied,
        defenderDamageApplied: newDefenderDamageApplied
      };

      if (isDamagePhaseOver) {
        if (isMonsterDead || isDefenderDead || isAttackerDead) {
          finalCombatState.isResolved = true;
          finalCombatState.phase = 'RESOLVED';
        } else if (finalCombatState.phase === 'MELEE_APPLY') {
          const channelling = finalCombatState.channellingUnitIds || [];
          if (channelling.length > 0) {
            // Roll doubled mana dice for surviving channelling units
            const newAttackerRolls = [...finalCombatState.attackerRolls];
            const newDefenderRolls = [...finalCombatState.defenderRolls];
            let addedRolls = false;

            channelling.forEach(cid => {
              const u = newUnits.find(unit => unit.id === cid);
              if (u && u.hp > 0) {
                const owner = newPlayers.find(p => p.id === u.playerId);
                const skills = owner?.unitTypeSkills[u.type] || [];
                const mageSkill = skills.find(s => s?.id === 'DWARF_MAGE_UNIQUE');
                if (mageSkill) {
                  // Double ALL mana dice of the unit
                  const manaDice = skills.flatMap(s => s ? getDiceFromSkill(s, false).filter(d => d.type === 'MANA') : []);
                  manaDice.forEach(d => {
                    for (let i = 0; i < d.count * 2; i++) {
                      const val = rollDice('MANA');
                      const roll: CombatRoll = { type: 'MANA', value: val, unitId: u.id, purpose: d.purpose as 'DAMAGE' | 'DEFENSE' };
                      if (u.playerId === prev.combatState?.attackerId) {
                        newAttackerRolls.push(roll);
                      } else {
                        newDefenderRolls.push(roll);
                      }
                      addedRolls = true;
                    }
                  });
                }
              }
            });

            if (addedRolls) {
              finalCombatState.attackerRolls = newAttackerRolls;
              finalCombatState.defenderRolls = newDefenderRolls;
              
              // Recalculate totals correctly
              const tile = prev.board.find(t => t.q === combat.q && t.r === combat.r);
              const isBossFight = combat.defenderId === 'monster' && tile?.type === TileType.BOSS;
              const totals = calculateCombatTotals(newAttackerRolls, newDefenderRolls, isBossFight, combat.defenderId);

              finalCombatState.attackerTotalDamage = Math.max(0, totals.aDamage - newDefenderDamageApplied);
              finalCombatState.defenderTotalDamage = Math.max(0, totals.dDamage - newAttackerDamageApplied);
              finalCombatState.attackerTotalDefense = totals.aDefense;
              finalCombatState.defenderTotalDefense = totals.dDefense;
              
              // Clear channelling so we don't roll again
              finalCombatState.channellingUnitIds = [];
              // Stay in MELEE_APPLY so user can resolve explosions and click Apply Damage
              finalCombatState.logs = [...finalCombatState.logs, "Channelling complete! Doubled mana dice rolled."];
              
              return {
                ...prev,
                players: newPlayers,
                units: newUnits,
                board: newBoard,
                isGameOver,
                combatState: finalCombatState
              };
            }
          }

          // Continue to next round
          finalCombatState.phase = 'INIT';
          finalCombatState.attackerRolls = [];
          finalCombatState.defenderRolls = [];
          finalCombatState.attackerTotalDamage = 0;
          finalCombatState.defenderTotalDamage = 0;
          finalCombatState.attackerTotalDefense = 0;
          finalCombatState.defenderTotalDefense = 0;
          finalCombatState.attackerRerolls = 0;
          finalCombatState.defenderRerolls = 0;
          finalCombatState.attackerDamageApplied = 0;
          finalCombatState.defenderDamageApplied = 0;
          finalCombatState.channellingUnitIds = []; // Clear current channelling
          finalCombatState.readyToChannelUnitIds = [];
          finalCombatState.logs = [...finalCombatState.logs, "Round finished. Starting next round..."];
        }
      }

      return {
        ...prev,
        players: newPlayers,
        units: newUnits,
        board: newBoard,
        isGameOver,
        combatState: finalCombatState
      };
    });
  };

  const handleNextRound = () => {
    setGameState(prev => {
      if (!prev.combatState) return prev;
      
      const attacker = prev.players.find(p => p.id === prev.combatState?.attackerId);
      const defender = typeof prev.combatState?.defenderId === 'number' ? prev.players.find(p => p.id === prev.combatState?.defenderId) : null;
      const isAIOnly = attacker?.isAI && (!defender || defender.isAI);

      return {
        ...prev,
        isPaused: (isAIOnly && prev.pauseOnAICombat) ? true : prev.isPaused,
        combatState: {
          ...prev.combatState,
          phase: 'INIT',
          attackerRolls: [],
          defenderRolls: [],
          attackerTotalDamage: 0,
          defenderTotalDamage: 0,
          attackerTotalDefense: 0,
          defenderTotalDefense: 0,
          attackerRemainingDefense: 0,
          defenderRemainingDefense: 0,
          hasAnyRanged: false,
          attackerRerolls: 0,
          defenderRerolls: 0,
          attackerDamageApplied: 0,
          defenderDamageApplied: 0,
          channellingUnitIds: [],
          readyToChannelUnitIds: [],
          logs: [...prev.combatState.logs, "Round finished. Starting next round..."]
        }
      };
    });
  };

  const handleCloseCombat = () => {
    setGameState(prev => {
      if (!prev.combatState) return prev;
      const combat = prev.combatState;
      const combatLogs = combat.logs;
      const pendingSkillLevel = combat.pendingOozeSkillLevel;
      
      const attacker = prev.players.find(p => p.id === combat.attackerId);
      const defender = (combat.defenderId === 'monster' || combat.defenderId === 'monster2' || combat.defenderId === 'monster3') 
        ? null 
        : prev.players.find(p => p.id === combat.defenderId);
      
      const attackerUnitsWithHp = combat.attackerUnits.filter(u => u.hp > 0);
      const defenderUnitsWithHp = (combat.defenderId === 'monster' || combat.defenderId === 'monster2' || combat.defenderId === 'monster3')
        ? ((combat.monsterHp ?? 0) > 0 ? [{ id: combat.defenderId }] : [])
        : combat.defenderUnits.filter(u => u.hp > 0);

      let winner = "None";
      if (defenderUnitsWithHp.length === 0) {
        winner = attacker?.name || "Attacker";
      } else if (attackerUnitsWithHp.length === 0) {
        winner = defender?.name || (combat.defenderId === 'monster' || combat.defenderId === 'monster2' || combat.defenderId === 'monster3' ? "Monsters" : "Defender");
      } else {
        // Both sides have units left, but if all damage was applied and one side is wiped, attacker wins by default if both wiped?
        // User said: "if all units are defeated the winner side is the attacking side"
        if (attackerUnitsWithHp.length === 0 && defenderUnitsWithHp.length === 0) {
          winner = attacker?.name || "Attacker";
        }
      }

      const summaryLogs = [];
      summaryLogs.push(`Combat Result: ${winner} wins!`);
      
      if (combat.defeatedUnitNames && combat.defeatedUnitNames.length > 0) {
        summaryLogs.push(`Defeated: ${combat.defeatedUnitNames.join(', ')}. They have returned to their capitals.`);
      }

      if (combat.goldGained || combat.xpGained) {
        summaryLogs.push(`${attacker?.name} receives ${combat.goldGained || 0} gold and ${combat.xpGained || 0} XP.`);
      }

      if (combat.defenderGoldGained || combat.defenderXpGained) {
        summaryLogs.push(`${defender?.name} receives ${combat.defenderGoldGained || 0} gold and ${combat.defenderXpGained || 0} XP.`);
      }

      let nextInsights = prev.aiInsights;
      const newPlayers = [...prev.players];

      if (attacker?.isAI || (defender && defender.isAI)) {
        nextInsights = prev.aiInsights ? { ...prev.aiInsights } : {
          actionSuccessRates: {} as Record<ActionType, number>,
          preferredPersonalities: {} as Record<string, number>
        };
        const learningRate = 0.1;
        
        if (attacker?.isAI) {
          const success = winner === attacker.name;
          const currentRate = nextInsights.actionSuccessRates[ActionType.COMBAT] ?? 0.5;
          nextInsights.actionSuccessRates[ActionType.COMBAT] = currentRate * (1 - learningRate) + (success ? 1 : 0) * learningRate;
          
          const playerIdx = newPlayers.findIndex(p => p.id === attacker.id);
          if (playerIdx !== -1) {
            const p = { ...newPlayers[playerIdx] };
            if (p.actionHistory && p.actionHistory.length > 0) {
              const newHistory = [...p.actionHistory];
              for (let i = newHistory.length - 1; i >= 0; i--) {
                if (newHistory[i].action === ActionType.COMBAT) {
                  newHistory[i] = { ...newHistory[i], success };
                  break;
                }
              }
              p.actionHistory = newHistory;
              newPlayers[playerIdx] = p;
            }
          }
        }
        if (defender && defender.isAI) {
          const success = winner === defender.name;
          const currentRate = nextInsights.actionSuccessRates[ActionType.COMBAT] ?? 0.5;
          nextInsights.actionSuccessRates[ActionType.COMBAT] = currentRate * (1 - learningRate) + (success ? 1 : 0) * learningRate;
          
          const playerIdx = newPlayers.findIndex(p => p.id === defender.id);
          if (playerIdx !== -1) {
            const p = { ...newPlayers[playerIdx] };
            if (p.actionHistory && p.actionHistory.length > 0) {
              const newHistory = [...p.actionHistory];
              for (let i = newHistory.length - 1; i >= 0; i--) {
                if (newHistory[i].action === ActionType.COMBAT) {
                  newHistory[i] = { ...newHistory[i], success };
                  break;
                }
              }
              p.actionHistory = newHistory;
              newPlayers[playerIdx] = p;
            }
          }
        }
      }

      let nextState: any = {
        ...prev,
        players: newPlayers,
        aiInsights: nextInsights,
        units: prev.units.map(u => {
          const isAttackerUnit = combat.attackerUnits.some(au => au.id === u.id);
          const isDefenderUnit = combat.defenderUnits.some(du => du.id === u.id);
          if (isAttackerUnit || isDefenderUnit) {
            return { ...u, hp: u.maxHp };
          }
          return u;
        }),
        combatState: null,
        activeActionType: null,
        actionSnapshot: null,
        logs: [...prev.logs, ...combatLogs, ...summaryLogs, "Combat ended."]
      };

      if (attacker && attackerUnitsWithHp.length === 0) {
        const newPlayers = [...prev.players];
        const attackerIndex = newPlayers.findIndex(p => p.id === attacker.id);
        if (attackerIndex !== -1) {
          const avoidHexes = newPlayers[attackerIndex].avoidHexes || [];
          if (!avoidHexes.some(h => h.q === combat.q && h.r === combat.r)) {
            newPlayers[attackerIndex] = {
              ...newPlayers[attackerIndex],
              avoidHexes: [...avoidHexes, { q: combat.q, r: combat.r }]
            };
            nextState.players = newPlayers;
          }
        }
      }
      
      if (pendingSkillLevel) {
        nextState.isBuyingSkill = true;
        nextState.isFreeSkill = true;
        nextState.freeSkillLevel = pendingSkillLevel;
        nextState.logs.push(`Ooze Knight absorbs power! Choose a free level ${pendingSkillLevel} skill from the market.`);
      }
      
      return nextState;
    });
  };

  const handleSelectSkill = (skill: Skill) => {
    setGameState(prev => ({
      ...prev,
      selectedSkill: skill,
      isSelectingUnitTypeForSkill: true,
      logs: [...prev.logs, `Selected ${skill.name}. Now choose a unit type to receive it.`]
    }));
  };

  const generateAdventureCard = (q: number, r: number, isAdvanced: boolean): AdventureCard => {
    if (isAdvanced) {
      const story = ADVANCED_ADVENTURES[Math.floor(Math.random() * ADVANCED_ADVENTURES.length)];
      const options: AdventureOption[] = [
        { label: "Take the Gold (8g)", type: 'GOLD', value: 8 },
        { label: "Gain Experience (4xp)", type: 'XP', value: 4 }
      ];
      return { title: story.title, story: story.story, options, isAdvanced: true, q, r };
    } else {
      const story = NORMAL_ADVENTURES[Math.floor(Math.random() * NORMAL_ADVENTURES.length)];
      const skill = (SKILLS as any)[story.skillId] || SKILLS.MAGIC_1;
      const allOptions: AdventureOption[] = [
        { label: `Learn ${skill.name}`, type: 'SKILL', value: skill as Skill },
        { label: "Take the Gold (6g)", type: 'GOLD', value: 6 },
        { label: "Gain Experience (3xp)", type: 'XP', value: 3 }
      ];
      // Pick 2 random options
      const shuffled = allOptions.sort(() => 0.5 - Math.random());
      const options = shuffled.slice(0, 2);
      return { title: story.title, story: story.story, options, isAdvanced: false, q, r };
    }
  };

  const handleAdventureChoice = (option: AdventureOption) => {
    setGameState(prev => {
      if (!prev.currentAdventure) return prev;
      const newPlayers = [...prev.players];
      const p = { 
        ...newPlayers[prev.currentPlayerIndex],
        questProgress: { ...newPlayers[prev.currentPlayerIndex].questProgress }
      };
      newPlayers[prev.currentPlayerIndex] = p;
      const { q, r } = prev.currentAdventure;

      let log = "";
      p.questProgress.adventuresCompleted += 1;
      let nextState: Partial<GameState> = {
        currentAdventure: null,
        activeActionType: null,
        actionSnapshot: null,
        board: prev.board.map(t => (t.q === q && t.r === r) ? { ...t, hasAdventureMarker: false, hasAdvancedAdventureMarker: false } : t)
      };

      if (p.isAI) {
        const newInsights = prev.aiInsights ? { ...prev.aiInsights } : {
          actionSuccessRates: {} as Record<ActionType, number>,
          preferredPersonalities: {} as Record<string, number>
        };
        const currentRate = newInsights.actionSuccessRates[ActionType.ADVENTURE] ?? 0.5;
        newInsights.actionSuccessRates[ActionType.ADVENTURE] = currentRate * 0.9 + 0.1;
        nextState.aiInsights = newInsights;
      }

      if (option.type === 'GOLD') {
        p.gold += option.value as number;
        log = `${p.name} chose Gold. Gained ${option.value}g.`;
      } else if (option.type === 'XP') {
        p.xp += option.value as number;
        log = `${p.name} chose Experience. Gained ${option.value}xp.`;
      } else if (option.type === 'SKILL') {
        const skill = option.value as Skill;
        nextState = {
            ...nextState,
            selectedSkill: skill,
            isSelectingUnitTypeForSkill: true,
            isFreeSkill: true,
            logs: [...prev.logs, `${p.name} chose to learn ${skill.name}. Select a unit type to receive it.`]
        };
        return {
            ...prev,
            ...nextState,
            players: newPlayers,
        };
      }

      return {
        ...prev,
        ...nextState,
        players: newPlayers,
        logs: [...prev.logs, log]
      };
    });
  };

  const calculateMaxHp = (unitType: 'warrior' | 'mage' | 'knight', unitLevel: number, skills: (Skill | null)[]): number => {
    let maxHp = UNIT_STATS[unitType].hp;
    if (unitType === 'warrior' && unitLevel === 2) maxHp = 2;
    if (unitType === 'mage' && unitLevel === 2) maxHp = 2;
    if (unitType === 'mage' && unitLevel === 3) maxHp = 3;
    if (unitType === 'knight' && unitLevel === 2) maxHp = 3;
    if (unitType === 'knight' && unitLevel === 3) maxHp = 5;
    
    if (skills.some(s => s?.id === 'ARMOR_2C')) {
      maxHp += 1;
    }
    if (skills.some(s => s?.id === 'DEFENSE_3A')) {
      maxHp += 2;
    }
    
    return maxHp;
  };

  const handleLevelUp = (unitType: 'warrior' | 'mage' | 'knight') => {
    setGameState(prev => {
      const newPlayers = [...prev.players];
      const p = { 
        ...newPlayers[prev.currentPlayerIndex],
        unitLevels: { ...newPlayers[prev.currentPlayerIndex].unitLevels }
      };
      newPlayers[prev.currentPlayerIndex] = p;

      const currentLevel = p.unitLevels[unitType];
      const cost = currentLevel === 1 ? 3 : 6;

      if (p.xp < cost) {
        return {
          ...prev,
          logs: [...prev.logs, `Not enough XP to level up ${unitType}.`]
        };
      }

      // Requirement: to go from 2 to 3, must have at least one level 2 skill
      if (currentLevel === 2) {
        const hasLevel2Skill = p.unitTypeSkills[unitType].some(s => s && s.level === 2);
        if (!hasLevel2Skill) {
          return {
            ...prev,
            logs: [...prev.logs, `${unitType} needs at least one Level 2 skill to reach Level 3.`]
          };
        }
      }

      p.xp -= cost;
      p.unitLevels[unitType] += 1;
      p.avoidHexes = [];
      
      // Update HP of existing units of this type
      const newUnits = prev.units.map(u => {
        if (u.playerId === p.id && u.type === unitType) {
          const newMaxHp = calculateMaxHp(unitType, p.unitLevels[unitType], p.unitTypeSkills[unitType]);
          
          // Heal unit by the amount max HP increased
          const hpIncrease = newMaxHp - u.maxHp;
          return { ...u, maxHp: newMaxHp, hp: Math.min(u.hp + (hpIncrease > 0 ? hpIncrease : 0), newMaxHp) };
        }
        return u;
      });

      if (p.isAI) {
        const newInsights = prev.aiInsights ? { ...prev.aiInsights } : {
          actionSuccessRates: {} as Record<ActionType, number>,
          preferredPersonalities: {} as Record<string, number>
        };
        const currentRate = newInsights.actionSuccessRates[ActionType.LEVEL_UP] ?? 0.5;
        newInsights.actionSuccessRates[ActionType.LEVEL_UP] = currentRate * 0.9 + 0.1;

        return {
          ...prev,
          players: newPlayers,
          units: newUnits,
          isLevelingUp: false,
          aiInsights: newInsights,
          logs: [...prev.logs, `${p.name} leveled up ${unitType} to level ${p.unitLevels[unitType]}!`]
        };
      }

      return {
        ...prev,
        players: newPlayers,
        units: newUnits,
        isLevelingUp: false,
        logs: [...prev.logs, `${p.name} leveled up ${unitType} to level ${p.unitLevels[unitType]}!`]
      };
    });
  };

  const handleActivateFactionSkill = (skillId: string, unitType: 'warrior' | 'mage' | 'knight' | 'passive') => {
    setGameState(prev => {
      const newPlayers = [...prev.players];
      const p = { ...newPlayers[prev.currentPlayerIndex] };
      newPlayers[prev.currentPlayerIndex] = p;

      if (p.xp < 3) {
        return {
          ...prev,
          logs: [...prev.logs, `Not enough XP to activate faction skill.`]
        };
      }

      p.xp -= 3;
      const skill = (SKILLS as any)[skillId];

      if (unitType === 'passive') {
        p.passives = [...p.passives, skillId];
      } else {
        const skills = [...p.unitTypeSkills[unitType]];
        // Put in first slot if empty, otherwise find first null
        if (skills[0] === null) {
          skills[0] = skill;
        } else {
          const emptyIdx = skills.findIndex(s => s === null);
          if (emptyIdx !== -1) {
            skills[emptyIdx] = skill;
          } else {
            // Replace first slot if no empty slots
            skills[0] = skill;
          }
        }
        p.unitTypeSkills = { ...p.unitTypeSkills, [unitType]: skills };
      }

      return {
        ...prev,
        players: newPlayers,
        isLevelingUp: false,
        logs: [...prev.logs, `${p.name} activated faction skill: ${skill.name}!`]
      };
    });
  };

  const handleCancelLevelUp = () => {
    setGameState(prev => ({
      ...prev,
      isLevelingUp: false,
      logs: [...prev.logs, "Level up canceled."]
    }));
  };

  const handleSelectUnitTypeForSkill = (unitType: 'warrior' | 'mage' | 'knight') => {
    setGameState(prev => ({
      ...prev,
      targetUnitType: unitType,
      isSelectingUnitTypeForSkill: false,
      isSelectingSkillSlot: true,
      logs: [...prev.logs, `Selected ${unitType}. Now choose a skill slot.`]
    }));
  };

  const handleApplySkill = (unitType: 'warrior' | 'mage' | 'knight', slotIndex: number) => {
    setGameState(prev => {
      if (!prev.selectedSkill) {
        // Cancel action if no skill selected
        const newPlayers = [...prev.players];
        const p = { ...newPlayers[prev.currentPlayerIndex], actionSlots: { ...newPlayers[prev.currentPlayerIndex].actionSlots } };
        newPlayers[prev.currentPlayerIndex] = p;
        const isFreeProduction = prev.freeProductionActions.includes(ActionType.BUY_SKILL);
        if (!prev.isFreeSkill && !isFreeProduction) {
          const cubesInSlot = p.actionSlots[ActionType.BUY_SKILL] - 1;
          p.gold += cubesInSlot * 2;
          p.actionSlots[ActionType.BUY_SKILL] -= 1;
          p.actionsRemaining += 1;
        }
        return {
          ...prev, players: newPlayers, isBuyingSkill: false, isFreeSkill: false, selectedSkill: null, isSelectingSkillSlot: false, targetUnitId: null, targetUnitType: null, isSelectingUnitTypeForSkill: false, activeActionType: null, actionSnapshot: null, freeSkillLevel: null, freeProductionActions: prev.freeProductionActions, logs: [...prev.logs, "Action canceled: No skill selected."]
        };
      }
      const newPlayers = [...prev.players];
      const p = { 
        ...newPlayers[prev.currentPlayerIndex],
        unitTypeSkills: { ...newPlayers[prev.currentPlayerIndex].unitTypeSkills }
      };
      newPlayers[prev.currentPlayerIndex] = p;
      
      let newAvailableLevel2Skills = [...prev.availableLevel2Skills];
      let newLevel2SkillDeck = [...prev.level2SkillDeck];
      let newAvailableLevel3Skills = [...prev.availableLevel3Skills];
      let newLevel3SkillDeck = [...prev.level3SkillDeck];

      if (!prev.isFreeSkill) {
        let xpCost = 0;
        if ((prev.selectedSkill.level === 2 || prev.selectedSkill.level === 3) && prev.selectedSkill.costXP) {
          xpCost = prev.selectedSkill.costXP;
        }
        
        if (p.faction === 'ooze') {
          xpCost += prev.selectedSkill.level;
        }

        if (p.gold < prev.selectedSkill.cost) {
          const isFreeProduction = prev.freeProductionActions.includes(ActionType.BUY_SKILL);
          if (!prev.isFreeSkill && !isFreeProduction) {
            const cubesInSlot = p.actionSlots[ActionType.BUY_SKILL] - 1;
            const refundedCost = cubesInSlot * 2;
            p.gold += refundedCost;
            p.actionSlots[ActionType.BUY_SKILL] -= 1;
            p.actionsRemaining += 1;
          }
          return {
            ...prev,
            players: newPlayers,
            isBuyingSkill: false,
            isFreeSkill: false,
            selectedSkill: null,
            isSelectingSkillSlot: false,
            targetUnitId: null,
            targetUnitType: null,
            isSelectingUnitTypeForSkill: false,
            activeActionType: null,
            actionSnapshot: null,
            freeSkillLevel: null,
            freeProductionActions: prev.freeProductionActions,
            logs: [...prev.logs, `Not enough gold to buy ${prev.selectedSkill.name}. Action canceled.`]
          };
        }
        if (p.xp < xpCost) {
          const isFreeProduction = prev.freeProductionActions.includes(ActionType.BUY_SKILL);
          if (!prev.isFreeSkill && !isFreeProduction) {
            const cubesInSlot = p.actionSlots[ActionType.BUY_SKILL] - 1;
            const refundedCost = cubesInSlot * 2;
            p.gold += refundedCost;
            p.actionSlots[ActionType.BUY_SKILL] -= 1;
            p.actionsRemaining += 1;
          }
          return {
            ...prev,
            players: newPlayers,
            isBuyingSkill: false,
            isFreeSkill: false,
            selectedSkill: null,
            isSelectingSkillSlot: false,
            targetUnitId: null,
            targetUnitType: null,
            isSelectingUnitTypeForSkill: false,
            activeActionType: null,
            actionSnapshot: null,
            freeSkillLevel: null,
            freeProductionActions: prev.freeProductionActions,
            logs: [...prev.logs, `Not enough XP to buy ${prev.selectedSkill?.name || 'skill'}. Action canceled.`]
          };
        }
        
        p.gold -= prev.selectedSkill?.cost || 0;
        p.xp -= xpCost;

        if (prev.selectedSkill?.level === 2) {
          const skillIndex = newAvailableLevel2Skills.findIndex(s => s.id === prev.selectedSkill?.id);
          if (skillIndex !== -1) {
            newAvailableLevel2Skills.splice(skillIndex, 1);
            if (newLevel2SkillDeck.length > 0) {
              const nextSkill = newLevel2SkillDeck.shift();
              if (nextSkill) {
                newAvailableLevel2Skills.push(nextSkill);
              }
            } else {
              // If deck is empty, we could optionally reshuffle or just leave it empty.
              // For now, we just leave it empty.
            }
          }
        } else if (prev.selectedSkill?.level === 3) {
          const skillIndex = newAvailableLevel3Skills.findIndex(s => s.id === prev.selectedSkill?.id);
          if (skillIndex !== -1) {
            newAvailableLevel3Skills.splice(skillIndex, 1);
            if (newLevel3SkillDeck.length > 0) {
              const nextSkill = newLevel3SkillDeck.shift();
              if (nextSkill) {
                newAvailableLevel3Skills.push(nextSkill);
              }
            }
          }
        }
      }

      const newSkills = [...p.unitTypeSkills[unitType]];
      newSkills[slotIndex] = prev.selectedSkill;
      
      p.unitTypeSkills = {
        ...p.unitTypeSkills,
        [unitType]: newSkills
      };
      
      p.avoidHexes = [];

      const newUnits = prev.units.map(u => {
        if (u.playerId === p.id && u.type === unitType) {
          const newMaxHp = calculateMaxHp(unitType, p.unitLevels[unitType], newSkills);
          const hpIncrease = newMaxHp - u.maxHp;
          return { ...u, maxHp: newMaxHp, hp: Math.min(u.hp + (hpIncrease > 0 ? hpIncrease : 0), newMaxHp) };
        }
        return u;
      });

      if (p.isAI) {
        const newInsights = prev.aiInsights ? { ...prev.aiInsights } : {
          actionSuccessRates: {} as Record<ActionType, number>,
          preferredPersonalities: {} as Record<string, number>
        };
        const currentRate = newInsights.actionSuccessRates[ActionType.BUY_SKILL] ?? 0.5;
        newInsights.actionSuccessRates[ActionType.BUY_SKILL] = currentRate * 0.9 + 0.1;
        
        const newPendingChoices = { ...prev.pendingEventChoices };
        let nextPhase = prev.gamePhase;
        let nextPlayerIndex = prev.currentPlayerIndex;
        let nextEvent = prev.currentEvent;

        if (prev.isFreeSkill && prev.gamePhase === 'EVENT') {
          newPendingChoices[p.id] = { ...newPendingChoices[p.id], completed: true };
          const allCompleted = Object.values(newPendingChoices).every((c: any) => c.completed);
          if (allCompleted) {
            const seasons: ('SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER')[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
            const currentIndex = seasons.indexOf(prev.currentSeason);
            const nextSeasonIndex = (currentIndex + 1) % 4;
            const nextSeason = seasons[nextSeasonIndex];
            const nextYear = prev.currentYear + 1;

            return {
              ...prev,
              players: newPlayers,
              units: newUnits,
              availableLevel2Skills: newAvailableLevel2Skills,
              level2SkillDeck: newLevel2SkillDeck,
              availableLevel3Skills: newAvailableLevel3Skills,
              level3SkillDeck: newLevel3SkillDeck,
              isBuyingSkill: false,
              isFreeSkill: false,
              selectedSkill: null,
              isSelectingSkillSlot: false,
              targetUnitId: null,
              targetUnitType: null,
              isSelectingUnitTypeForSkill: false,
              activeActionType: null,
              actionSnapshot: null,
              freeSkillLevel: null,
              pendingEventChoices: newPendingChoices,
              gamePhase: 'PLAYING',
              currentSeason: nextSeason,
              currentYear: nextYear,
              isSeasonAdvancePending: false,
              currentPlayerIndex: 0,
              currentEvent: null,
              logs: [...prev.logs, `Skill ${prev.selectedSkill?.name || 'Unknown'} applied to all ${unitType}s.`, `Winter has ended. A new year begins! Year ${nextYear}.`]
            };
          } else {
            nextPhase = 'EVENT';
            nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
          }
        }

        return {
          ...prev,
          players: newPlayers,
          units: newUnits,
          availableLevel2Skills: newAvailableLevel2Skills,
          level2SkillDeck: newLevel2SkillDeck,
          availableLevel3Skills: newAvailableLevel3Skills,
          level3SkillDeck: newLevel3SkillDeck,
          isBuyingSkill: false,
          isFreeSkill: false,
          selectedSkill: null,
          isSelectingSkillSlot: false,
          targetUnitId: null,
          freeProductionActions: prev.freeProductionActions,
          activeActionType: null,
          actionSnapshot: null,
          freeSkillLevel: null,
          aiInsights: newInsights,
          pendingEventChoices: newPendingChoices,
          gamePhase: nextPhase,
          currentPlayerIndex: nextPlayerIndex,
          currentEvent: nextEvent,
          logs: [...prev.logs, `Skill ${prev.selectedSkill?.name || 'Unknown'} applied to all ${unitType}s.`]
        };
      }

      const newPendingChoices = { ...prev.pendingEventChoices };
      let nextPhase = prev.gamePhase;
      let nextPlayerIndex = prev.currentPlayerIndex;
      let nextEvent = prev.currentEvent;

      if (prev.isFreeSkill && prev.gamePhase === 'EVENT') {
        newPendingChoices[p.id] = { ...newPendingChoices[p.id], completed: true };
        const allCompleted = Object.values(newPendingChoices).every((c: any) => c.completed);
        if (allCompleted) {
          nextPhase = 'PLAYING';
          nextEvent = null;
        } else {
          nextPhase = 'EVENT';
          nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
        }
      }

      return {
        ...prev,
        players: newPlayers,
        units: newUnits,
        availableLevel2Skills: newAvailableLevel2Skills,
        level2SkillDeck: newLevel2SkillDeck,
        availableLevel3Skills: newAvailableLevel3Skills,
        level3SkillDeck: newLevel3SkillDeck,
        isBuyingSkill: false,
        isFreeSkill: false,
        selectedSkill: null,
        isSelectingSkillSlot: false,
        targetUnitId: null,
        targetUnitType: null,
        isSelectingUnitTypeForSkill: false,
        activeActionType: null,
        actionSnapshot: null,
        freeSkillLevel: null,
        pendingEventChoices: newPendingChoices,
        gamePhase: nextPhase,
        currentPlayerIndex: nextPlayerIndex,
        currentEvent: nextEvent,
        logs: [...prev.logs, `Skill ${prev.selectedSkill?.name || 'Unknown'} applied to all ${unitType}s.`]
      };
    });
  };

  const handleCancelSkillBuy = () => {
    setGameState(prev => {
      const newPlayers = [...prev.players];
      const p = { 
        ...newPlayers[prev.currentPlayerIndex],
        actionSlots: { ...newPlayers[prev.currentPlayerIndex].actionSlots }
      };
      newPlayers[prev.currentPlayerIndex] = p;
      
      const isFreeProduction = prev.freeProductionActions.includes(ActionType.BUY_SKILL);
      if (!prev.isFreeSkill && !isFreeProduction) {
        const cubesInSlot = p.actionSlots[ActionType.BUY_SKILL] - 1;
        const refundedCost = cubesInSlot * 2;
        
        p.gold += refundedCost;
        p.actionSlots[ActionType.BUY_SKILL] -= 1;
        p.actionsRemaining += 1;
      }

      return {
        ...prev,
        players: newPlayers,
        isBuyingSkill: false,
        isFreeSkill: false,
        selectedSkill: null,
        isSelectingSkillSlot: false,
        targetUnitId: null,
        targetUnitType: null,
        isSelectingUnitTypeForSkill: false,
        activeActionType: null,
        actionSnapshot: null,
        freeSkillLevel: null,
        freeProductionActions: prev.freeProductionActions,
        logs: [...prev.logs, prev.isFreeSkill ? "Skill selection canceled." : "Skill purchase canceled."]
      };
    });
  };

  // ... rest of the component

  // ... rest of the component


  const trackAIActionOutcome = (playerId: number, action: ActionType, success: boolean) => {
    setGameState(prev => {
      const newInsights = prev.aiInsights ? { ...prev.aiInsights } : {
        actionSuccessRates: {} as Record<ActionType, number>,
        preferredPersonalities: {} as Record<string, number>
      };
      
      const currentRate = newInsights.actionSuccessRates[action] ?? 0.5;
      const learningRate = 0.1;
      newInsights.actionSuccessRates[action] = currentRate * (1 - learningRate) + (success ? 1 : 0) * learningRate;
      
      const newPlayers = [...prev.players];
      const playerIdx = newPlayers.findIndex(p => p.id === playerId);
      if (playerIdx !== -1) {
        const p = { ...newPlayers[playerIdx] };
        if (p.actionHistory && p.actionHistory.length > 0) {
          const newHistory = [...p.actionHistory];
          for (let i = newHistory.length - 1; i >= 0; i--) {
            if (newHistory[i].action === action) {
              newHistory[i] = { ...newHistory[i], success };
              break;
            }
          }
          p.actionHistory = newHistory;
          newPlayers[playerIdx] = p;
        }
      }

      return { ...prev, aiInsights: newInsights, players: newPlayers };
    });
  };

  const performAITurn = useCallback(() => {
    const { gamePhase, isGameOver, players, currentPlayerIndex, isSelectingInitialQuest, isLevelingUp, combatState, currentAdventure, isRecruiting, isBuildingCastle, isSelectingCombatHex, isSelectingAdventureHex, isBuyingSkill, selectedSkill, isSelectingSkillSlot, isSelectingUnitTypeForSkill } = gameState;
    if (isGameOver) return;

    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isAI) return;

    // --- YEAR END QUEST HANDLING ---
    if (gamePhase === 'YEAR_END_QUESTS') {
      // AI checks if it can complete any quest
      const canCompletePublic = gameState.publicQuests.find(q => checkQuestFulfillment(currentPlayer, q, gameState.board, gameState.units, gameState.buildings));
      const canCompleteSecret = currentPlayer.secretQuest && checkQuestFulfillment(currentPlayer, currentPlayer.secretQuest, gameState.board, gameState.units, gameState.buildings);
      
      if (canCompletePublic) {
        handleCompleteQuest(canCompletePublic.id, false);
      } else if (canCompleteSecret) {
        handleCompleteQuest(currentPlayer.secretQuest!.id, true);
      } else {
        handleYearEndQuestSkip();
      }
      return;
    }

    // --- EVENT HANDLING ---
    if (gamePhase === 'EVENT') {
      const pendingChoice = gameState.pendingEventChoices[currentPlayer.id];
      if (pendingChoice && !pendingChoice.completed) {
        if (gameState.currentEvent === 'Call to Arms') {
          // AI chooses to recruit for free
          // Prefer knights, then mages, then warriors
          const currentKnights = gameState.units.filter(u => u.playerId === currentPlayer.id && u.type === 'knight').length;
          const currentMages = gameState.units.filter(u => u.playerId === currentPlayer.id && u.type === 'mage').length;
          
          let unitType: 'warrior' | 'mage' | 'knight' = 'warrior';
          if (currentKnights < UNIT_STATS.knight.slots) unitType = 'knight';
          else if (currentMages < UNIT_STATS.mage.slots) unitType = 'mage';
          
          handleEventChoice({ type: 'FREE_RECRUIT', unitType });
          return;
        } else if (gameState.currentEvent === 'The Shadow Strikes') {
          // AI chooses a hex to apply damage
          // Find a hex with units adjacent to a dungeon entrance
          const dungeonEntrances = gameState.board.filter(t => t.type === TileType.DUNGEON_ENTRANCE);
          const adjacentHexes = dungeonEntrances.flatMap(d => getNeighbors(d.q, d.r));
          const myUnitsInDanger = gameState.units.filter(u => u.playerId === currentPlayer.id && adjacentHexes.some(h => h.q === u.q && h.r === u.r));
          
          if (myUnitsInDanger.length > 0) {
            handleEventChoice({ type: 'DUNGEON_ATTACK', q: myUnitsInDanger[0].q, r: myUnitsInDanger[0].r });
          } else {
            // No units in danger, pick a random adjacent hex or just skip
            handleEventChoice({ type: 'DUNGEON_ATTACK', q: adjacentHexes[0].q, r: adjacentHexes[0].r });
          }
          return;
        } else if (gameState.currentEvent === 'Arcane Enlightenment') {
          // AI chooses a free skill
          const monsterLevel = (gameState.players.some(p => p.score >= 5)) ? 3 : 2;
          const deck = monsterLevel === 3 ? gameState.level3SkillDeck : gameState.level2SkillDeck;
          if (deck.length > 0) {
            handleEventChoice({ type: 'FREE_SKILL', skill: deck[0] });
          } else {
            // No skills left, skip
            handleEventChoice({ type: 'SKIP' });
          }
          return;
        }
      }
      return;
    }

    // --- STRATEGY UPDATE LOGIC ---
    const updateAIStrategy = (player: Player) => {
      const strategy = player.aiStrategy ? { ...player.aiStrategy } : {
        currentGoal: 'EXPANSION' as const,
        plannedActions: [] as ActionType[],
        goalProgress: 0
      };

      const myUnits = gameState.units.filter(u => u.playerId === player.id);
      const combatPower = myUnits.reduce((acc, u) => {
        const levelPower = (player.unitLevels?.[u.type] || 0) * 10;
        const skillsPower = (player.unitTypeSkills?.[u.type] || []).reduce((skillAcc, s) => {
          if (!s) return skillAcc;
          return skillAcc + (s.level * 10);
        }, 0);
        return acc + levelPower + skillsPower;
      }, 0);

      // Determine goal based on game state
      const prevGoal = strategy.currentGoal;
      
      // Calculate potential VP
      const ancientCityVP = getAncientCityVP(player.id, gameState.board, gameState.units, gameState.buildings);
      const totalVP = player.score + ancientCityVP;

      // Strategic decision making based on current state and potential
      if (totalVP >= 8) {
        strategy.currentGoal = 'VICTORY_POINTS';
      } else if (combatPower > 150 && player.questProgress.level3MonstersDefeated > 0) {
        strategy.currentGoal = 'BOSS_RUSH';
      } else if (gameState.round < 8 || (player.gold < 15 && combatPower < 80)) {
        strategy.currentGoal = 'EXPANSION';
      } else if (combatPower < 120 || player.xp < 10) {
        strategy.currentGoal = 'MILITARY';
      } else if (player.questProgress.level2MonstersDefeated === 0 && gameState.round < 20) {
        strategy.currentGoal = 'QUESTING';
      } else {
        strategy.currentGoal = 'BOSS_RUSH';
      }

      // If goal changed or planned actions empty, replan
      if (prevGoal !== strategy.currentGoal || strategy.plannedActions.length === 0) {
        if (strategy.currentGoal === 'EXPANSION') {
          strategy.plannedActions = [ActionType.PRODUCTION, ActionType.RECRUIT, ActionType.MOVE_1, ActionType.ADVENTURE, ActionType.BUILD_CASTLE];
        } else if (strategy.currentGoal === 'MILITARY') {
          strategy.plannedActions = [ActionType.RECRUIT, ActionType.BUY_SKILL, ActionType.LEVEL_UP, ActionType.COMBAT, ActionType.PRODUCTION];
        } else if (strategy.currentGoal === 'QUESTING') {
          strategy.plannedActions = [ActionType.MOVE_2, ActionType.COMBAT, ActionType.COMPLETE_QUEST, ActionType.ADVENTURE, ActionType.BUY_SKILL];
        } else if (strategy.currentGoal === 'BOSS_RUSH') {
          strategy.plannedActions = [ActionType.MOVE_2, ActionType.COMBAT, ActionType.BUILD_MONUMENT, ActionType.LEVEL_UP];
        } else if (strategy.currentGoal === 'VICTORY_POINTS') {
          strategy.plannedActions = [ActionType.BUILD_MONUMENT, ActionType.BUILD_CASTLE, ActionType.COMBAT, ActionType.COMPLETE_QUEST];
        }
      }

      // Set long term target and calculate progress
      if (strategy.currentGoal === 'BOSS_RUSH') {
        strategy.longTermTarget = { q: 0, r: 0 };
        const dist = getHexDistance(player.capitalPosition.q, player.capitalPosition.r, 0, 0);
        strategy.goalProgress = Math.max(0, 100 - (dist * 5));
      } else if (strategy.currentGoal === 'QUESTING') {
        const dungeon = gameState.board.find(t => t.type === TileType.DUNGEON_ENTRANCE || t.hasDungeonEntrance);
        if (dungeon) {
          strategy.longTermTarget = { q: dungeon.q, r: dungeon.r };
          const dist = getHexDistance(player.capitalPosition.q, player.capitalPosition.r, dungeon.q, dungeon.r);
          strategy.goalProgress = Math.max(0, 100 - (dist * 5));
        }
      } else if (strategy.currentGoal === 'VICTORY_POINTS') {
        strategy.goalProgress = totalVP * 10;
        strategy.longTermTarget = undefined;
      } else {
        strategy.longTermTarget = undefined;
        strategy.goalProgress = 0;
      }
      
      return strategy;
    };

    const newStrategy = updateAIStrategy(currentPlayer);
    if (newStrategy && JSON.stringify(newStrategy) !== JSON.stringify(currentPlayer.aiStrategy)) {
      setGameState(prev => {
        const newPlayers = [...prev.players];
        newPlayers[prev.currentPlayerIndex] = {
          ...newPlayers[prev.currentPlayerIndex],
          aiStrategy: newStrategy
        };
        return { ...prev, players: newPlayers };
      });
      return; // Wait for state update
    }

    // Skill Draft Phase
    if (gamePhase === 'SKILL_DRAFT') {
      const mageChoices = gameState.skillDraftPool.mages.sort(() => 0.5 - Math.random()).slice(0, 2);
      const knightChoices = gameState.skillDraftPool.knights.sort(() => 0.5 - Math.random()).slice(0, 2);
      handleSkillDraftComplete(mageChoices[0], knightChoices[0]);
      return;
    }

    const getHexCombatPower = (playerId: number, q: number, r: number) => {
      const units = gameState.units.filter(u => u.playerId === playerId && u.q === q && u.r === r);
      const player = gameState.players.find(p => p.id === playerId);
      if (!player) return 0;
      return units.reduce((acc, u) => {
        const levelPower = (player.unitLevels?.[u.type] || 0) * 10;
        const skillsPower = (player.unitTypeSkills?.[u.type] || []).reduce((skillAcc, s) => {
          if (!s) return skillAcc;
          return skillAcc + (s.level * 10);
        }, 0);
        return acc + levelPower + skillsPower;
      }, 0);
    };

    const isCombatWinnable = (q: number, r: number, additionalPower: number = 0) => {
      if (currentPlayer.avoidHexes?.some(h => h.q === q && h.r === r)) return false;
      const myPower = getHexCombatPower(currentPlayer.id, q, r) + additionalPower;
      
      const myUnits = gameState.units.filter(u => u.playerId === currentPlayer.id);
      const totalArmyPower = myUnits.reduce((acc, u) => {
        const levelPower = (currentPlayer.unitLevels?.[u.type] || 0) * 10;
        const skillsPower = (currentPlayer.unitTypeSkills?.[u.type] || []).reduce((skillAcc, s) => {
          if (!s) return skillAcc;
          return skillAcc + (s.level * 10);
        }, 0);
        return acc + levelPower + skillsPower;
      }, 0);

      const tile = gameState.board.find(t => t.q === q && t.r === r);
      const isDungeon = tile?.type === TileType.DUNGEON_ENTRANCE || tile?.hasDungeonEntrance;
      const isBoss = tile?.type === TileType.BOSS;
      
      const enemyUnits = gameState.units.filter(u => u.q === q && u.r === r && u.playerId !== currentPlayer.id);
      if (enemyUnits.length > 0) {
        const enemyPlayerId = enemyUnits[0].playerId;
        const enemyPower = getHexCombatPower(enemyPlayerId, q, r);
        return myPower >= enemyPower;
      }
      
      if (isBoss) {
        return totalArmyPower >= 150;
      }
      
      if (isDungeon) {
        return totalArmyPower >= 30; 
      }
      
      return false;
    };

    // 1. Capital Placement
    if (gamePhase === 'SETUP_CAPITAL') {
      const boardWithoutPreviews = gameState.board.filter(t => t.type !== TileType.PREVIEW);

      const scoreLocation = (q: number, r: number) => {
        let score = 0;
        const neighbors = [
          { dq: 1, dr: -1 }, { dq: 1, dr: 0 }, { dq: 0, dr: 1 },
          { dq: -1, dr: 1 }, { dq: -1, dr: 0 }, { dq: 0, dr: -1 }
        ];

        neighbors.forEach((n, dir) => {
          const nq = q + n.dq;
          const nr = r + n.dr;
          const neighborTile = boardWithoutPreviews.find(t => t.q === nq && t.r === nr);
          const oppDir = (dir + 3) % 6;

          if (neighborTile) {
            // Priority: Higher gold and xp around
            score += (neighborTile.productionGold || 0) * 5;
            score += (neighborTile.productionXP || 0) * 8;

            // Priority: Avoid red lines blocking connections
            if (neighborTile.redLines?.includes(oppDir)) {
              score -= 30; // Significant penalty for blocked connection
            }

            // Priority: Less red lines in general around the patch
            score -= (neighborTile.redLines?.length || 0) * 5;
          }
        });
        return score;
      };

      // If we already selected a border hex, click a preview face
      const previewHexes = gameState.board.filter(t => t.type === TileType.PREVIEW);
      if (previewHexes.length > 0) {
        const scoredPreviews = previewHexes.map(hex => ({
          hex,
          score: scoreLocation(hex.q, hex.r)
        }));
        scoredPreviews.sort((a, b) => b.score - a.score);
        const bestHex = scoredPreviews[0].hex;
        handleHexClick(bestHex.q, bestHex.r);
        return;
      }

      // Otherwise, pick a border hex
      const possibleHexes = boardWithoutPreviews.filter(t => {
        const distance = (Math.abs(t.q) + Math.abs(t.r) + Math.abs(t.q + t.r)) / 2;
        const outsideNeighbors = getAllOutsideNeighbors(t.q, t.r, boardWithoutPreviews).filter(pos => {
          const isFarEnough = !gameState.buildings.some(b => 
            b.type === 'capital' && getHexDistance(pos.q, pos.r, b.q, b.r) < 2
          );
          if (!isFarEnough) return false;
          return !isHexStuck(pos.q, pos.r, boardWithoutPreviews, currentPlayer.passives);
        });
        return distance >= 2 && outsideNeighbors.length > 0;
      });

      if (possibleHexes.length > 0) {
        // Score each possible border hex based on its best potential outside neighbor
        const scoredPossible = possibleHexes.map(t => {
          const outsideNeighbors = getAllOutsideNeighbors(t.q, t.r, boardWithoutPreviews).filter(pos => {
            const isFarEnough = !gameState.buildings.some(b => 
              b.type === 'capital' && getHexDistance(pos.q, pos.r, b.q, b.r) < 2
            );
            if (!isFarEnough) return false;
            return !isHexStuck(pos.q, pos.r, boardWithoutPreviews, currentPlayer.passives);
          });
          const bestNeighborScore = Math.max(...outsideNeighbors.map(pos => scoreLocation(pos.q, pos.r)));
          return { hex: t, score: bestNeighborScore };
        });

        scoredPossible.sort((a, b) => b.score - a.score);
        const bestHex = scoredPossible[0].hex;
        handleHexClick(bestHex.q, bestHex.r);
      }
      return;
    }

    // 2. Initial Quest Selection
    if (gameState.isSelectingInitialQuest) {
      const choices = gameState.initialQuestChoices[currentPlayerIndex];
      if (choices && choices.length > 0) {
        handleSelectInitialQuest(choices[0].id);
      }
      return;
    }

    // 2.5 Advanced Quest Selection
    if (gameState.isSelectingAdvancedQuest) {
      const choices = gameState.advancedQuestChoices[currentPlayer.id];
      if (choices && choices.length > 0) {
        handleSelectAdvancedQuest(choices[0].id);
      }
      return;
    }

    // 3. Level Up
    if (isLevelingUp) {
      const affordableOptions: ('warrior' | 'mage' | 'knight')[] = [];
      const unitTypes: ('warrior' | 'mage' | 'knight')[] = ['warrior', 'mage', 'knight'];
      
      unitTypes.forEach(type => {
        const currentLevel = currentPlayer.unitLevels[type];
        const cost = currentLevel === 1 ? 3 : currentLevel === 2 ? 6 : Infinity;
        const maxLevel = type === 'warrior' ? 2 : 3;
        
        let canLevelUp = currentPlayer.xp >= cost && currentLevel < maxLevel;
        if (canLevelUp && currentLevel === 2) {
          const hasLevel2Skill = (currentPlayer.unitTypeSkills?.[type] || []).some(s => s && s.level === 2);
          if (!hasLevel2Skill) canLevelUp = false;
        }

        if (canLevelUp) {
          affordableOptions.push(type);
        }
      });

      if (affordableOptions.length > 0) {
        handleLevelUp(affordableOptions[0]);
      } else {
        handleCancelLevelUp();
      }
      return;
    }

    // 4. Combat
    if (combatState) {
      const attacker = players.find(p => p.id === combatState.attackerId);
      const defender = typeof combatState.defenderId === 'number' ? players.find(p => p.id === combatState.defenderId) : null;
      const isAIOnly = attacker?.isAI && (!defender || defender.isAI);

      if (isAIOnly && gameState.pauseOnAICombat) return;

      if (combatState.phase === 'INIT') {
        resolveCombat();
      } else if (combatState.phase === 'RANGED_REROLL' || combatState.phase === 'MELEE_REROLL') {
        // AI currently doesn't reroll, just finishes the phase
        handleFinishReroll();
      } else if (combatState.phase === 'RESOLVED') {
        handleCloseCombat();
      } else if (combatState.phase === 'RANGED_APPLY' || combatState.phase === 'MELEE_APPLY') {
        const attackerUnitsWithHp = combatState.attackerUnits.filter(u => u.hp > 0);
        const defenderUnitsWithHp = (combatState.defenderId === 'monster' || combatState.defenderId === 'monster2' || combatState.defenderId === 'monster3')
          ? ((combatState.monsterHp ?? 0) > 0 ? [{ id: combatState.defenderId }] : [])
          : combatState.defenderUnits.filter(u => u.hp > 0);

        const canAttackerTakeDamage = attackerUnitsWithHp.length > 0;
        const canDefenderTakeDamage = defenderUnitsWithHp.length > 0;

        const isCombatFinished = (combatState.attackerTotalDamage === 0 || !canDefenderTakeDamage) && 
                                (combatState.defenderTotalDamage === 0 || !canAttackerTakeDamage);

        if (isCombatFinished) {
          if (combatState.phase === 'RANGED_APPLY') {
            resolveCombat();
          } else {
            handleNextRound();
          }
        } else {
          if (combatState.defenderTotalDamage > 0 && canAttackerTakeDamage) {
            handleApplyCombatDamage('attacker', attackerUnitsWithHp[0].id);
          } else if (combatState.attackerTotalDamage > 0 && canDefenderTakeDamage) {
            if (combatState.defenderId === 'monster' || combatState.defenderId === 'monster2' || combatState.defenderId === 'monster3') {
              handleApplyCombatDamage('defender', combatState.defenderId);
            } else {
              handleApplyCombatDamage('defender', defenderUnitsWithHp[0].id);
            }
          } else {
            resolveCombat();
          }
        }
      }
      return;
    }

    // 5. Adventure
    if (currentAdventure) {
      handleAdventureChoice(currentAdventure.options[0]);
      return;
    }

    // 6. Sub-states
    if (gameState.isCompletingQuest) {
      const { players, currentPlayerIndex, publicQuests, board, units, buildings } = gameState;
      const player = players[currentPlayerIndex];
      
      // Check secret quest
      if (player.secretQuest && checkQuestFulfillment(player, player.secretQuest, board, units, buildings)) {
        handleCompleteQuest(player.secretQuest.id, true);
        return;
      }
      
      // Check public quests
      const fulfilledPublic = publicQuests.find(q => checkQuestFulfillment(player, q, board, units, buildings));
      if (fulfilledPublic) {
        handleCompleteQuest(fulfilledPublic.id, false);
      } else {
        setGameState(prev => ({ ...prev, isCompletingQuest: false }));
      }
      return;
    }

    if (isRecruiting) {
      if (!gameState.recruitingUnitType) {
        const myUnits = gameState.units.filter(u => u.playerId === currentPlayer.id);
        const mages = myUnits.filter(u => u.type === 'mage').length;
        const knights = myUnits.filter(u => u.type === 'knight').length;
        const warriors = myUnits.filter(u => u.type === 'warrior').length;

        // Target: 2 mages + 1 knight OR 2 knights + 1 mage
        if (mages < 2 && currentPlayer.gold >= 6 && currentPlayer.availableUnits.mages > 0) {
          handleSelectRecruitUnit('mage');
        } else if (knights < 2 && currentPlayer.gold >= 8 && currentPlayer.availableUnits.knights > 0) {
          handleSelectRecruitUnit('knight');
        } else if (warriors < 1 && currentPlayer.gold >= 4 && currentPlayer.availableUnits.warriors > 0) {
          handleSelectRecruitUnit('warrior');
        } else if (currentPlayer.gold >= 8 && currentPlayer.availableUnits.knights > 0) {
          handleSelectRecruitUnit('knight');
        } else if (currentPlayer.gold >= 6 && currentPlayer.availableUnits.mages > 0) {
          handleSelectRecruitUnit('mage');
        } else if (currentPlayer.gold >= 4 && currentPlayer.availableUnits.warriors > 0) {
          handleSelectRecruitUnit('warrior');
        } else {
          handleCancelAction();
        }
      } else {
        const buildings = gameState.buildings.filter(b => b.playerId === currentPlayer.id);
        const validRecruitBuilding = buildings.find(b => {
          const unitsOnHex = gameState.units.filter(u => u.q === b.q && u.r === b.r && u.playerId === currentPlayer.id);
          const tile = gameState.board.find(t => t.q === b.q && t.r === b.r);
          const isCapital = tile?.type === TileType.INITIAL;
          return isCapital || unitsOnHex.length < 3;
        });

        if (validRecruitBuilding) {
          handleHexClick(validRecruitBuilding.q, validRecruitBuilding.r);
        } else {
          handleCancelAction();
        }
      }
      return;
    }

    if (isBuildingCastle) {
      const validCastleHexes = gameState.units
        .filter(u => u.playerId === currentPlayer.id)
        .map(u => ({ q: u.q, r: u.r }))
        .filter(pos => {
          const tile = gameState.board.find(t => t.q === pos.q && t.r === pos.r);
          if (!tile) return false;
          const enemyUnits = gameState.units.filter(u => u.q === pos.q && u.r === pos.r && u.playerId !== currentPlayer.id);
          const currentCastles = gameState.buildings.filter(b => b.q === pos.q && b.r === pos.r && b.type === 'castle').length;
          return enemyUnits.length === 0 && currentCastles < tile.castleSlots;
        });

      if (validCastleHexes.length > 0) {
        // Prioritize ancient cities
        validCastleHexes.sort((a, b) => {
          const tileA = gameState.board.find(t => t.q === a.q && t.r === a.r);
          const tileB = gameState.board.find(t => t.q === b.q && t.r === b.r);
          const scoreA = tileA?.type === TileType.ANCIENT_CITY ? 10 : 0;
          const scoreB = tileB?.type === TileType.ANCIENT_CITY ? 10 : 0;
          return scoreB - scoreA;
        });
        handleHexClick(validCastleHexes[0].q, validCastleHexes[0].r);
      } else {
        handleCancelAction();
      }
      return;
    }

    if (isSelectingCombatHex) {
      const currentPlayerId = currentPlayer.id;
      const validCombatHexes = gameState.units
        .filter(u => u.playerId === currentPlayerId)
        .map(u => ({ q: u.q, r: u.r }))
        .filter(pos => {
          const enemyUnits = gameState.units.filter(u => u.q === pos.q && u.r === pos.r && u.playerId !== currentPlayerId);
          const tile = gameState.board.find(t => t.q === pos.q && t.r === pos.r);
          const isDungeon = tile?.type === TileType.DUNGEON_ENTRANCE || tile?.hasDungeonEntrance;
          const isBoss = tile?.type === TileType.BOSS;
          
          if (isBoss) {
            const myUnitsOnBoss = gameState.units.filter(u => u.q === pos.q && u.r === pos.r && u.playerId === currentPlayerId);
            const myLvl3UnitsOnBoss = myUnitsOnBoss.filter(u => currentPlayer.unitLevels[u.type] >= 3);
            if (myLvl3UnitsOnBoss.length < 3) {
              return false; // Wait until we have at least 3 level 3 units on the boss hex
            }
          }
          
          return (enemyUnits.length > 0 || isDungeon || isBoss) && isCombatWinnable(pos.q, pos.r);
        });

      if (validCombatHexes.length > 0) {
        // Sort valid combat hexes to prioritize boss if conditions met
        validCombatHexes.sort((a, b) => {
          const tileA = gameState.board.find(t => t.q === a.q && t.r === a.r);
          const tileB = gameState.board.find(t => t.q === b.q && t.r === b.r);
          
          const isBossA = tileA?.type === TileType.BOSS ? 1 : 0;
          const isBossB = tileB?.type === TileType.BOSS ? 1 : 0;
          
          const lvl3Units = gameState.units.filter(u => u.playerId === currentPlayerId && currentPlayer.unitLevels[u.type] >= 3);
          const hasLvl3Skills = lvl3Units.some(u => (currentPlayer.unitTypeSkills?.[u.type] || []).some(s => s && s.level === 3));
          
          if (lvl3Units.length >= 3 && hasLvl3Skills && currentPlayer.questProgress.level3MonstersDefeated > 0) {
             return isBossB - isBossA; // Prioritize boss
          } else {
             return isBossA - isBossB; // Avoid boss
          }
        });

        handleHexClick(validCombatHexes[0].q, validCombatHexes[0].r);
      } else {
        handleCancelAction();
      }
      return;
    }

    if (gameState.isSelectingMonsterLevel && gameState.pendingCombatHex) {
      // AI chooses the highest monster level it can fight based on combat power
      const combatPower = getHexCombatPower(currentPlayer.id, gameState.pendingCombatHex.q, gameState.pendingCombatHex.r);
      const canFightLevel2 = currentPlayer.questProgress.monstersDefeated > 0;
      const canFightLevel3 = currentPlayer.questProgress.level2MonstersDefeated > 0;
      
      let level = 1;
      if (combatPower >= 150 && canFightLevel3) {
        level = 3;
      } else if (combatPower >= 80 && canFightLevel2) {
        level = 2;
      }
      
      const defenderId = level === 1 ? 'monster' : level === 2 ? 'monster2' : 'monster3';
      setGameState(prev => ({ ...prev, isSelectingMonsterLevel: false }));
      startCombat(currentPlayer.id, defenderId, gameState.pendingCombatHex.q, gameState.pendingCombatHex.r);
      return;
    }

    if (isSelectingAdventureHex) {
      const currentPlayerId = currentPlayer.id;
      const validAdventureHexes = gameState.units
        .filter(u => u.playerId === currentPlayerId)
        .map(u => ({ q: u.q, r: u.r }))
        .filter(pos => {
          const tile = gameState.board.find(t => t.q === pos.q && t.r === pos.r);
          return tile && (tile.hasAdventureMarker || tile.hasAdvancedAdventureMarker);
        });

      if (validAdventureHexes.length > 0) {
        handleHexClick(validAdventureHexes[0].q, validAdventureHexes[0].r);
      } else {
        handleCancelAction();
      }
      return;
    }

    if (isSelectingUnitTypeForSkill && selectedSkill) {
      const myUnits = gameState.units.filter(u => u.playerId === currentPlayer.id);
      const usefulUnitType = (['warrior', 'mage', 'knight'] as const).find(unitType => {
        const isOnBoard = myUnits.some(u => u.type === unitType);
        if (!isOnBoard) return false;

        const level = currentPlayer.unitLevels[unitType];
        if (selectedSkill.level === 3 && level < 3) return false;
        if (selectedSkill.level === 2 && level < 2) return false;
        const currentSkills = currentPlayer.unitTypeSkills[unitType];
        const hasEmptySlot = currentSkills.some(sk => sk === null);
        if (hasEmptySlot) return true;
        const hasLowerLevelSkill = currentSkills.some(sk => sk !== null && sk.level < selectedSkill.level);
        if (hasLowerLevelSkill) return true;
        return false;
      });

      if (usefulUnitType) {
        handleSelectUnitTypeForSkill(usefulUnitType);
      } else {
        handleCancelAction();
      }
      return;
    }

    if (isSelectingSkillSlot && (gameState.targetUnitId || gameState.targetUnitType)) {
      const unitType = gameState.targetUnitType || (gameState.targetUnitId ? gameState.units.find(u => u.id === gameState.targetUnitId)?.type : null);
      if (unitType && gameState.selectedSkill) {
        const skills = currentPlayer.unitTypeSkills[unitType as 'warrior' | 'mage' | 'knight'];
        const emptySlotIndex = skills.findIndex(s => s === null);
        
        if (emptySlotIndex !== -1) {
          handleApplySkill(unitType as 'warrior' | 'mage' | 'knight', emptySlotIndex);
        } else {
          // Priority 3: Only substitute a skill in a skill slot if the new skill is from a higher level
          const lowerLevelIndex = skills.findIndex(s => s !== null && s.level < (gameState.selectedSkill?.level || 0));
          if (lowerLevelIndex !== -1) {
            handleApplySkill(unitType as 'warrior' | 'mage' | 'knight', lowerLevelIndex);
          } else {
            handleCancelAction();
          }
        }
      } else {
        handleCancelAction();
      }
      return;
    }

    if (isBuyingSkill) {
      if (gameState.selectedSkill) {
        const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
        const myUnits = gameState.units.filter(u => u.playerId === currentPlayerId);
        
        // Find a unit that meets the level requirement AND is useful for the selected skill
        const validUnit = myUnits.find(u => {
            const unitLevel = currentPlayer.unitLevels[u.type];
            if (gameState.selectedSkill?.level === 3 && unitLevel < 3) return false;
            if (gameState.selectedSkill?.level === 2 && unitLevel < 2) return false;
            
            const currentSkills = currentPlayer.unitTypeSkills[u.type];
            const hasEmptySlot = currentSkills.some(s => s === null);
            if (hasEmptySlot) return true;
            
            const hasLowerLevelSkill = currentSkills.some(s => s !== null && s.level < (gameState.selectedSkill?.level || 0));
            if (hasLowerLevelSkill) return true;
            
            return false;
        });

        if (validUnit) {
          setGameState(prev => ({
              ...prev,
              targetUnitId: validUnit.id,
              targetUnitType: validUnit.type,
              isSelectingSkillSlot: true,
              logs: [...prev.logs, `Selected ${validUnit.type}. Now choose a skill slot.`]
          }));
        } else {
          handleCancelAction();
        }
      } else {
        // AI skill selection logic
        const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
        const myUnits = gameState.units.filter(u => u.playerId === currentPlayerId);
        
        const isSkillUsefulForAI = (s: Skill) => {
          return (['warrior', 'mage', 'knight'] as const).some(unitType => {
            // Check if this unit type is on the board
            const isOnBoard = myUnits.some(u => u.type === unitType);
            if (!isOnBoard) return false;

            const level = currentPlayer.unitLevels[unitType];
            if (s.level === 3 && level < 3) return false;
            if (s.level === 2 && level < 2) return false;
            const currentSkills = currentPlayer.unitTypeSkills[unitType];
            const hasEmptySlot = currentSkills.some(sk => sk === null);
            if (hasEmptySlot) return true;
            const hasLowerLevelSkill = currentSkills.some(sk => sk !== null && sk.level < s.level);
            if (hasLowerLevelSkill) return true;
            return false;
          });
        };

        const checkXpCost = (s: Skill) => {
          let xpCost = s.costXP || 0;
          if (currentPlayer.faction === 'ooze' && (s.level === 2 || s.level === 3)) {
            xpCost += s.level;
          }
          return currentPlayer.xp >= xpCost;
        };

        const usefulLevel1 = (Object.values(SKILLS) as Skill[]).filter(s => !s.isUnique && (gameState.isFreeSkill || currentPlayer.gold >= s.cost) && isSkillUsefulForAI(s));
        const usefulLevel2 = gameState.availableLevel2Skills.filter(s => (gameState.isFreeSkill || (currentPlayer.gold >= s.cost && checkXpCost(s))) && isSkillUsefulForAI(s));
        const usefulLevel3 = gameState.availableLevel3Skills.filter(s => (gameState.isFreeSkill || (currentPlayer.gold >= s.cost && checkXpCost(s))) && isSkillUsefulForAI(s));
        
        let targetSkill: Skill | null = null;

        if (gameState.isFreeSkill && gameState.freeSkillLevel) {
          if (gameState.freeSkillLevel === 3 && usefulLevel3.length > 0) targetSkill = usefulLevel3[0];
          else if (gameState.freeSkillLevel === 2 && usefulLevel2.length > 0) targetSkill = usefulLevel2[0];
          else if (gameState.freeSkillLevel === 1 && usefulLevel1.length > 0) targetSkill = usefulLevel1[0];
        } else {
          // Priority 1: Buy skills for the highest possible level
          if (usefulLevel3.length > 0) targetSkill = usefulLevel3[0];
          else if (usefulLevel2.length > 0) targetSkill = usefulLevel2[0];
          else if (usefulLevel1.length > 0) targetSkill = usefulLevel1[0];
        }

        if (targetSkill) {
          handleSelectSkill(targetSkill);
        } else {
          handleCancelAction();
        }
      }
      return;
    }

    // 7. Main Turn Actions
    if (gamePhase === 'PLAYING') {
      // Priority: Level up to Level 2 in early game to cross red lines, or level 3 later
      const hasLevel1Units = currentPlayer.unitLevels.warrior === 1 || currentPlayer.unitLevels.mage === 1 || currentPlayer.unitLevels.knight === 1;
      const canLevelUpMageTo3 = currentPlayer.unitLevels.mage === 2 && currentPlayer.unitTypeSkills.mage.some(s => s && s.level === 2);
      const canLevelUpKnightTo3 = currentPlayer.unitLevels.knight === 2 && currentPlayer.unitTypeSkills.knight.some(s => s && s.level === 2);
      
      if ((currentPlayer.xp >= 3 && hasLevel1Units) || (currentPlayer.xp >= 6 && (canLevelUpMageTo3 || canLevelUpKnightTo3))) {
        performAction('LEVEL_UP' as any);
        return;
      }

      // Check for completable quests first
      if (!gameState.isCompletingQuest) {
        const canCompleteSecret = currentPlayer.secretQuest && checkQuestFulfillment(currentPlayer, currentPlayer.secretQuest, gameState.board, gameState.units, gameState.buildings);
        const canCompletePublic = gameState.publicQuests.some(q => checkQuestFulfillment(currentPlayer, q, gameState.board, gameState.units, gameState.buildings));
        
        if (canCompleteSecret || canCompletePublic) {
          setGameState(prev => ({ ...prev, isCompletingQuest: true }));
          return;
        }
      }

      // Handle pending moves first
      if (gameState.pendingMoves > 0) {
        const myUnits = gameState.units.filter(u => u.playerId === currentPlayer.id && !gameState.movedUnitIds.includes(u.id) && !u.isExhausted);
        if (myUnits.length > 0) {
          if (!gameState.selectedUnitId) {
            // Select a unit that is NOT currently on a target if possible
            const scoredUnits = myUnits.map(u => {
              let score = 10;
              const tile = gameState.board.find(t => t.q === u.q && t.r === u.r);
              if (tile && (tile.hasAdventureMarker || tile.hasAdvancedAdventureMarker)) score -= 8;
              
              const enemyUnits = gameState.units.filter(eu => eu.q === u.q && eu.r === u.r && eu.playerId !== currentPlayer.id);
              if (enemyUnits.length > 0) {
                if (!isCombatWinnable(u.q, u.r)) {
                  score += 20; // High priority to move away from unwinnable fights
                } else {
                  score -= 8; // Stay and fight if winnable
                }
              }
              
              if (tile?.type === TileType.BOSS || tile?.type === TileType.DUNGEON_ENTRANCE || tile?.hasDungeonEntrance || tile?.type === TileType.ANCIENT_CITY) {
                if (tile?.type === TileType.BOSS || tile?.type === TileType.DUNGEON_ENTRANCE || tile?.hasDungeonEntrance) {
                   if (!isCombatWinnable(u.q, u.r)) {
                     score += 15; // Move away if unwinnable
                   } else {
                     score -= 8;
                   }
                } else {
                  score -= 8; // Ancient city
                }
              }
              
              // Add some randomness
              score += Math.random() * 2;
              return { id: u.id, score };
            });
            scoredUnits.sort((a, b) => b.score - a.score);
            
            if (scoredUnits.length > 0 && scoredUnits[0].score < 5) {
              // All units are on targets, don't move them away
              handleFinishMoves();
            } else if (scoredUnits.length > 0) {
              handleUnitClick(scoredUnits[0].id);
            } else {
              handleFinishMoves();
            }
          } else {
            const unit = myUnits.find(u => u.id === gameState.selectedUnitId);
            if (unit) {
              const neighbors = [
                { dq: 1, dr: -1 }, { dq: 1, dr: 0 }, { dq: 0, dr: 1 },
                { dq: -1, dr: 1 }, { dq: -1, dr: 0 }, { dq: 0, dr: -1 }
              ];
              
              const possibleMoves = neighbors.map(n => ({ q: unit.q + n.dq, r: unit.r + n.dr }))
                .filter(pos => gameState.board.some(t => t.q === pos.q && t.r === pos.r));
              
              if (possibleMoves.length > 0) {
                // Find targets
                const targets: {q: number, r: number, weight: number}[] = [];
                const totalTurns = Math.floor((Date.now() - gameState.gameStartTime) / 1000 / 60); // Rough estimate of game progress
                const myUnits = gameState.units.filter(u => u.playerId === currentPlayer.id);
                const combatPower = myUnits.reduce((acc, u) => {
                  const levelPower = currentPlayer.unitLevels[u.type] * 10;
                  const skillsPower = currentPlayer.unitTypeSkills[u.type].reduce((skillAcc, s) => {
                    if (!s) return skillAcc;
                    return skillAcc + (s.level * 10);
                  }, 0);
                  return acc + levelPower + skillsPower;
                }, 0);
                
                // 1. Resource Tiles (High priority early game)
                const hasLevel1Units = currentPlayer.unitLevels.warrior === 1 || currentPlayer.unitLevels.mage === 1 || currentPlayer.unitLevels.knight === 1;
                gameState.board.forEach(t => {
                  const isEnemyCapital = t.type === TileType.INITIAL && (t.q !== currentPlayer.capitalPosition.q || t.r !== currentPlayer.capitalPosition.r);
                  if (isEnemyCapital) return;

                  if (t.productionGold > 0 || t.productionXP > 0) {
                    // Don't target own capital for movement if we are already outside
                    if (t.q === currentPlayer.capitalPosition.q && t.r === currentPlayer.capitalPosition.r) return;
                    
                    let weight = totalTurns < 5 ? 20 : 10;
                    // Extra priority for XP if we need to level up to Level 2
                    if (t.productionXP > 0 && hasLevel1Units && currentPlayer.xp < 3) {
                      weight += 15;
                    }
                    targets.push({ q: t.q, r: t.r, weight });
                  }
                });

                // 2. Adventure markers
                gameState.board.forEach(t => {
                  if (t.hasAdventureMarker || t.hasAdvancedAdventureMarker) {
                    const weight = currentPlayer.personality === 'BALANCED' ? 15 : 10;
                    targets.push({ q: t.q, r: t.r, weight });
                  }
                });
                
                // 3. Enemy units / Monsters
                const movingUnitPower = currentPlayer.unitLevels[unit.type] * 10 + currentPlayer.unitTypeSkills[unit.type].reduce((acc, s) => acc + (s ? s.level * 10 : 0), 0);
                
                gameState.board.forEach(t => {
                  const isEnemyCapital = t.type === TileType.INITIAL && (t.q !== currentPlayer.capitalPosition.q || t.r !== currentPlayer.capitalPosition.r);
                  if (isEnemyCapital) return;

                  const enemyUnits = gameState.units.filter(u => u.q === t.q && u.r === t.r && u.playerId !== currentPlayer.id);
                  if (enemyUnits.length > 0) {
                    if (isCombatWinnable(t.q, t.r, movingUnitPower)) {
                      let weight = 10;
                      if (currentPlayer.personality === 'COMBAT') weight = 20;
                      targets.push({ q: t.q, r: t.r, weight });
                    } else {
                      targets.push({ q: t.q, r: t.r, weight: -100 }); // Avoid unwinnable fights
                    }
                  }

                  if (t.type === TileType.DUNGEON_ENTRANCE || t.hasDungeonEntrance) {
                    if (isCombatWinnable(t.q, t.r, movingUnitPower)) {
                      let weight = 5;
                      if (combatPower >= 100) weight = 15; // Lvl 2 monster ready
                      if (combatPower >= 150) weight = 25; // Lvl 3 monster ready
                      targets.push({ q: t.q, r: t.r, weight });
                    } else {
                      targets.push({ q: t.q, r: t.r, weight: -100 }); // Avoid unwinnable dungeons
                    }
                  }
                });
                
                // 4. Boss (Only if units are leveled up and grouped)
                const lvl3Units = myUnits.filter(u => currentPlayer.unitLevels[u.type] >= 3);
                const hasLvl3Skills = lvl3Units.some(u => (currentPlayer.unitTypeSkills?.[u.type] || []).some(s => s && s.level === 3));
                if (lvl3Units.length >= 3 && hasLvl3Skills && currentPlayer.questProgress.level3MonstersDefeated > 0) {
                  targets.push({ q: 0, r: 0, weight: 1000 }); // WIN CONDITION (Highest priority)
                } else {
                  targets.push({ q: 0, r: 0, weight: -100 }); // Avoid early
                }
                
                // 5. Ancient Cities (VP)
                gameState.board.forEach(t => {
                  if (t.type === TileType.ANCIENT_CITY) {
                    const myUnitsOnCity = myUnits.filter(u => u.q === t.q && u.r === t.r).length;
                    const myBuildingOnCity = gameState.buildings.some(b => b.q === t.q && b.r === t.r && b.playerId === currentPlayer.id);
                    
                    if (myUnitsOnCity === 0 && !myBuildingOnCity) {
                      targets.push({ q: t.q, r: t.r, weight: 35 }); // High priority to grab uncontrolled cities
                    } else if (myUnitsOnCity > 0 && !myBuildingOnCity) {
                      // Already have a unit there, but no building. Keep unit there.
                      if (unit.q === t.q && unit.r === t.r) {
                        targets.push({ q: t.q, r: t.r, weight: 100 }); // Don't move away!
                      }
                    }
                  }
                });

                // 6. Grouping (2 mages + 1 knight or 2 knights + 1 mage)
                let leadUnit: any = null;
                const mages = myUnits.filter(u => u.type === 'mage');
                const knights = myUnits.filter(u => u.type === 'knight');
                
                if (mages.length >= 2 && knights.length >= 1) {
                  leadUnit = mages[0];
                } else if (knights.length >= 2 && mages.length >= 1) {
                  leadUnit = knights[0];
                } else if (myUnits.length > 0) {
                  leadUnit = myUnits[0];
                }

                if (leadUnit && unit.id !== leadUnit.id) {
                  if (gameState.round >= 13) {
                    // From round 13+, non-lead units ONLY care about sticking with the lead unit
                    targets.length = 0; // Clear all other targets
                    targets.push({ q: leadUnit.q, r: leadUnit.r, weight: 1000 });
                  } else {
                    targets.push({ q: leadUnit.q, r: leadUnit.r, weight: 30 });
                  }
                }

                // Score each possible move
                const scoredMoves = possibleMoves.map(move => {
                  let score = 0;
                  targets.forEach(target => {
                    const dist = getHexDistance(move.q, move.r, target.q, target.r);
                    // Higher score for moving closer to a target
                    score += target.weight / (dist + 0.5);
                  });
                  
                  // Avoid moving back to capital if we are exploring
                  const distToCapital = getHexDistance(move.q, move.r, currentPlayer.capitalPosition.q, currentPlayer.capitalPosition.r);
                  const currentDistToCapital = getHexDistance(unit.q, unit.r, currentPlayer.capitalPosition.q, currentPlayer.capitalPosition.r);
                  
                  if (distToCapital > currentDistToCapital) {
                    score += 1.0; // Preference for moving away from capital
                  } else if (distToCapital < currentDistToCapital) {
                    score -= 2.0; // Increased penalty for moving back towards capital
                  }

                  // Grouping bonus: Prefer hexes with other friendly units (up to 3)
                  const friendlyUnitsOnTarget = gameState.units.filter(u => u.q === move.q && u.r === move.r && u.playerId === currentPlayer.id);
                  if (friendlyUnitsOnTarget.length > 0 && friendlyUnitsOnTarget.length < 3) {
                    score += gameState.round >= 13 ? 50.0 : 5.0; // Significant bonus for grouping
                  }

                  // Check movement cost
                  const cost = getMoveCost(unit.q, unit.r, move.q, move.r, gameState.board, undefined, currentPlayer.passives);
                  const unitLevel = currentPlayer.unitLevels[unit.type];
                  const unitMaxRange = calculateMaxRange(unit.type, unitLevel);

                  let isValid = true;
                  
                  // Never move back to capital if we are already outside
                  const targetTile = gameState.board.find(t => t.q === move.q && t.r === move.r);
                  const isTargetCapital = targetTile?.type === TileType.INITIAL;
                  const isMyCapital = move.q === currentPlayer.capitalPosition.q && move.r === currentPlayer.capitalPosition.r;
                  const isCurrentlyInCapital = unit.q === currentPlayer.capitalPosition.q && unit.r === currentPlayer.capitalPosition.r;
                  
                  if (isMyCapital && !isCurrentlyInCapital) {
                    isValid = false;
                  }

                  if (isTargetCapital && !isMyCapital) {
                    isValid = false;
                  }

                  // Respect 3-unit limit (Capitals are exempt)
                  const friendlyUnitsOnTargetLimit = gameState.units.filter(u => u.q === move.q && u.r === move.r && u.playerId === currentPlayer.id);
                  if (friendlyUnitsOnTargetLimit.length >= 3 && !isTargetCapital) {
                    isValid = false;
                  }

                  if (cost > unitMaxRange) {
                    if (cost === 2 && unitMaxRange === 1 && gameState.pendingMoves > 1) {
                      // We can ignore the red line by spending an extra move
                      score -= 2; // Penalty for using an extra move
                    } else {
                      isValid = false;
                    }
                  } else if (cost > 1) {
                    // Reduced penalty for Level 2+ units to encourage crossing red lines
                    score -= unitLevel >= 2 ? 1 : 5;
                  }

                  // Add a tiny bit of randomness to break ties
                  score += Math.random() * 0.1;

                  return { ...move, score, isValid };
                });

                // Filter valid moves and sort by score descending
                const validMoves = scoredMoves.filter(m => m.isValid).sort((a, b) => b.score - a.score);
                
                if (validMoves.length > 0) {
                  handleHexClick(validMoves[0].q, validMoves[0].r);
                } else {
                  handleFinishMoves();
                }
              } else {
                handleFinishMoves();
              }
            } else {
              handleFinishMoves();
            }
          }
        } else {
          handleFinishMoves();
        }
        return;
      }

      if (currentPlayer.actionsRemaining > 0) {
        const possibleActions: ActionType[] = (Object.values(ActionType) as ActionType[]).filter(actionType => {
          const isFree = gameState.freeProductionActions.includes(actionType);
          const cubes = currentPlayer.actionSlots[actionType] || 0;
          const cost = isFree ? 0 : cubes * 2;
          const canAfford = currentPlayer.gold >= cost;
          let canAct = canAfford;
          if (actionType === ActionType.PRODUCTION) {
            if (currentPlayer.actionsRemaining < 2) canAct = false;
            // Avoid production if already at limits
            if (currentPlayer.gold >= MAX_GOLD && currentPlayer.xp >= MAX_XP) {
              canAct = false;
            }
          }
          
          // Additional checks for AI to avoid useless actions
          if (actionType === ActionType.MOVE_1 || actionType === ActionType.MOVE_2) {
            const hasMovableUnit = gameState.units.some(u => u.playerId === currentPlayer.id && !u.isExhausted);
            if (!hasMovableUnit) canAct = false;
          }

          if (actionType === ActionType.COMBAT) {
            const hasCombatReadyUnit = gameState.units.some(u => {
              if (u.playerId !== currentPlayer.id || u.isExhausted) return false;
              const enemyUnits = gameState.units.filter(eu => eu.q === u.q && eu.r === u.r && eu.playerId !== currentPlayer.id);
              const tile = gameState.board.find(t => t.q === u.q && t.r === u.r);
              const hasEnemy = enemyUnits.length > 0 || tile?.type === TileType.DUNGEON_ENTRANCE || tile?.hasDungeonEntrance || tile?.type === TileType.BOSS;
              return hasEnemy && isCombatWinnable(u.q, u.r);
            });
            if (!hasCombatReadyUnit) canAct = false;
          }

          if (actionType === ActionType.ADVENTURE) {
            const hasAdventureReadyUnit = gameState.units.some(u => {
              if (u.playerId !== currentPlayer.id || u.isExhausted) return false;
              const tile = gameState.board.find(t => t.q === u.q && t.r === u.r);
              return tile && (tile.hasAdventureMarker || tile.hasAdvancedAdventureMarker);
            });
            if (!hasAdventureReadyUnit) canAct = false;
          }

          if (actionType === ActionType.BUILD_CASTLE) {
            if (currentPlayer.availableUnits.castles <= 0) canAct = false;
            else {
              const hasValidCastleHex = gameState.units.some(u => {
                if (u.playerId !== currentPlayer.id || u.isExhausted) return false;
                const tile = gameState.board.find(t => t.q === u.q && t.r === u.r);
                if (!tile) return false;
                const enemyUnits = gameState.units.filter(eu => eu.q === u.q && eu.r === u.r && eu.playerId !== currentPlayer.id);
                const currentCastles = gameState.buildings.filter(b => b.q === u.q && b.r === u.r && b.type === 'castle').length;
                return enemyUnits.length === 0 && currentCastles < tile.castleSlots;
              });
              if (!hasValidCastleHex) canAct = false;
            }
          }

          if (actionType === ActionType.RECRUIT) {
            const canAffordWarrior = currentPlayer.gold >= (cost + 4) && currentPlayer.availableUnits.warriors > 0;
            const canAffordMage = currentPlayer.gold >= (cost + 6) && currentPlayer.availableUnits.mages > 0;
            const canAffordKnight = currentPlayer.gold >= (cost + 8) && currentPlayer.availableUnits.knights > 0;
            
            if (!canAffordWarrior && !canAffordMage && !canAffordKnight) canAct = false;
          }

          if (actionType === ActionType.BUILD_MONUMENT) {
            if (currentPlayer.gold < (cost + 10) || currentPlayer.xp < 5) canAct = false;
          }

          if (actionType === ActionType.COMPLETE_QUEST) {
            const canComplete = (currentPlayer.secretQuest && checkQuestFulfillment({ ...currentPlayer, gold: currentPlayer.gold - cost }, currentPlayer.secretQuest, gameState.board, gameState.units, gameState.buildings)) ||
              gameState.publicQuests.some(q => checkQuestFulfillment({ ...currentPlayer, gold: currentPlayer.gold - cost }, q, gameState.board, gameState.units, gameState.buildings));
            if (!canComplete) canAct = false;
          }

          if (actionType === ActionType.BUY_SKILL) {
            const availableSkills = [
              ...(Object.values(SKILLS) as Skill[]).filter(s => !s.isUnique),
              ...gameState.availableLevel2Skills,
              ...gameState.availableLevel3Skills
            ];
            const myUnits = gameState.units.filter(u => u.playerId === currentPlayer.id);
            const usefulSkills = availableSkills.filter(s => {
              const goldCost = cost + s.cost;
              let xpCost = s.costXP || 0;
              if (currentPlayer.faction === 'ooze' && (s.level === 2 || s.level === 3)) {
                xpCost += s.level;
              }
              if (currentPlayer.gold < goldCost || currentPlayer.xp < xpCost) return false;
              
              if (s.isUnique || s.id.includes('UNIQUE')) {
                const hasSkill = currentPlayer.unitTypeSkills.warrior.some(ws => ws?.id === s.id) ||
                                 currentPlayer.unitTypeSkills.mage.some(ms => ms?.id === s.id) ||
                                 currentPlayer.unitTypeSkills.knight.some(ks => ks?.id === s.id);
                if (hasSkill) return false;
              }

              return (['warrior', 'mage', 'knight'] as const).some(unitType => {
                const level = currentPlayer.unitLevels[unitType];
                if (s.level === 3 && level < 3) return false;
                if (s.level === 2 && level < 2) return false;
                
                const currentSkills = currentPlayer.unitTypeSkills[unitType];
                const hasEmptySlot = currentSkills.some(sk => sk === null);
                if (hasEmptySlot) return true;
                
                const hasLowerLevelSkill = currentSkills.some(sk => sk !== null && sk.level < s.level);
                if (hasLowerLevelSkill) return true;
                
                return false;
              });
            });
            if (usefulSkills.length === 0 || myUnits.length === 0) canAct = false;
          }

          return canAct;
        });

        if (possibleActions.length > 0) {
          // Calculate weights for each action based on personality and game state
          const weights: Record<string, number> = {
            [ActionType.PRODUCTION]: 10,
            [ActionType.MOVE_1]: 5,
            [ActionType.MOVE_2]: 8,
            [ActionType.ADVENTURE]: 12,
            [ActionType.COMPLETE_QUEST]: 20,
            [ActionType.BUILD_CASTLE]: 10,
            [ActionType.RECRUIT]: 10,
            [ActionType.BUILD_MONUMENT]: 5,
            [ActionType.COMBAT]: 12,
            [ActionType.BUY_SKILL]: 14,
          };

          // Boost free actions significantly
          gameState.freeProductionActions.forEach(action => {
            if (weights[action] !== undefined) {
              weights[action] += 100; // High priority for free actions
            }
          });

          // --- AI INSIGHTS & STRATEGY ADJUSTMENTS ---
          const calculateFutureVPPotential = (p: Player, s: GameState) => {
            let potential = 0;
            // 1. Distance to ancient cities (1 VP each)
            const cities = s.board.filter(t => t.type === TileType.ANCIENT_CITY);
            cities.forEach(city => {
              const dist = getHexDistance(p.capitalPosition.q, p.capitalPosition.r, city.q, city.r);
              if (dist < 4) potential += 3;
              else if (dist < 7) potential += 1.5;
            });
            // 2. Boss distance (5 VP)
            const bossDist = getHexDistance(p.capitalPosition.q, p.capitalPosition.r, 0, 0);
            if (bossDist < 6) potential += 4;
            else if (bossDist < 10) potential += 2;
            
            // 3. Quest progress (2 VP each)
            const quests = [...s.publicQuests];
            if (p.secretQuest) quests.push(p.secretQuest);
            quests.forEach(q => {
              // Heuristic for quest progress
              if (q.type === 'MONSTERS' && p.questProgress.monstersDefeated > q.requirement / 2) potential += 2;
              if (q.type === 'CASTLES' && p.deployedUnits.castles > q.requirement / 2) potential += 2;
              if (q.type === 'SPEND_GOLD' && p.gold > q.requirement / 2) potential += 1.5;
            });

            // 4. Monument potential (1 VP each)
            if (p.gold >= 10 && p.xp >= 5) potential += 2.5;

            // 5. Skill/Level potential (leads to better combat/quests)
            const avgLevel = (p.unitLevels.warrior + p.unitLevels.mage + p.unitLevels.knight) / 3;
            if (avgLevel > 2) potential += 2;

            return potential;
          };

          const futureVP = calculateFutureVPPotential(currentPlayer, gameState);

          Object.keys(weights).forEach((actionKey) => {
            const action = actionKey as ActionType;
            
            // Insight adjustment: prefer actions that have been successful
            const successRate = gameState.aiInsights?.actionSuccessRates[action] ?? 0.5;
            weights[action] *= (0.5 + successRate);

            // Strategy adjustment: boost actions that are part of the current plan
            if (currentPlayer.aiStrategy?.plannedActions.includes(action)) {
              weights[action] += 40; // Increased boost
            }

            // Future VP boost
            if (futureVP > 3) {
              if (action === ActionType.MOVE_2 || action === ActionType.MOVE_1) weights[action] += 15;
              if (action === ActionType.COMBAT) weights[action] += 10;
            }

            // Long-term target boost
            if (currentPlayer.aiStrategy?.longTermTarget && (action === ActionType.MOVE_2 || action === ActionType.MOVE_1)) {
              weights[action] += 25;
            }

            // History adjustment: penalize repeating the same action too much
            const recentActions = (currentPlayer.lastActions || []).slice(-5);
            const repeatCount = recentActions.filter(a => a === action).length;
            weights[action] -= (repeatCount * 15);
            
            // Goal-specific boosts
            if (currentPlayer.aiStrategy?.currentGoal === 'EXPANSION' && action === ActionType.PRODUCTION) weights[action] += 20;
            if (currentPlayer.aiStrategy?.currentGoal === 'MILITARY' && action === ActionType.RECRUIT) weights[action] += 20;
            if (currentPlayer.aiStrategy?.currentGoal === 'QUESTING' && action === ActionType.COMBAT) weights[action] += 20;
            if (currentPlayer.aiStrategy?.currentGoal === 'BOSS_RUSH' && action === ActionType.COMBAT) weights[action] += 30;
            if (currentPlayer.aiStrategy?.currentGoal === 'VICTORY_POINTS') {
              if (action === ActionType.BUILD_MONUMENT) weights[action] += 50;
              if (action === ActionType.BUILD_CASTLE) weights[action] += 40;
              if (action === ActionType.COMBAT) weights[action] += 30;
            }

            // History failure adjustment: penalize actions that failed recently
            const recentFailures = (currentPlayer.actionHistory || []).filter(h => h.action === action && !h.success).slice(-5).length;
            weights[action] -= (recentFailures * 25);

            // Resource-based boosts
            if (action === ActionType.BUILD_MONUMENT && currentPlayer.gold >= 10 && currentPlayer.xp >= 5) {
              weights[action] += 60;
            }
            if (action === ActionType.BUILD_CASTLE && currentPlayer.gold >= 5 && currentPlayer.availableUnits.castles > 0) {
              weights[action] += 40;
            }

            if (weights[action] < 1) weights[action] = 1;
          });

          // --- VP-Based Planning Logic ---
          const myUnits = gameState.units.filter(u => u.playerId === currentPlayer.id);
          const combatPower = myUnits.reduce((acc, u) => {
            const levelPower = currentPlayer.unitLevels[u.type] * 10;
            const skillsPower = currentPlayer.unitTypeSkills[u.type].reduce((skillAcc, s) => {
              if (!s) return skillAcc;
              return skillAcc + (s.level * 10);
            }, 0);
            return acc + levelPower + skillsPower;
          }, 0);
          
          let needsGold = false;
          let needsXP = false;
          let needsUnits = false;
          let needsCastles = false;
          let needsCombat = false;
          let needsMovement = false;

          // 1. Quests (High Priority VP)
          const allQuests = [...gameState.publicQuests];
          if (currentPlayer.secretQuest) allQuests.push(currentPlayer.secretQuest);

          allQuests.forEach(q => {
            if (q.type === 'BUILD_CASTLES') {
               const castles = gameState.buildings.filter(b => b.playerId === currentPlayer.id && b.type === 'castle').length;
               if (castles < q.requirement) {
                 needsCastles = true;
                 if (currentPlayer.gold < 5) needsGold = true;
               }
            } else if (q.type === 'DEFEAT_MONSTERS') {
               if (currentPlayer.questProgress.monstersDefeated < q.requirement) {
                 needsCombat = true;
                 needsMovement = true;
               }
            } else if (q.type === 'SPEND_GOLD') {
               if (currentPlayer.gold < q.requirement) needsGold = true;
            } else if (q.type === 'SPEND_XP') {
               if (currentPlayer.xp < q.requirement) needsXP = true;
            } else if (q.type === 'UNIT_COMPOSITION') {
               const mages = myUnits.filter(u => u.type === 'mage').length;
               const knights = myUnits.filter(u => u.type === 'knight').length;
               if (mages < q.requirement.mages || knights < q.requirement.knights) {
                 needsUnits = true;
                 if (currentPlayer.gold < 4) needsGold = true;
               }
            }
          });

          // 2. Monster VP (1 VP for first Lvl 2, 1 VP for first Lvl 3)
          if (currentPlayer.questProgress.level2MonstersDefeated === 0) {
            if (combatPower >= 100) {
              needsCombat = true;
              needsMovement = true;
            } else {
              needsUnits = true;
              needsXP = true; // for level up
            }
          } else if (currentPlayer.questProgress.level3MonstersDefeated === 0) {
            if (combatPower >= 180) {
              needsCombat = true;
              needsMovement = true;
            } else {
              needsUnits = true;
              needsXP = true; // for level up
            }
          }

          // 3. Boss VP (Win condition)
          const lvl3Units = myUnits.filter(u => currentPlayer.unitLevels[u.type] >= 3);
          const hasLvl3Skills = lvl3Units.some(u => (currentPlayer.unitTypeSkills?.[u.type] || []).some(s => s && s.level === 3));
          if (lvl3Units.length >= 3 && hasLvl3Skills && currentPlayer.questProgress.level3MonstersDefeated > 0) {
             needsMovement = true; // Move to boss
             needsCombat = true;   // Fight boss
          }

          // 4. Ancient Cities (1 VP each)
          const ancientCities = gameState.board.filter(t => t.type === TileType.ANCIENT_CITY);
          let uncontrolledAncientCities = 0;
          let myAncientCities = 0;
          
          ancientCities.forEach(city => {
            const hasMyUnit = myUnits.some(u => u.q === city.q && u.r === city.r);
            const hasMyCastle = gameState.buildings.some(b => b.playerId === currentPlayer.id && b.q === city.q && b.r === city.r && b.type === 'castle');
            
            if (!hasMyUnit && !hasMyCastle) {
              uncontrolledAncientCities++;
            } else if (hasMyUnit || hasMyCastle) {
              myAncientCities++;
            }
          });

          if (uncontrolledAncientCities > 0) {
            needsMovement = true;
          }

          // 5. Monuments (1 VP)
          const currentVP = currentPlayer.score + myAncientCities;
          if (currentVP >= 8 || (currentPlayer.gold >= 10 && currentPlayer.xp >= 5)) {
            weights[ActionType.BUILD_MONUMENT] += 40;
            if (currentPlayer.gold < 10) needsGold = true;
            if (currentPlayer.xp < 5) needsXP = true;
          }

          // Late Game Push (Round 20+)
          if (gameState.round >= 20) {
            // Monuments are a focus in late game
            if (currentPlayer.gold >= 10 && currentPlayer.xp >= 5) {
               weights[ActionType.BUILD_MONUMENT] += 30; 
            } else {
               weights[ActionType.PRODUCTION] += 20; // Need resources for monuments
            }
            
            if (myUnits.length < 3) {
              needsUnits = true;
              weights[ActionType.RECRUIT] += 50;
            } else if (combatPower < 150) {
              needsXP = true;
              weights[ActionType.BUY_SKILL] += 50;
              weights[ActionType.PRODUCTION] += 30; // Need gold for skills
            } else {
              // We have an army > 150 combat power
              // Priority: Level 3 Monster -> Boss
              if (currentPlayer.questProgress.level2MonstersDefeated === 0) {
                needsMovement = true;
                needsCombat = true;
                weights[ActionType.MOVE_1] += 50;
                weights[ActionType.MOVE_2] += 60;
                weights[ActionType.COMBAT] += 80; // Higher than monument
              } else if (currentPlayer.questProgress.level3MonstersDefeated === 0) {
                needsMovement = true;
                needsCombat = true;
                weights[ActionType.MOVE_1] += 60;
                weights[ActionType.MOVE_2] += 70;
                weights[ActionType.COMBAT] += 90; // Higher than monument
              } else {
                // Go for the boss
                needsMovement = true;
                needsCombat = true;
                weights[ActionType.MOVE_1] += 70;
                weights[ActionType.MOVE_2] += 80;
                weights[ActionType.COMBAT] += 100; // Absolute priority
              }
            }
          }

          // Apply VP-based weights
          if (needsGold) weights[ActionType.PRODUCTION] += 25;
          if (needsXP) {
            weights[ActionType.ADVENTURE] += 15;
            weights[ActionType.COMBAT] += 10;
          }
          if (needsUnits) {
            weights[ActionType.RECRUIT] += 25;
            if (currentPlayer.gold < 4) weights[ActionType.PRODUCTION] += 15;
          }
          if (needsCastles) {
            weights[ActionType.BUILD_CASTLE] += 30;
            needsMovement = true; // Need to move to valid hexes
          }
          if (needsCombat) {
            weights[ActionType.COMBAT] += 25;
          }
          if (needsMovement) {
            weights[ActionType.MOVE_1] += 15;
            weights[ActionType.MOVE_2] += 20;
          }

          // Always highly prioritize completing a quest if we can
          weights[ActionType.COMPLETE_QUEST] += 50;

          // --- End VP-Based Planning Logic ---

          // Personality adjustments
          if (currentPlayer.personality === 'COMBAT') {
            weights[ActionType.COMBAT] += 15;
            weights[ActionType.BUY_SKILL] += 8;
            weights[ActionType.RECRUIT] += 5;
          } else if (currentPlayer.personality === 'CASTLES') {
            weights[ActionType.BUILD_CASTLE] += 20;
            weights[ActionType.PRODUCTION] += 10;
            weights[ActionType.RECRUIT] += 5;
          } else if (currentPlayer.personality === 'UNITS') {
            weights[ActionType.RECRUIT] += 20;
            weights[ActionType.MOVE_2] += 10;
            weights[ActionType.PRODUCTION] += 5;
          } else if (currentPlayer.personality === 'BALANCED') {
            weights[ActionType.ADVENTURE] += 10;
            weights[ActionType.COMPLETE_QUEST] += 10;
          }

          // Strategic adjustments
          if (myUnits.length < 3) {
            weights[ActionType.RECRUIT] += 20;
          }

          const totalCubesOut = Object.values(currentPlayer.actionSlots).reduce((a, b) => (a as number) + (b as number), 0) as number;
          if (totalCubesOut >= 4) {
            weights[ActionType.PRODUCTION] += 30;
          }

          // Avoid repeating production twice in a row
          // Avoid production if close to resource limits
          if (currentPlayer.gold >= MAX_GOLD - 2 || currentPlayer.xp >= MAX_XP - 1) {
            weights[ActionType.PRODUCTION] -= 40;
          }

          if (currentPlayer.lastActionType === ActionType.PRODUCTION) {
            weights[ActionType.PRODUCTION] = -100;
          }

          // Avoid repeating actions taken recently
          if (currentPlayer.lastActions) {
            currentPlayer.lastActions.forEach(action => {
              if (weights[action] !== undefined && action !== ActionType.PRODUCTION && action !== ActionType.COMPLETE_QUEST) {
                weights[action] -= 20; // Penalize recently taken actions heavily to avoid repetition
              }
            });
          }

          // Synergy with previous actions (short-term planning)
          if (currentPlayer.lastActions && currentPlayer.lastActions.length > 0) {
            const lastAction = currentPlayer.lastActions[currentPlayer.lastActions.length - 1];
            if (lastAction === ActionType.RECRUIT) {
              weights[ActionType.MOVE_1] += 15;
              weights[ActionType.MOVE_2] += 15;
            } else if (lastAction === ActionType.MOVE_1 || lastAction === ActionType.MOVE_2) {
              weights[ActionType.COMBAT] += 15;
              weights[ActionType.BUILD_CASTLE] += 15;
              weights[ActionType.ADVENTURE] += 15;
            } else if (lastAction === ActionType.PRODUCTION) {
              weights[ActionType.RECRUIT] += 15;
              weights[ActionType.BUY_SKILL] += 15;
              weights[ActionType.BUILD_CASTLE] += 15;
            }
          }

          // If we have enough XP to level up, prioritize production to retrieve cubes and potentially level up
          const hasLevel1Units = currentPlayer.unitLevels.warrior === 1 || currentPlayer.unitLevels.mage === 1 || currentPlayer.unitLevels.knight === 1;
          if ((currentPlayer.xp >= 3 && hasLevel1Units) || currentPlayer.xp >= 6) {
            weights[ActionType.PRODUCTION] += 20;
          }

          // If we have a lot of gold, prioritize buying skills or recruiting
          if (currentPlayer.gold >= 15) {
            weights[ActionType.BUY_SKILL] += 15;
            weights[ActionType.RECRUIT] += 10;
          }

          // Filter possible actions and sort by weight
          const scoredActions = possibleActions
            .map(action => ({ action, score: weights[action] + Math.random() * 5 }))
            .sort((a, b) => b.score - a.score);

          if (scoredActions.length > 0 && scoredActions[0].score > 0) {
            performAction(scoredActions[0].action);
          } else {
            endTurn();
          }
        } else {
          endTurn();
        }
      } else {
        endTurn();
      }
    }
  }, [gameState, handleHexClick, handleSelectInitialQuest, handleSelectAdvancedQuest, handleLevelUp, handleCancelLevelUp, resolveCombat, handleApplyCombatDamage, handleCloseCombat, handleNextRound, handleAdventureChoice, performAction, endTurn, handleCancelAction, handleSelectRecruitUnit, handleSelectSkill, handleApplySkill, handleUnitClick, handleFinishMoves, checkQuestFulfillment, handleCompleteQuest, handleEventChoice]);

  useEffect(() => {
    if (gameState.gamePhase !== 'SETUP' && !gameState.isGameOver && !gameState.isPaused) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer?.isAI) {
        const timer = setTimeout(() => {
          performAITurn();
        }, gameState.aiSpeed);
        return () => clearTimeout(timer);
      }
    } else if (gameState.gamePhase === 'SETUP' && !gameState.isPaused) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer?.isAI) {
            const timer = setTimeout(() => {
                performAITurn();
            }, gameState.aiSpeed);
            return () => clearTimeout(timer);
        }
    }
  }, [gameState.currentPlayerIndex, gameState.gamePhase, gameState.isGameOver, gameState.isPaused, gameState.aiSpeed, gameState.isRecruiting, gameState.isBuildingCastle, gameState.isSelectingCombatHex, gameState.isSelectingAdventureHex, gameState.isBuyingSkill, gameState.isSelectingSkillSlot, gameState.combatState, gameState.currentAdventure, gameState.isSelectingInitialQuest, gameState.isLevelingUp, performAITurn]);

  if (gameState.gamePhase === 'SETUP') {
    return (
      <div className="min-h-screen w-full bg-slate-950 overflow-y-auto">
        <Setup 
          onStart={startGame} 
          onShowAssets={() => setShowAssets(true)} 
          onLoadGame={fetchSavedGames}
          intro={intro} 
        />

        {showLoadModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowLoadModal(false)}>
            <div className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl fantasy-font text-yellow-500 mb-6 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Load Chronicles
              </h2>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {savedGames.length === 0 ? (
                  <p className="text-slate-500 text-center py-8 italic">No saved chronicles found.</p>
                ) : (
                  savedGames.map(game => (
                    <button
                      key={game.id}
                      onClick={() => loadGameById(game.id)}
                      className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-yellow-500/50 rounded-xl text-left transition-all group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-yellow-500 font-bold group-hover:text-yellow-400 transition-colors">
                          {game.player_name}'s Saga
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(game.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          <span className="text-[11px] text-slate-300">{game.state?.players?.length || 0} Players</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                          <span className="text-[11px] text-slate-300">Round {game.state?.round || 1}</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-600 uppercase tracking-widest mt-2">
                        ID: {game.id.slice(0, 8)}...
                      </div>
                    </button>
                  ))
                )}
              </div>

              <button 
                onClick={() => setShowLoadModal(false)}
                className="mt-6 w-full py-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 transition-colors text-sm font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {showAssets && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowAssets(false)}>
            <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
              <AssetManager />
              <button 
                onClick={() => setShowAssets(false)}
                className="mt-4 w-full py-2 bg-slate-800 text-slate-300 rounded-lg border border-white/10 hover:bg-slate-700 transition-all font-bold"
              >
                Close Asset Manager
              </button>
            </div>
          </div>
        )}

        {showLeaderboard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowLeaderboard(false)}>
            <div className="max-w-md w-full" onClick={e => e.stopPropagation()}>
              <Leaderboard />
              <button 
                onClick={() => setShowLeaderboard(false)}
                className="mt-4 w-full py-2 bg-slate-800 text-slate-300 rounded-lg border border-white/10 hover:bg-slate-700 transition-all font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-slate-950 overflow-hidden text-slate-200">
      {/* Sidebar for stats - Hidden on mobile unless tab active */}
      <div className={`${activeTab === 'STATS' ? 'flex' : 'hidden'} md:flex md:w-80 shrink-0 h-full z-30 fixed inset-0 md:relative bg-slate-950 md:bg-transparent`}>
          <Sidebar 
            players={gameState.players} 
            currentIndex={gameState.currentPlayerIndex} 
            units={gameState.units}
            buildings={gameState.buildings}
            board={gameState.board}
            gameId={gameId}
            aiSpeed={gameState.aiSpeed}
            isPaused={gameState.isPaused}
            pauseOnAICombat={gameState.pauseOnAICombat}
            isChroniclesVisible={gameState.isChroniclesVisible}
            activeYearlyEffects={gameState.activeYearlyEffects}
            onUpdateSettings={(settings) => setGameState(prev => ({ ...prev, ...settings }))}
            onSaveGame={saveGame}
            onGoToMainMenu={goToMainMenu}
            onShowLeaderboard={() => setShowLeaderboard(true)}
            onHover={handleHover}
            onClearHover={clearHover}
          />
        <button 
          onClick={() => setActiveTab('GAME')}
          className="absolute top-4 right-4 md:hidden p-2 bg-slate-800 rounded-full border border-white/10 text-slate-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      
      {/* Main Game Area */}
      {isTutorialActive && <TutorialOverlay onClose={endTutorial} />}
      <main className={`${activeTab === 'GAME' ? 'flex' : 'hidden'} md:flex flex-1 flex-col relative overflow-hidden h-full`}>
        <header className="flex justify-between items-center px-4 py-2 md:py-3 border-b border-white/10 bg-slate-900/50 backdrop-blur-md z-20">
          <div>
            <h1 className="text-lg md:text-3xl fantasy-font text-yellow-500 tracking-widest uppercase">Alderys</h1>
            <div className="text-[8px] md:text-[10px] uppercase tracking-widest opacity-50 md:hidden">
              {gameState.players[gameState.currentPlayerIndex]?.name}
            </div>
          </div>
          <div className="flex flex-wrap justify-end items-center gap-2 md:gap-4">
            <button
              onClick={() => setShowQuests(true)}
              className="px-3 py-1.5 bg-indigo-900/50 hover:bg-indigo-800/50 border border-indigo-500/30 rounded-lg text-xs font-bold text-indigo-300 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
              <span className="hidden md:inline">Quests</span>
            </button>
            <button
              onClick={() => setShowSkills(true)}
              className="px-3 py-1.5 bg-emerald-900/50 hover:bg-emerald-800/50 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-300 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
              <span className="hidden md:inline">Skills</span>
            </button>
            <button
              onClick={() => setShowRules(true)}
              className="px-3 py-1.5 bg-amber-900/50 hover:bg-amber-800/50 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-300 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              <span className="hidden md:inline">Rules</span>
            </button>
            <button
              onClick={() => setGameState(prev => ({ ...prev, isChroniclesVisible: !prev.isChroniclesVisible }))}
              className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${gameState.isChroniclesVisible ? 'bg-purple-900/50 border-purple-500/30 text-purple-300' : 'bg-slate-900/50 border-white/10 text-slate-400'}`}
              title={gameState.isChroniclesVisible ? "Hide Chronicles" : "Show Chronicles"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span className="hidden md:inline">Chronicles</span>
            </button>
            <div className="text-[10px] md:text-xs uppercase tracking-tighter opacity-50 hidden md:block">Turn: {gameState.currentPlayerIndex + 1}</div>
            <button 
              onClick={() => setActiveTab('STATS')}
              className="md:hidden p-1.5 bg-slate-800 rounded-lg border border-white/10"
              title="Stats"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </button>
            <button 
              onClick={() => setActiveTab('LOGS')}
              className="md:hidden p-1.5 bg-slate-800 rounded-lg border border-white/10"
              title="Logs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-1 md:p-4 overflow-hidden relative">
            <GameBoard 
                board={gameState.board} 
                players={gameState.players} 
                currentPlayerIndex={gameState.currentPlayerIndex} 
                units={gameState.units}
                buildings={gameState.buildings}
                selectedUnitId={gameState.selectedUnitId}
                gameMode={gameState.gameMode}
                gamePhase={gameState.gamePhase}
                isExploring={gameState.isExploring}
                onUnitClick={handleUnitClick}
                onHexClick={handleHexClick}
                onHover={handleHover}
                onClearHover={clearHover}
            />
        </div>

        <div className="z-20 mt-auto">
          <ActionPanel 
              currentPlayer={gameState.players[gameState.currentPlayerIndex]} 
              board={gameState.board}
              units={gameState.units}
              buildings={gameState.buildings}
              onAction={performAction}
              onEndTurn={endTurn}
              pendingMoves={gameState.pendingMoves}
              onFinishMoves={handleFinishMoves}
              isBuildingCastle={gameState.isBuildingCastle}
              onCancelAction={handleCancelAction}
              isRecruiting={gameState.isRecruiting}
              recruitingUnitType={gameState.recruitingUnitType}
              onSelectRecruitUnit={handleSelectRecruitUnit}
              isSelectingCombatHex={gameState.isSelectingCombatHex}
              isSelectingAdventureHex={gameState.isSelectingAdventureHex}
              isExploring={gameState.isExploring}
              explorationCount={gameState.explorationCount}
              isBuyingSkill={gameState.isBuyingSkill}
              selectedSkill={gameState.selectedSkill}
              gamePhase={gameState.gamePhase}
              freeProductionActions={gameState.freeProductionActions}
              isSelectingFreeRecruitHex={gameState.isSelectingFreeRecruitHex}
              freeRecruitType={gameState.freeRecruitType}
              freeRecruitCount={gameState.freeRecruitCount}
              activeYearlyEffects={gameState.activeYearlyEffects}
              onHover={handleHover}
              onClearHover={clearHover}
          />
        </div>

        <SeasonsTracker 
          currentSeason={gameState.currentSeason}
          currentYear={gameState.currentYear}
        />
      </main>

      {gameState.gamePhase === 'EVENT' && gameState.currentEvent && !gameState.isSelectingEventHex && !gameState.isSelectingFreeRecruitHex && (
        <EventModal
          event={YEAR_EVENTS.find(e => e.id === gameState.currentEvent)!}
          player={gameState.players[gameState.currentPlayerIndex]}
          pendingChoice={gameState.pendingEventChoices[gameState.players[gameState.currentPlayerIndex].id]}
          onChoice={handleEventChoice}
          availableSkills={{
            level2: gameState.availableLevel2Skills,
            level3: gameState.availableLevel3Skills
          }}
          hasValidTargets={
            gameState.pendingEventChoices[gameState.players[gameState.currentPlayerIndex].id]?.type === 'DUNGEON_ATTACK' 
              ? gameState.board.some(tile => {
                  const neighbors = getNeighbors(tile.q, tile.r);
                  const isAdjacentToDungeon = neighbors.some(n => 
                    gameState.board.find(t => t.q === n.q && t.r === n.r && t.hasDungeonEntrance)
                  );
                  const hasUnits = gameState.units.some(u => u.playerId === gameState.players[gameState.currentPlayerIndex].id && u.q === tile.q && u.r === tile.r);
                  return isAdjacentToDungeon && hasUnits;
                })
              : true
          }
        />
      )}

      {gameState.currentAdventure && (
        <AdventureModal 
          adventure={gameState.currentAdventure}
          onSelectOption={handleAdventureChoice}
          onHover={handleHover}
          onClearHover={clearHover}
        />
      )}

      {gameState.gamePhase === 'SKILL_DRAFT' && (
        <SkillDraftModal
          pool={gameState.skillDraftPool}
          playerName={gameState.players[gameState.currentPlayerIndex].name}
          onComplete={handleSkillDraftComplete}
          onHover={handleHover}
          onClearHover={clearHover}
        />
      )}

      {gameState.isSelectingInitialQuest && (
        <QuestSelectionModal 
          playerName={gameState.players[gameState.currentPlayerIndex].name}
          choices={gameState.initialQuestChoices[gameState.currentPlayerIndex]}
          onSelect={handleSelectInitialQuest}
          title="Choose Your Secret Quest"
          onHover={handleHover}
          onClearHover={clearHover}
        />
      )}

      {gameState.isSelectingAdvancedQuest && (
        <QuestSelectionModal 
          playerName={gameState.players[gameState.currentPlayerIndex].name}
          choices={gameState.advancedQuestChoices[gameState.players[gameState.currentPlayerIndex].id]}
          onSelect={handleSelectAdvancedQuest}
          title="Choose Your Advanced Secret Quest"
          onHover={handleHover}
          onClearHover={clearHover}
        />
      )}

      {gameState.isLevelingUp && (
        <LevelUpModal
          player={gameState.players[gameState.currentPlayerIndex]}
          isLowStart={gameState.isLowStart}
          onLevelUp={handleLevelUp}
          onActivateFactionSkill={handleActivateFactionSkill}
          onCancel={handleCancelLevelUp}
          onHover={handleHover}
          onClearHover={clearHover}
        />
      )}

      {gameState.isCompletingQuest && (
        <QuestMarket 
          player={gameState.players[gameState.currentPlayerIndex]}
          publicQuests={gameState.publicQuests}
          onComplete={handleCompleteQuest}
          onCancel={() => setGameState(prev => ({ ...prev, isCompletingQuest: false }))}
          checkFulfillment={checkQuestFulfillment}
          board={gameState.board}
          units={gameState.units}
          buildings={gameState.buildings}
          onHover={handleHover}
          onClearHover={clearHover}
        />
      )}

      {gameState.gamePhase === 'YEAR_END_QUESTS' && (
        <QuestMarket 
          player={gameState.players[gameState.currentPlayerIndex]}
          publicQuests={gameState.publicQuests}
          onComplete={handleCompleteQuest}
          onCancel={handleYearEndQuestSkip}
          checkFulfillment={checkQuestFulfillment}
          board={gameState.board}
          units={gameState.units}
          buildings={gameState.buildings}
          isYearEndPhase={true}
          onHover={handleHover}
          onClearHover={clearHover}
        />
      )}

      {showQuests && !gameState.isCompletingQuest && (
        <QuestMarket 
          player={gameState.players[gameState.currentPlayerIndex]}
          publicQuests={gameState.publicQuests}
          onComplete={() => {}} // Disabled in view mode
          onCancel={() => setShowQuests(false)}
          checkFulfillment={() => false} // Disabled in view mode
          board={gameState.board}
          units={gameState.units}
          buildings={gameState.buildings}
          isViewOnly={true}
          onHover={handleHover}
          onClearHover={clearHover}
        />
      )}

      {gameState.isBuyingSkill && !gameState.selectedSkill && (
        <div className="fixed inset-x-0 bottom-0 z-40">
          <SkillMarket 
            onSelectSkill={handleSelectSkill} 
            onCancel={handleCancelSkillBuy}
            playerGold={gameState.players[gameState.currentPlayerIndex].gold}
            playerXP={gameState.players[gameState.currentPlayerIndex].xp}
            playerFaction={gameState.players[gameState.currentPlayerIndex].faction}
            hasLevel2Unit={Object.values(gameState.players[gameState.currentPlayerIndex].unitLevels).some(level => (level as number) >= 2)}
            hasLevel3Unit={Object.values(gameState.players[gameState.currentPlayerIndex].unitLevels).some(level => (level as number) >= 3)}
            availableLevel2Skills={gameState.availableLevel2Skills}
            availableLevel3Skills={gameState.availableLevel3Skills}
            isFreeSkill={gameState.isFreeSkill}
            freeSkillLevel={gameState.freeSkillLevel}
            onHover={handleHover}
            onClearHover={clearHover}
          />
        </div>
      )}

      {showSkills && !gameState.isBuyingSkill && (
        <div className="fixed inset-x-0 bottom-0 z-40">
          <SkillMarket 
            onSelectSkill={() => {}} // Disabled in view mode
            onCancel={() => setShowSkills(false)}
            playerGold={0} // Doesn't matter in view mode
            playerXP={0}
            playerFaction={gameState.players[gameState.currentPlayerIndex].faction}
            hasLevel2Unit={Object.values(gameState.players[gameState.currentPlayerIndex].unitLevels).some(level => (level as number) >= 2)}
            hasLevel3Unit={Object.values(gameState.players[gameState.currentPlayerIndex].unitLevels).some(level => (level as number) >= 3)}
            availableLevel2Skills={gameState.availableLevel2Skills}
            availableLevel3Skills={gameState.availableLevel3Skills}
            isViewOnly={true}
            onHover={handleHover}
            onClearHover={clearHover}
          />
        </div>
      )}

      {showRules && (
        <RuleBookModal onClose={() => setShowRules(false)} />
      )}

      {gameState.isSelectingUnitTypeForSkill && gameState.selectedSkill && gameState.players[gameState.currentPlayerIndex] && (
        <UnitTypeSelector
          player={gameState.players[gameState.currentPlayerIndex]}
          skillLevel={gameState.selectedSkill.level}
          onSelect={handleSelectUnitTypeForSkill}
          onCancel={() => handleCancelAction()}
          onHover={handleHover}
          onClearHover={clearHover}
        />
      )}

      {gameState.isSelectingSkillSlot && gameState.targetUnitType && gameState.selectedSkill && (
        <SkillSlotSelector 
          unitType={gameState.targetUnitType}
          skills={gameState.players[gameState.currentPlayerIndex]?.unitTypeSkills[gameState.targetUnitType] || []}
          selectedSkill={gameState.selectedSkill}
          onSelectSlot={(index) => gameState.targetUnitType && handleApplySkill(gameState.targetUnitType, index)}
          onCancel={() => setGameState(prev => ({ ...prev, isSelectingSkillSlot: false, targetUnitType: null }))}
          onHover={handleHover}
          onClearHover={clearHover}
        />
      )}

      {gameState.isSelectingMonsterLevel && gameState.pendingCombatHex && (
        <MonsterLevelSelector
          canFightLevel2={gameState.players[gameState.currentPlayerIndex]?.questProgress.monstersDefeated > 0}
          canFightLevel3={gameState.players[gameState.currentPlayerIndex]?.questProgress.level2MonstersDefeated > 0}
          onSelect={(level) => {
            const defenderId = level === 1 ? 'monster' : level === 2 ? 'monster2' : 'monster3';
            setGameState(prev => ({ ...prev, isSelectingMonsterLevel: false }));
            if (gameState.pendingCombatHex && gameState.players[gameState.currentPlayerIndex]) {
              startCombat(gameState.players[gameState.currentPlayerIndex].id, defenderId, gameState.pendingCombatHex.q, gameState.pendingCombatHex.r);
            }
          }}
          onCancel={() => {
            setGameState(prev => ({ ...prev, isSelectingMonsterLevel: false, pendingCombatHex: null }));
          }}
          onHover={handleHover}
          onClearHover={clearHover}
        />
      )}

      {gameState.combatState && (
        <CombatModal 
          combatState={gameState.combatState}
          players={gameState.players}
          onApplyDamage={handleApplyCombatDamage}
          onRerollDice={handleRerollDice}
          onResolveExplosion={handleResolveExplosion}
          onResolve={resolveCombat}
          onNextRound={handleNextRound}
          onFinishReroll={handleFinishReroll}
          onClose={handleCloseCombat}
          onToggleChannel={handleToggleChannel}
          onHover={handleHover}
          onClearHover={clearHover}
        />
      )}

      {/* Logs and Feed - Hidden on mobile unless tab active */}
      {gameState.isChroniclesVisible && (
        <div className={`${activeTab === 'LOGS' ? 'flex' : 'hidden'} md:flex w-full md:w-72 border-l border-white/10 flex-col p-4 bg-slate-900/50 h-full z-30 fixed md:relative inset-0 md:inset-auto`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="fantasy-font text-xl text-slate-400">Chronicles</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const blob = new Blob([gameState.logs.join('\n')], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `alderys-chronicles-${new Date().toISOString().slice(0, 10)}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="p-2 bg-slate-800 rounded-full border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Export Chronicles"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              </button>
              <button onClick={() => setActiveTab('GAME')} className="md:hidden p-2 bg-slate-800 rounded-full border border-white/10 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {gameState.logs.slice().reverse().map((log, i) => (
              <div key={i} className={`text-xs p-2 rounded ${log.startsWith('AI Master') ? 'bg-purple-900/30 text-purple-200 border border-purple-500/20' : 'bg-white/5 border border-white/5'}`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Back to Game Button */}
      {(activeTab === 'STATS' || activeTab === 'LOGS') && (
        <button 
          onClick={() => setActiveTab('GAME')}
          className="fixed bottom-6 right-6 md:hidden z-50 bg-yellow-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
      )}

      {gameState.isGameOver && gameState.isGameOverDismissed && (
        <button 
          onClick={() => setGameState(prev => ({ ...prev, isGameOverDismissed: false }))}
          className="fixed bottom-6 left-6 z-40 bg-yellow-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 font-bold animate-bounce"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
          Victory Screen
        </button>
      )}

      {gameState.isGameOver && !gameState.isGameOverDismissed && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 p-6 md:p-8 border border-yellow-500 rounded-2xl text-center max-w-4xl w-full flex flex-col md:flex-row gap-8 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
            <div className="flex-1">
              <h2 className="text-4xl fantasy-font text-yellow-500 mb-4">Ascension!</h2>
              <p className="mb-6 text-slate-200">{gameState.players[gameState.currentPlayerIndex].name} has mastered the realm of Alderys.</p>
              
              <div className="flex flex-col gap-3 mb-6">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  Start New Quest
                </button>
                
                <button 
                  onClick={() => {
                    const blob = new Blob([gameState.logs.join('\n')], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `alderys-chronicles-${new Date().toISOString().slice(0, 10)}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Download Chronicles
                </button>

                <button 
                  onClick={() => setGameState(prev => ({ ...prev, isGameOverDismissed: true }))}
                  className="w-full px-6 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Continue Viewing Board
                </button>
              </div>
            </div>
            <div className="w-full md:w-80">
              <Leaderboard />
            </div>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowLeaderboard(false)}>
          <div className="max-w-md w-full" onClick={e => e.stopPropagation()}>
            <Leaderboard />
            <button 
              onClick={() => setShowLeaderboard(false)}
              className="mt-4 w-full py-2 bg-slate-800 text-slate-300 rounded-lg border border-white/10 hover:bg-slate-700 transition-all font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showAssets && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowAssets(false)}>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <AssetManager />
            <button 
              onClick={() => setShowAssets(false)}
              className="mt-4 w-full py-2 bg-slate-800 text-slate-300 rounded-lg border border-white/10 hover:bg-slate-700 transition-all font-bold"
            >
              Close Asset Manager
            </button>
          </div>
        </div>
      )}

      {gameState.gamePhase === 'EVENT' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40 backdrop-blur-sm">
           <div className="bg-purple-900/90 p-8 border border-purple-400 rounded-lg text-center max-w-lg animate-pulse">
                <h3 className="text-2xl fantasy-font text-purple-200 mb-4">Spirit Awakening</h3>
                <p className="text-white italic">"{gameState.currentEvent}"</p>
           </div>
        </div>
      )}

      {hoverData && (
        <Magnifier 
          hoverData={hoverData}
          isVisible={true}
        />
      )}
    </div>
  );
};

export default App;
