
import { TileType } from './types';

export const ASSETS = {
  HEXES: {
    [TileType.INITIAL]: 'https://picsum.photos/seed/castle-gate/256/256',
    [TileType.PLAINS]: 'https://picsum.photos/seed/grass-field/256/256',
    [TileType.MOUNTAIN]: 'https://picsum.photos/seed/snowy-mountain/256/256',
    [TileType.LAKE]: 'https://picsum.photos/seed/blue-lake/256/256',
    [TileType.ANCIENT_CITY]: 'https://picsum.photos/seed/ancient-ruins/256/256',
    [TileType.DUNGEON_ENTRANCE]: 'https://picsum.photos/seed/dark-cave/256/256',
    [TileType.BOSS]: 'https://picsum.photos/seed/dragon-lair/256/256',
    [TileType.PREVIEW]: 'https://picsum.photos/seed/magic-portal/256/256',
  },
  FACTIONS: {
    human: 'https://picsum.photos/seed/knight-armor/256/256',
    elf: 'https://picsum.photos/seed/forest-elf/256/256',
    orc: 'https://picsum.photos/seed/orc-warrior/256/256',
    dwarf: 'https://picsum.photos/seed/dwarf-hammer/256/256',
    ooze: 'https://picsum.photos/seed/green-slime/256/256',
    flying: 'https://picsum.photos/seed/winged-creature/256/256',
  },
  UNITS: {
    warrior: 'https://picsum.photos/seed/sword-shield/128/128',
    mage: 'https://picsum.photos/seed/wizard-staff/128/128',
    knight: 'https://picsum.photos/seed/mounted-knight/128/128',
  },
  BUILDINGS: {
    capital: 'https://picsum.photos/seed/royal-palace/128/128',
    castle: 'https://picsum.photos/seed/stone-fortress/128/128',
  },
  MONSTERS: {
    monster: 'https://picsum.photos/seed/goblin/128/128',
    monster2: 'https://picsum.photos/seed/troll/128/128',
    monster3: 'https://picsum.photos/seed/beholder/128/128',
    boss: 'https://picsum.photos/seed/red-dragon/256/256',
  }
};
