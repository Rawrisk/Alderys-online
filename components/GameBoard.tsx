
import React, { useState, useEffect, useRef } from 'react';
import { TileType, Player, HexTile, Unit, Building } from '../types';
import { TILE_COLORS, TILE_IMAGES, FACTION_CAPITAL_IMAGES, FACTION_UNIT_IMAGES, FACTION_UNIT_MODELS, MONSTER_ICONS, MONSTER_STATS, MONSTER_LEVEL_2_STATS, MONSTER_LEVEL_3_STATS } from '../constants';
import Unit3DModel from './Unit3DModel';

interface GameBoardProps {
  board: HexTile[];
  players: Player[];
  currentPlayerIndex: number;
  units: Unit[];
  buildings: Building[];
  selectedUnitId: string | null;
  gameMode?: string;
  gamePhase?: string;
  isExploring?: boolean;
  onUnitClick: (unitId: string) => void;
  onHexClick: (q: number, r: number) => void;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, players, currentPlayerIndex, units, buildings, selectedUnitId, gameMode, gamePhase, isExploring, onUnitClick, onHexClick, onHover, onClearHover }) => {
  const [hexSize, setHexSize] = useState(window.innerWidth < 768 ? 32 : 48);
  const [zoom, setZoom] = useState(1);
  const [showStatsForHex, setShowStatsForHex] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setHexSize(window.innerWidth < 768 ? 32 : 48);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hexWidth = hexSize * Math.sqrt(3);
  const hexHeight = hexSize * 2;
  const yOffset = hexHeight * 0.75;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setStartY(e.pageY - containerRef.current.offsetTop);
    setScrollLeft(containerRef.current.scrollLeft);
    setScrollTop(containerRef.current.scrollTop);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walkX;
    containerRef.current.scrollTop = scrollTop - walkY;
  };

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 2));
  };

  const resetView = () => {
    setZoom(1);
    if (containerRef.current) {
      const { scrollWidth, scrollHeight, clientWidth, clientHeight } = containerRef.current;
      containerRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
      containerRef.current.scrollTop = (scrollHeight - clientHeight) / 2;
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        <button 
          onClick={() => adjustZoom(0.1)}
          className="w-10 h-10 bg-slate-800/80 backdrop-blur border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-colors shadow-lg"
          title="Zoom In"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button 
          onClick={() => adjustZoom(-0.1)}
          className="w-10 h-10 bg-slate-800/80 backdrop-blur border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-colors shadow-lg"
          title="Zoom Out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button 
          onClick={resetView}
          className="w-10 h-10 bg-slate-800/80 backdrop-blur border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-colors shadow-lg"
          title="Reset View"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
      </div>

      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`relative p-4 md:p-8 bg-slate-950/40 rounded-3xl shadow-2xl border border-white/5 overflow-auto custom-scrollbar h-full w-full flex ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div 
          className="relative transition-transform duration-200 ease-out origin-center flex items-center justify-center m-auto" 
          style={{ 
            minWidth: hexWidth * 9.5 * zoom, 
            minHeight: hexHeight * 9.5 * zoom,
          }}
        >
          <div 
            className="relative transition-transform duration-200 ease-out origin-center"
            style={{ 
              width: hexWidth * 9.5, 
              height: hexHeight * 9.5,
              transform: `scale(${zoom})`,
            }}
          >
          {board.map((tile, i) => {
            // Calculate pixel coordinates
            const x = hexWidth * (tile.q + tile.r / 2) + (hexWidth * 4.75); // Center offset
            const y = yOffset * tile.r + (hexHeight * 4.75); // Center offset

            const tileUnits = units.filter(u => u.q === tile.q && u.r === tile.r);
            const tileBuildings = buildings.filter(b => b.q === tile.q && b.r === tile.r);
            
            // Determine background image (prioritize faction capital if it's a capital tile)
            let backgroundImage = 'none';
            if (tile.isRevealed) {
              const capital = tileBuildings.find(b => b.type === 'capital');
              if (capital) {
                const owner = players.find(p => p.id === capital.playerId);
                if (owner?.faction && FACTION_CAPITAL_IMAGES[owner.faction]) {
                  backgroundImage = `url(${FACTION_CAPITAL_IMAGES[owner.faction]})`;
                }
              }
              
              if (backgroundImage === 'none' && TILE_IMAGES[tile.type]) {
                backgroundImage = `url(${TILE_IMAGES[tile.type]})`;
              }
            }

            // Determine if tile is explorable
            let isExplorable = false;
            if (isExploring && !tile.isRevealed) {
              const currentPlayerId = players[currentPlayerIndex]?.id;
              const myUnits = units.filter(u => u.playerId === currentPlayerId);
              const myCastles = buildings.filter(b => b.playerId === currentPlayerId && (b.type === 'castle' || b.type === 'capital'));
              isExplorable = [...myUnits, ...myCastles].some(obj => {
                const distance = (Math.abs(tile.q - obj.q) + Math.abs(tile.q + tile.r - obj.q - obj.r) + Math.abs(tile.r - obj.r)) / 2;
                return distance === 1;
              });
            }

            return (
              <div 
                key={i}
                onClick={() => {
                  // Allow clicking on unrevealed tiles during SETUP_CAPITAL phase,
                  // when exploring, or if it's a PREVIEW tile (which should be revealed anyway)
                  if (!tile.isRevealed && tile.type !== TileType.PREVIEW && gamePhase !== 'SETUP_CAPITAL' && !isExploring) return;
                  onHexClick(tile.q, tile.r);
                  if (tile.monsterLevel) {
                    setShowStatsForHex(showStatsForHex === `${tile.q},${tile.r}` ? null : `${tile.q},${tile.r}`);
                  } else {
                    setShowStatsForHex(null);
                  }
                }}
                onMouseEnter={(e) => (tile.isRevealed || isExplorable) && onHover('TILE', tile, e.clientX, e.clientY)}
                onMouseLeave={onClearHover}
                className={`absolute transition-all duration-300 group flex items-center justify-center ${tile.isRevealed || isExplorable || tile.type === TileType.PREVIEW || gamePhase === 'SETUP_CAPITAL' ? 'cursor-pointer hover:z-10' : ''}`}
                style={{ 
                  left: x - hexWidth/2, 
                  top: y - hexHeight/2,
                  width: hexWidth,
                  height: hexHeight,
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' 
                }}
              >
                <div className={`absolute inset-[1px] ${tile.isRevealed && tile.type ? TILE_COLORS[tile.type] : 'bg-slate-900 border-slate-800'} flex flex-col items-center justify-center transition-colors ${tile.isRevealed ? 'hover:brightness-125' : ''} ${isExplorable ? 'border-2 border-yellow-400/50 hover:bg-slate-800 animate-pulse' : ''}`}
                     style={{ 
                       clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                       backgroundImage: tile.isRevealed ? backgroundImage : 'none',
                       backgroundSize: 'cover',
                       backgroundPosition: 'center'
                     }}>
                  
                  {tile.isRevealed ? (
                    <>
                      {/* Tile Label */}
                      <span className="absolute bottom-1 text-[5px] md:text-[6px] opacity-0 group-hover:opacity-40 uppercase text-white transition-opacity font-bold pointer-events-none">
                        {tile.type ? tile.type.replace('_', ' ') : ''}
                      </span>

                      {/* Red Lines */}
                      {tile.redLines && tile.redLines.length > 0 && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${hexWidth} ${hexHeight}`}>
                          {tile.redLines.includes(0) && <line x1={hexWidth/2} y1={0} x2={hexWidth} y2={hexHeight/4} stroke="#ef4444" strokeWidth="6" />}
                          {tile.redLines.includes(1) && <line x1={hexWidth} y1={hexHeight/4} x2={hexWidth} y2={hexHeight*3/4} stroke="#ef4444" strokeWidth="6" />}
                          {tile.redLines.includes(2) && <line x1={hexWidth} y1={hexHeight*3/4} x2={hexWidth/2} y2={hexHeight} stroke="#ef4444" strokeWidth="6" />}
                          {tile.redLines.includes(3) && <line x1={hexWidth/2} y1={hexHeight} x2={0} y2={hexHeight*3/4} stroke="#ef4444" strokeWidth="6" />}
                          {tile.redLines.includes(4) && <line x1={0} y1={hexHeight*3/4} x2={0} y2={hexHeight/4} stroke="#ef4444" strokeWidth="6" />}
                          {tile.redLines.includes(5) && <line x1={0} y1={hexHeight/4} x2={hexWidth/2} y2={0} stroke="#ef4444" strokeWidth="6" />}
                        </svg>
                      )}

                      {/* Production & VP */}
                      <div className="absolute top-2 flex gap-1 text-[7px] md:text-[10px] font-bold pointer-events-none">
                        {tile.productionGold > 0 && <span className="text-yellow-400 drop-shadow-md bg-black/40 backdrop-blur-sm px-1 rounded-sm">{tile.productionGold}g</span>}
                        {tile.productionXP > 0 && <span className="text-blue-400 drop-shadow-md bg-black/40 backdrop-blur-sm px-1 rounded-sm">{tile.productionXP}xp</span>}
                        {tile.type === TileType.ANCIENT_CITY && <span className="text-purple-300 drop-shadow-md bg-black/40 backdrop-blur-sm px-1 rounded-sm">1 VP</span>}
                        {tile.type === TileType.BOSS && <span className="text-red-300 drop-shadow-md bg-black/40 backdrop-blur-sm px-1 rounded-sm">3 VP</span>}
                      </div>

                      {/* Unit Limit Indicator */}
                      {tile.type !== TileType.INITIAL && units.filter(u => u.q === tile.q && u.r === tile.r && u.playerId === players[currentPlayerIndex]?.id).length >= 3 && (
                        <div className="absolute top-6 px-1 bg-red-600/80 text-white text-[6px] md:text-[8px] font-bold rounded-full animate-pulse pointer-events-none">
                          FULL
                        </div>
                      )}

                      {/* Adventure Markers */}
                      {tile.hasAdventureMarker && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] md:text-xs font-bold drop-shadow-md pointer-events-none bg-black/50 rounded-full w-4 h-4 md:w-6 md:h-6 flex items-center justify-center border border-white/10">
                          ?
                        </div>
                      )}
                      {tile.hasAdvancedAdventureMarker && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-red-500 text-[10px] md:text-xs font-bold drop-shadow-md pointer-events-none bg-black/50 rounded-full w-4 h-4 md:w-6 md:h-6 flex items-center justify-center border border-white/10">
                          !?
                        </div>
                      )}
                      {(tile.hasDungeonEntrance || tile.type === TileType.DUNGEON_ENTRANCE) && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md pointer-events-none w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
                          <img 
                            src="https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/hexes/monster%20entrance%20token.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJoZXhlcy9tb25zdGVyIGVudHJhbmNlIHRva2VuLnBuZyIsImlhdCI6MTc3NDQxMDM5NCwiZXhwIjoxODA1OTQ2Mzk0fQ.oerT5zGvXDu7UjeiLRuXII-_dUYbzrSgBl9ckGWlHZc" 
                            alt="Dungeon Entrance" 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      {tile.monsterLevel && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md pointer-events-none w-[21px] h-[21px] md:w-[26px] md:h-[26px] flex items-center justify-center z-20">
                          <img 
                            src={MONSTER_ICONS[tile.monsterLevel]} 
                            alt={`Level ${tile.monsterLevel} Monster`} 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                          {gameMode === 'MONSTERS_OUT' && (
                            <div className={`absolute inset-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100 ${showStatsForHex === `${tile.q},${tile.r}` ? 'opacity-100' : ''}`}>
                              {/* HP Indicator - Top Left */}
                              <div className="absolute -top-2 -left-2 bg-red-600 text-white text-[7px] md:text-[9px] font-bold rounded-full w-3.5 h-3.5 md:w-4.5 md:h-4.5 flex items-center justify-center border border-white/50 z-30 shadow-sm" title="Monster HP">
                                {tile.monsterLevel === 1 ? MONSTER_STATS[0].hp : 
                                 tile.monsterLevel === 2 ? MONSTER_LEVEL_2_STATS[0].hp : 
                                 MONSTER_LEVEL_3_STATS[0].hp}
                              </div>
                              
                              {/* Melee Dice - Top Right (Red) */}
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[7px] md:text-[9px] font-bold rounded-full w-3.5 h-3.5 md:w-4.5 md:h-4.5 flex items-center justify-center border border-white/50 z-30 shadow-sm" title="Melee Dice">
                                {tile.monsterLevel === 1 ? MONSTER_STATS[0].dice.filter((d: string) => d === 'MELEE').length : 
                                 tile.monsterLevel === 2 ? (() => {
                                   const counts = MONSTER_LEVEL_2_STATS[0].attackOptions.map((opt: any) => opt.MELEE);
                                   const min = Math.min(...counts);
                                   const max = Math.max(...counts);
                                   return min === max ? `${min}` : `${min}-${max}`;
                                 })() : 
                                 (() => {
                                   const counts = MONSTER_LEVEL_3_STATS[0].attackOptions.map((opt: any) => opt.MELEE);
                                   const min = Math.min(...counts);
                                   const max = Math.max(...counts);
                                   return min === max ? `${min}` : `${min}-${max}`;
                                 })()}
                              </div>

                              {/* Mana Dice - Bottom Left (Blue) */}
                              <div className="absolute -bottom-2 -left-2 bg-blue-600 text-white text-[7px] md:text-[9px] font-bold rounded-full w-3.5 h-3.5 md:w-4.5 md:h-4.5 flex items-center justify-center border border-white/50 z-30 shadow-sm" title="Mana Dice">
                                {tile.monsterLevel === 1 ? MONSTER_STATS[0].dice.filter((d: string) => d === 'MANA').length : 
                                 tile.monsterLevel === 2 ? (() => {
                                   const counts = MONSTER_LEVEL_2_STATS[0].attackOptions.map((opt: any) => opt.MANA + opt.RANGED_MANA);
                                   const min = Math.min(...counts);
                                   const max = Math.max(...counts);
                                   return min === max ? `${min}` : `${min}-${max}`;
                                 })() : 
                                 (() => {
                                   const stats = MONSTER_LEVEL_3_STATS[0];
                                   const counts = stats.attackOptions.map((opt: any) => opt.MANA + opt.RANGED_MANA + stats.manaDefenseDice);
                                   const min = Math.min(...counts);
                                   const max = Math.max(...counts);
                                   return min === max ? `${min}` : `${min}-${max}`;
                                 })()}
                              </div>

                              {/* Defense Dice - Bottom Right (Gray) */}
                              <div className="absolute -bottom-2 -right-2 bg-gray-600 text-white text-[7px] md:text-[9px] font-bold rounded-full w-3.5 h-3.5 md:w-4.5 md:h-4.5 flex items-center justify-center border border-white/50 z-30 shadow-sm" title="Defense Dice">
                                {tile.monsterLevel === 1 ? MONSTER_STATS[0].dice.filter((d: string) => d === 'DEFENSE').length : 
                                 tile.monsterLevel === 2 ? MONSTER_LEVEL_2_STATS[0].defenseDice : 
                                 MONSTER_LEVEL_3_STATS[0].defenseDice}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {tile.type === TileType.DUNGEON_ENTRANCE && tile.dungeonEntranceFaces && tile.dungeonEntranceFaces.map(face => {
                        const positions = [
                          { left: '70%', top: '80%', rotate: 120 },  // 0: Bottom Right
                          { left: '30%', top: '80%', rotate: 240 },  // 1: Bottom Left
                          { left: '10%', top: '50%', rotate: 270 },  // 2: Left
                          { left: '30%', top: '20%', rotate: 300 },  // 3: Top Left
                          { left: '70%', top: '20%', rotate: 60 },   // 4: Top Right
                          { left: '90%', top: '50%', rotate: 90 },   // 5: Right
                        ];
                        const pos = positions[face];
                        return (
                          <div key={face} className="absolute text-stone-300 opacity-80 pointer-events-none" style={{
                            left: pos.left,
                            top: pos.top,
                            transform: `translate(-50%, -50%) rotate(${pos.rotate}deg)`
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 19V5"/>
                              <path d="M5 12l7-7 7 7"/>
                            </svg>
                          </div>
                        );
                      })}

                      {/* Castle Slots */}
                      {tile.castleSlots > 0 && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 pointer-events-none">
                          {Array.from({ length: tile.castleSlots }).map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 md:w-2 md:h-2 border border-white/30 bg-black/20 rounded-[1px]"></div>
                          ))}
                        </div>
                      )}

                      {/* Buildings */}
                      {tileBuildings.length > 0 && (
                        <div className="flex gap-1 mb-1 z-10">
                          {tileBuildings.map(b => {
                            const owner = players.find(p => p.id === b.playerId);
                            return (
                              <div 
                                key={b.id}
                                onMouseEnter={(e) => onHover('BUILDING', b, e.clientX, e.clientY)}
                                onMouseLeave={onClearHover}
                                className={`w-4 h-4 md:w-6 md:h-6 rounded-sm border-2 border-white flex items-center justify-center text-[7px] md:text-[10px] font-bold text-white shadow-lg`}
                                style={{ backgroundColor: owner?.color }}
                                title={`${owner?.name}'s ${b.type}`}
                              >
                                  {b.type === 'capital' ? 'C' : 'K'}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Units */}
                      <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2 max-w-[90%] z-10">
                        {tileUnits.map(u => {
                          const owner = players.find(p => p.id === u.playerId);
                          const isSelected = selectedUnitId === u.id;
                          const unitImage = owner?.faction ? FACTION_UNIT_IMAGES[owner.faction]?.[u.type] : null;
                          const unitModelValue = owner?.faction ? FACTION_UNIT_MODELS[owner.faction]?.[u.type] : null;
                          const unitModel = typeof unitModelValue === 'string' && unitModelValue.trim() !== '' ? unitModelValue : null;
                          
                          return (
                            <div 
                              key={u.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onUnitClick(u.id);
                              }}
                              onMouseEnter={(e) => onHover('UNIT', u, e.clientX, e.clientY)}
                              onMouseLeave={onClearHover}
                              className={`group/unit relative flex flex-col items-center transition-all
                                ${isSelected ? 'scale-125 z-20' : 'hover:scale-110'}
                              `}
                            >
                              {/* Unit Icon */}
                              <div 
                                className={`w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[6px] md:text-[9px] font-bold text-white shadow-lg cursor-pointer transition-all overflow-hidden
                                  ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400' : unitModel ? '' : 'border-white'}
                                  ${u.isExhausted ? 'grayscale brightness-50' : ''}
                                `}
                                style={{ backgroundColor: unitModel ? 'transparent' : owner?.color }}
                                title={`${owner?.name}'s ${u.type}`}
                              >
                                {unitModel ? (
                                  <Unit3DModel 
                                    modelUrl={unitModel} 
                                    color={owner?.color || '#ffffff'} 
                                    size={window.innerWidth < 768 ? 24 : 32} 
                                  />
                                ) : unitImage ? (
                                  <img 
                                    src={unitImage} 
                                    alt={u.type} 
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  u.type[0].toUpperCase()
                                )}
                              </div>

                              {/* Exhaustion Marker */}
                              {u.isExhausted && (
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3.5 md:h-3.5 bg-slate-800 border border-white/20 rounded-full flex items-center justify-center z-30 shadow-lg">
                                  <span className="text-[5px] md:text-[7px] text-yellow-500 font-bold leading-none">Z</span>
                                </div>
                              )}

                              {/* Skills Display (Small squared cards) */}
                              <div className="flex gap-0.5 mt-0.5">
                                {(owner?.unitTypeSkills[u.type] || []).map((skill, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-[1px] border-[0.5px] flex items-center justify-center
                                      ${skill ? 'bg-slate-700 border-white/40' : 'bg-black/40 border-white/10'}
                                    `}
                                    title={skill?.effect || 'Empty Slot'}
                                  >
                                    {skill && (
                                      <div className={`w-full h-full rounded-[0.5px] ${
                                        skill.type === 'MAGIC' ? 'bg-purple-500' :
                                        skill.type === 'SWORD' ? 'bg-red-500' :
                                        skill.type === 'LUCKY' ? 'bg-yellow-500' :
                                        'bg-blue-500'
                                      }`} />
                                    )}
                                  </div>
                                ))}
                              </div>
                              
                              {/* Tooltip for skills */}
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-[6px] md:text-[8px] whitespace-nowrap opacity-0 group-hover/unit:opacity-100 pointer-events-none transition-opacity z-30 shadow-xl">
                                <span className="font-bold capitalize">{u.type}</span>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                  {(owner?.unitTypeSkills[u.type] || []).map((s, i) => (
                                    <span key={i} className={s ? 'text-yellow-500' : 'text-slate-600'}>
                                      {s ? s.effect : 'Empty'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700 opacity-50">
                        <path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M2 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="M12 20v2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M20 12h2"/><path d="m17.66 17.66 1.41 1.41"/><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;


