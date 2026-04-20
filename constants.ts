
import { TileType, Skill } from './types';

const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(`Error loading ${key} from storage`, e);
  }
  return defaultValue;
};

export const MAX_UNITS = {
  warriors: 4,
  mages: 3,
  knights: 2,
  castles: 8
};

export const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export const FACTIONS = [
  { id: 'human', name: 'Human', description: 'Standard balanced faction.' },
  { id: 'elf', name: 'Elf', description: 'Masters of magic and precision.' },
  { id: 'orc', name: 'Orc', description: 'Brutal strength and shared battle-cries.' },
  { id: 'dwarf', name: 'Dwarf', description: 'Sturdy mountain dwellers with powerful channeling.' },
  { id: 'ooze', name: 'Ooze', description: 'Adaptive slime with unique growth mechanics. Passive: Pay +1 XP per level when buying skills.' },
  { id: 'flying', name: 'Flying Folks', description: 'Agile aerialists who turn melee into ranged strikes.' }
];

export const FACTION_THEMES: Record<string, { color: string, glow: string, bg: string, border: string, text: string }> = {
  human: { 
    color: '#3b82f6', 
    glow: '0 0 15px rgba(59, 130, 246, 0.5)', 
    bg: 'bg-blue-900/40', 
    border: 'border-blue-500/40',
    text: 'text-blue-400'
  },
  elf: { 
    color: '#22c55e', 
    glow: '0 0 15px rgba(34, 197, 94, 0.5)', 
    bg: 'bg-emerald-900/40', 
    border: 'border-emerald-500/40',
    text: 'text-emerald-400'
  },
  orc: { 
    color: '#ef4444', 
    glow: '0 0 15px rgba(239, 68, 68, 0.5)', 
    bg: 'bg-red-900/40', 
    border: 'border-red-500/40',
    text: 'text-red-400'
  },
  dwarf: { 
    color: '#eab308', 
    glow: '0 0 15px rgba(234, 179, 8, 0.5)', 
    bg: 'bg-yellow-900/40', 
    border: 'border-yellow-500/40',
    text: 'text-yellow-400'
  },
  ooze: { 
    color: '#a855f7', 
    glow: '0 0 15px rgba(168, 85, 247, 0.5)', 
    bg: 'bg-purple-900/40', 
    border: 'border-purple-500/40',
    text: 'text-purple-400'
  },
  flying: { 
    color: '#f8fafc', 
    glow: '0 0 15px rgba(248, 250, 252, 0.5)', 
    bg: 'bg-slate-700/40', 
    border: 'border-slate-400/40',
    text: 'text-slate-200'
  }
};

export const TILE_COLORS = {
  [TileType.INITIAL]: 'bg-emerald-200/20 border-emerald-500',
  [TileType.PLAINS]: 'bg-green-500/30 border-green-400',
  [TileType.MOUNTAIN]: 'bg-slate-600/50 border-slate-500',
  [TileType.LAKE]: 'bg-blue-500/40 border-blue-400',
  [TileType.ANCIENT_CITY]: 'bg-purple-500/40 border-purple-400',
  [TileType.DUNGEON_ENTRANCE]: 'bg-stone-700/60 border-stone-500',
  [TileType.BOSS]: 'bg-red-600/50 border-red-500',
  [TileType.PREVIEW]: 'bg-yellow-400/40 border-yellow-400 animate-pulse cursor-pointer',
};

export const TILE_IMAGES: Partial<Record<TileType, string>> = {
  [TileType.LAKE]: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/hexes/lake%20cottage.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJoZXhlcy9sYWtlIGNvdHRhZ2UuanBnIiwiaWF0IjoxNzc0MDMwMzM2LCJleHAiOjE4MDU1NjYzMzZ9.yYpqzH9XDeCA-jXxgxWkZ07C5iq2ZnxkKKzP7js0MPM',
  [TileType.MOUNTAIN]: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/hexes/mountains%20green.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJoZXhlcy9tb3VudGFpbnMgZ3JlZW4ucG5nIiwiaWF0IjoxNzc0MDMxMDM4LCJleHAiOjE4MDU1NjcwMzh9.RTdLG6-VyoJ-AhXVp5GfAWesBloWs_2K-erGrIg_DQ8',
  [TileType.PLAINS]: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/hexes/green%20grass%20with%20trees%202.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJoZXhlcy9ncmVlbiBncmFzcyB3aXRoIHRyZWVzIDIucG5nIiwiaWF0IjoxNzc0MDMxMDA4LCJleHAiOjE4MDU1NjcwMDh9.3p-OLKg_u5xPMRhiWWzmJ021Zh32vxUjPnWDmNzteGM',
  [TileType.ANCIENT_CITY]: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/hexes/temple.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJoZXhlcy90ZW1wbGUuanBnIiwiaWF0IjoxNzc0MDMxMTY0LCJleHAiOjE4MDU1NjcxNjR9.mQdPdd2d1BAsWsW-m3aTTw8sgOKTFkpgJP-5-z1wPHo',
  [TileType.BOSS]: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/hexes/cosmic%20rift.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJoZXhlcy9jb3NtaWMgcmlmdC5wbmciLCJpYXQiOjE3NzQwMzExOTMsImV4cCI6MTgwNTU2NzE5M30.aiVWBPJfaxkqUaggSFXh7eSbGgtshfTIcY0hywXo_Lg',
  [TileType.DUNGEON_ENTRANCE]: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/hexes/plains%20green.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJoZXhlcy9wbGFpbnMgZ3JlZW4ucG5nIiwiaWF0IjoxNzc0MDMxMjI5LCJleHAiOjE4MDU1NjcyMjl9.0g_twJ_6DxEO7JzDHwnNtqERKqTzObF-iLpyto63O4Y'
};

export const FACTION_CAPITAL_IMAGES: Record<string, string> = {
  orc: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/hexes/orc%20stronghold.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJoZXhlcy9vcmMgc3Ryb25naG9sZC5wbmciLCJpYXQiOjE3NzQwMzE0NDgsImV4cCI6MTgwNTU2NzQ0OH0.7NqCPLSHU-_rowXfc7bnWdG2LF0Xg1D5dYLm-e1Vla8',
  ooze: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/hexes/slime%20swamp.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJoZXhlcy9zbGltZSBzd2FtcC5wbmciLCJpYXQiOjE3NzQwMzE1NzMsImV4cCI6MTgwNTU2NzU3M30.kM8X26Rsv_0zF8bSsNFCIQGp71Z2Ts00QBqKaaY86BY',
  human: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/hexes/human%20capital.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJoZXhlcy9odW1hbiBjYXBpdGFsLmpwZyIsImlhdCI6MTc3NDMxNTM2MywiZXhwIjoxODA1ODUxMzYzfQ.t5HqjxsBvwroJT9Q2GML62AB1RrUbGJvt5z8NcWc4Rk',
  dwarf: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/hexes/dwarf%20capital.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJoZXhlcy9kd2FyZiBjYXBpdGFsLnBuZyIsImlhdCI6MTc3NDMxNTQyMywiZXhwIjoxODA1ODUxNDIzfQ.zaYOIDqfdU2tZJun-cFY89fXWD7mnxoe369fG6A0TdU',
  elf: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/hexes/elf%20capital.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJoZXhlcy9lbGYgY2FwaXRhbC5wbmciLCJpYXQiOjE3NzQzMTU0MzgsImV4cCI6MTgwNTg1MTQzOH0.sps4lXnN6aJYqUfXPBJ6iNOmoAs5cKjCQTtsbr8tzcI'
};

export const FACTION_UNIT_MODELS: Record<string, Record<string, string>> = {
  orc: {
  }
};

export const FACTION_UNIT_IMAGES: Record<string, Record<string, string>> = {
  elf: {
    warrior: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/Elf%20warrior.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9FbGYgd2Fycmlvci5wbmciLCJpYXQiOjE3NzQwMzIxMTUsImV4cCI6MTgwNTU2ODExNX0.i09F7QKHspi8RPgGtY2g-sMDG5gQJFE1r5wtL656SZI',
    mage: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/elf_mage-removebg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9lbGZfbWFnZS1yZW1vdmViZy5wbmciLCJpYXQiOjE3NzQwMzIxNDAsImV4cCI6MTgwNTU2ODE0MH0.X3-4iKb3igBJMHNUHdEbn15ZYBD46iURpigQOuvejVs',
    knight: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/elf_knight-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9lbGZfa25pZ2h0LXJlbW92ZWJnLXByZXZpZXcucG5nIiwiaWF0IjoxNzc0MDMyMTU1LCJleHAiOjE4MDU1NjgxNTV9.0Z9kFzU6UHoStLxlJhyesOPpG2zK39N_0VZPj7OS-4E'
  },
  orc: {
    warrior: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/orc%20warrior%20amor.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9vcmMgd2FycmlvciBhbW9yLnBuZyIsImlhdCI6MTc3NDAzMjYyNSwiZXhwIjoxODA1NTY4NjI1fQ.uK5bvxp0C0OHbaw4uoW8YNlSovbE0ECaNCTew1DdRg8',
    mage: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/orc%20mage.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9vcmMgbWFnZS5wbmciLCJpYXQiOjE3NzQwMzI2NTIsImV4cCI6MTgwNTU2ODY1Mn0.z-NClSsj2pyaGWBuL6tIfpzsJlvV20opeCV1cRrfHgM',
    knight: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/orc_kinght_stone_armor.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9vcmNfa2luZ2h0X3N0b25lX2FybW9yLnBuZyIsImlhdCI6MTc3NDAzMjY3NCwiZXhwIjoxODA1NTY4Njc0fQ.TqxrixsK-3NXydemJiLTQxhzVFhf9_361xYQmon0Owo'
  },
  ooze: {
    warrior: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/slime%20soldier.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9zbGltZSBzb2xkaWVyLnBuZyIsImlhdCI6MTc3NDAzMzY1MCwiZXhwIjoxODA1NTY5NjUwfQ.9PnkiQCPLgBR_Hny4cK338Hg1y9iR0TCvTWtt6zuZx8',
    mage: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/slime%20specialist.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9zbGltZSBzcGVjaWFsaXN0LnBuZyIsImlhdCI6MTc3NDAzMzY4NSwiZXhwIjoxODA1NTY5Njg1fQ.51tSRWVp5bWWCG8kkzRQG4GJiSJsPdSZxFAOfM3OaEs',
    knight: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/slime%20elite.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9zbGltZSBlbGl0ZS5wbmciLCJpYXQiOjE3NzQwMzM3MDEsImV4cCI6MTgwNTU2OTcwMX0.EXt7NKJ46VrjCxW_OT1F560rYYQXhFROUCpUVJ9RYcs'
  },
  dwarf: {
    warrior: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/anoes_warrior-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9hbm9lc193YXJyaW9yLXJlbW92ZWJnLXByZXZpZXcucG5nIiwiaWF0IjoxNzc0MDMzNzM5LCJleHAiOjE4MDU1Njk3Mzl9.rxcBZkZxUO5K5Rs9rESWoUva5ZQfstjKHcThjLsucUc',
    mage: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/dwarf%20mage%20no%20bg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9kd2FyZiBtYWdlIG5vIGJnLnBuZyIsImlhdCI6MTc3NDAzMzc2MiwiZXhwIjoxODA1NTY5NzYyfQ.O_u92GsdirZnZDPOhEtuxc41zHzYRy9Sq84Dq_3nX8Q',
    knight: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/dwarf%20knigt.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9kd2FyZiBrbmlndC5wbmciLCJpYXQiOjE3NzQwMzM3NzcsImV4cCI6MTgwNTU2OTc3N30.kgURJQSQ56i7LYBcN9rkOA5q8OdwxkzGkB2bDGP423I'
  },
  human: {
    warrior: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/human_warrior-removebg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9odW1hbl93YXJyaW9yLXJlbW92ZWJnLnBuZyIsImlhdCI6MTc3NDMxNTE4OSwiZXhwIjoxODA1ODUxMTg5fQ.AVhaTMX11cO_p4nC_xrunWzy6OFm_uc7tEm1WgRlnLo',
    mage: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/human_mage-removebg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9odW1hbl9tYWdlLXJlbW92ZWJnLnBuZyIsImlhdCI6MTc3NDMxNTE3NiwiZXhwIjoxODA1ODUxMTc2fQ.JkSgW40PC96Asde4Tov4WsP_Wnm_RDYvirRLgfzy-cM',
    knight: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/units/human_knight-removebg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1bml0cy9odW1hbl9rbmlnaHQtcmVtb3ZlYmcucG5nIiwiaWF0IjoxNzc0MzE1MTM1LCJleHAiOjE4MDU4NTExMzV9.uLcRgW1pHVtrZ_rxjWN8aYW-aCDgnE4can9Dnjj2GGw'
  },
  flying: {
    warrior: 'https://picsum.photos/seed/flying-warrior/200/200',
    mage: 'https://picsum.photos/seed/flying-mage/200/200',
    knight: 'https://picsum.photos/seed/flying-knight/200/200'
  }
};

// Axial coordinates for the 21 hexes (No longer used, dynamic board generation implemented)
export const DICE = {
  MELEE: [0, 0, 1, 1, 1, 1],
  ORC_MELEE: [1, 1, 1, 1, 1, 2],
  FLYING_DEFENSE: [1, 1, 1, 1, 1, 2],
  MANA: [0, 1, 1, 1, 1, -1], // -1 represents explosion (1 + roll again)
  DEFENSE: [0, 1, 0, 1, 0, 1]
};

export const UNIT_STATS = {
  warrior: { hp: 1, move: 1, slots: 2, initialSkills: ['SWORD_1'], dice: { melee: 0, mana: 0, defense: 0 } },
  mage: { hp: 1, move: 1, slots: 3, initialSkills: ['MAGIC_1', 'MAGIC_1'], dice: { melee: 0, mana: 0, defense: 0 } },
  knight: { hp: 2, move: 1, slots: 4, initialSkills: ['SWORD_1', 'DEFENSE_1'], dice: { melee: 0, mana: 0, defense: 0 } }
};

export const getDiceFromSkill = (skill: any, isRangedPhase: boolean): { type: string, count: number, purpose: string }[] => {
  switch (skill.id) {
    case 'MAGIC_1': return isRangedPhase ? [] : [{ type: 'MANA', count: 1, purpose: 'DAMAGE' }];
    case 'SWORD_1': return isRangedPhase ? [] : [{ type: 'MELEE', count: 1, purpose: 'DAMAGE' }];
    case 'DEFENSE_1': return isRangedPhase ? [] : [{ type: 'DEFENSE', count: 1, purpose: 'DEFENSE' }];
    case 'SWORD_2A': return isRangedPhase ? [] : [{ type: 'MELEE', count: 2, purpose: 'DAMAGE' }, { type: 'DEFENSE', count: 1, purpose: 'DEFENSE' }];
    case 'SWORD_2B': return isRangedPhase ? [] : [{ type: 'MELEE', count: 2, purpose: 'DAMAGE' }];
    case 'RANGED_S': return isRangedPhase ? [{ type: 'MELEE', count: 2, purpose: 'DAMAGE' }] : [];
    case 'RANGED_M': return isRangedPhase ? [{ type: 'MELEE', count: 1, purpose: 'DAMAGE' }] : [];
    case 'ARMOR_2A': return isRangedPhase ? [] : [{ type: 'DEFENSE', count: 2, purpose: 'DEFENSE' }];
    case 'ARMOR_2B': return isRangedPhase ? [] : [{ type: 'DEFENSE', count: 1, purpose: 'DEFENSE' }];
    case 'ARMOR_2C': return isRangedPhase ? [] : [{ type: 'DEFENSE', count: 1, purpose: 'DEFENSE' }];
    case 'MAGIC_2A': return isRangedPhase ? [] : [{ type: 'MANA', count: 1, purpose: 'DAMAGE' }];
    case 'MAGIC_2B': return isRangedPhase ? [] : [{ type: 'MANA', count: 1, purpose: 'DAMAGE' }, { type: 'DEFENSE', count: 1, purpose: 'DEFENSE' }];
    case 'MAGIC_SWORD': return isRangedPhase ? [] : [{ type: 'MANA', count: 1, purpose: 'DAMAGE' }, { type: 'MELEE', count: 1, purpose: 'DAMAGE' }];
    
    case 'SWORD_3A': return isRangedPhase ? [] : [{ type: 'MELEE', count: 3, purpose: 'DAMAGE' }, { type: 'DEFENSE', count: 2, purpose: 'DEFENSE' }];
    case 'SWORD_3B': return isRangedPhase ? [] : [{ type: 'MELEE', count: 3, purpose: 'DAMAGE' }, { type: 'DEFENSE', count: 1, purpose: 'DEFENSE' }];
    case 'MAGIC_3A': return isRangedPhase ? [] : [{ type: 'MANA', count: 2, purpose: 'DAMAGE' }];
    case 'MAGIC_3B': return isRangedPhase ? [] : [{ type: 'MANA', count: 2, purpose: 'DAMAGE' }, { type: 'DEFENSE', count: 1, purpose: 'DEFENSE' }];
    case 'DEFENSE_3A': return isRangedPhase ? [] : [{ type: 'DEFENSE', count: 1, purpose: 'DEFENSE' }];
    case 'DEFENSE_3B': return isRangedPhase ? [] : [{ type: 'MANA', count: 2, purpose: 'DEFENSE' }];
    case 'RANGED_M2': return isRangedPhase ? [{ type: 'MANA', count: 2, purpose: 'DAMAGE' }] : [];
    case 'RANGED_S3': return isRangedPhase ? [{ type: 'MELEE', count: 3, purpose: 'DAMAGE' }] : [];
    
    case 'ORC_MAGE_UNIQUE': return [];
    case 'OOZE_MAGE_UNIQUE': return isRangedPhase ? [] : [{ type: 'MANA', count: skill.tokens || 0, purpose: 'DAMAGE' }];
    
    default: return [];
  }
};

export const SKILLS: { [key: string]: Skill } = {
  MAGIC_1: { id: 'MAGIC_1', name: 'Magic 1', level: 1, cost: 5, effect: '+1 mana dice', type: 'MAGIC' },
  SWORD_1: { id: 'SWORD_1', name: 'Sword 1', level: 1, cost: 4, effect: '+1 melee dice', type: 'SWORD' },
  LUCKY_1: { id: 'LUCKY_1', name: 'Lucky 1', level: 1, cost: 3, effect: '1 reroll option', type: 'LUCKY' },
  DEFENSE_1: { id: 'DEFENSE_1', name: 'Defense 1', level: 1, cost: 4, effect: '+1 defense dice', type: 'DEFENSE' },
  ELF_MAGE_UNIQUE: { id: 'ELF_MAGE_UNIQUE', name: 'Elf Wisdom', level: 1, cost: 0, effect: 'Mana dice also explode on 0', type: 'MAGIC', isUnique: true },
  ELF_KNIGHT_UNIQUE: { id: 'ELF_KNIGHT_UNIQUE', name: 'Elf Precision', level: 1, cost: 0, effect: 'Ignore 50% enemy defense', type: 'SWORD', isUnique: true },
  ORC_MAGE_UNIQUE: { id: 'ORC_MAGE_UNIQUE', name: 'Orc War-Cry', level: 1, cost: 0, effect: 'Mage skill slot 2 shared with all units in combat.', type: 'MAGIC', isUnique: true },
  ORC_KNIGHT_UNIQUE: { id: 'ORC_KNIGHT_UNIQUE', name: 'Orc Brutality', level: 1, cost: 0, effect: 'Melee dice are 1,1,1,1,1,2 for all friendly units', type: 'SWORD', isUnique: true },
  DWARF_PASSIVE: { id: 'DWARF_PASSIVE', name: 'Mountain Dweller', level: 1, cost: 0, effect: 'No red line penalty near mountains', type: 'DEFENSE', isUnique: true },
  DWARF_MAGE_UNIQUE: { id: 'DWARF_MAGE_UNIQUE', name: 'Dwarven Channeling', level: 1, cost: 0, effect: 'Can Channel to double Mana dice next turn if survived', type: 'MAGIC', isUnique: true },
  DWARF_KNIGHT_UNIQUE: { id: 'DWARF_KNIGHT_UNIQUE', name: 'Dwarven Counter', level: 1, cost: 0, effect: 'Generate 1 damage per 2 defense', type: 'DEFENSE', isUnique: true },
  OOZE_MAGE_UNIQUE: { id: 'OOZE_MAGE_UNIQUE', name: 'Slime Accumulation', level: 1, cost: 0, effect: 'Defeating enemies adds tokens (max 3). +1 mana dice per token in combat.', type: 'MAGIC', isUnique: true, tokens: 0 },
  OOZE_KNIGHT_UNIQUE: { id: 'OOZE_KNIGHT_UNIQUE', name: 'Adaptive Absorption', level: 1, cost: 0, effect: 'Defeating enemies grants a free skill of their level from market (max 1/combat).', type: 'SWORD', isUnique: true },
  FLYING_MAGE_UNIQUE: { id: 'FLYING_MAGE_UNIQUE', name: 'Aerial Superiority', level: 1, cost: 0, effect: 'Melee and mana dice attacks are considered ranged attacks for all friendly units.', type: 'MAGIC', isUnique: true },
  FLYING_KNIGHT_UNIQUE: { id: 'FLYING_KNIGHT_UNIQUE', name: 'Cloud Shield', level: 1, cost: 0, effect: 'Melee defense dice are 1,1,1,1,1,2.', type: 'DEFENSE', isUnique: true }
};

export const LEVEL_2_SKILLS: any[] = [
  { id: 'SWORD_2A', name: 'Sword 2A', level: 2, cost: 6, costXP: 3, effect: '2 melee dice, 1 defense dice', type: 'SWORD' },
  { id: 'SWORD_2B', name: 'Sword 2B', level: 2, cost: 6, costXP: 2, effect: '2 melee dice, 1 reroll', type: 'SWORD' },
  { id: 'RANGED_S', name: 'Ranged S', level: 2, cost: 7, costXP: 2, effect: '2 melee dice (first strike)', type: 'RANGED' },
  { id: 'RANGED_M', name: 'Ranged M', level: 2, cost: 7, costXP: 2, effect: '1 melee dice (first strike)', type: 'RANGED' },
  { id: 'ARMOR_2A', name: 'Armor 2A', level: 2, cost: 5, costXP: 1, effect: '2 defense dice', type: 'ARMOR' },
  { id: 'ARMOR_2B', name: 'Armor 2B', level: 2, cost: 5, costXP: 2, effect: '1 defense dice, 1 reroll', type: 'ARMOR' },
  { id: 'ARMOR_2C', name: 'Armor 2C', level: 2, cost: 6, costXP: 2, effect: '1 defense dice, +1 HP', type: 'ARMOR' },
  { id: 'MAGIC_2A', name: 'Magic 2A', level: 2, cost: 2, costXP: 3, effect: '1 mana dice, 1 reroll', type: 'MAGIC' },
  { id: 'MAGIC_2B', name: 'Magic 2B', level: 2, cost: 2, costXP: 3, effect: '1 mana dice, 1 defense dice', type: 'MAGIC' },
  { id: 'MAGIC_SWORD', name: 'Magic Sword', level: 2, cost: 2, costXP: 3, effect: '1 mana dice, 1 melee dice', type: 'MAGIC' }
];

export const LEVEL_3_SKILLS: any[] = [
  { id: 'SWORD_3A', name: 'Sword 3A', level: 3, cost: 9, costXP: 2, effect: '3 melee dice, 2 defense dice', type: 'SWORD' },
  { id: 'SWORD_3B', name: 'Sword 3B', level: 3, cost: 9, costXP: 2, effect: '3 melee dice, 1 defense dice, 1 reroll', type: 'SWORD' },
  { id: 'MAGIC_3A', name: 'Magic 3A', level: 3, cost: 4, costXP: 6, effect: '2 mana dice, 1 reroll', type: 'MAGIC' },
  { id: 'MAGIC_3B', name: 'Magic 3B', level: 3, cost: 4, costXP: 6, effect: '2 mana dice, 1 defense dice', type: 'MAGIC' },
  { id: 'DEFENSE_3A', name: 'Defense 3A', level: 3, cost: 10, costXP: 1, effect: '+2hp, 1 defense dice', type: 'DEFENSE' },
  { id: 'DEFENSE_3B', name: 'Defense 3B', level: 3, cost: 3, costXP: 6, effect: '2 defense mana dice', type: 'DEFENSE' },
  { id: 'RANGED_M2', name: 'Ranged M2', level: 3, cost: 3, costXP: 6, effect: '2 ranged mana dice', type: 'RANGED' },
  { id: 'RANGED_S3', name: 'Ranged S3', level: 3, cost: 10, costXP: 3, effect: '3 ranged melee dice', type: 'RANGED' }
];

export const MONSTER_STATS = loadFromStorage('dev_monster_stats', [
  {
    name: 'Level 1 Monster',
    hp: 1,
    dice: ['MELEE', 'MELEE', 'DEFENSE'],
    rewards: { xp: 2, gold: 1, vp: 0 },
    image: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/monsters/kobold%20mage.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb25zdGVycy9rb2JvbGQgbWFnZS5wbmciLCJpYXQiOjE3NzQwMzQxOTMsImV4cCI6MTgwNTU3MDE5M30.e6idamPdU8P9F2y0FYUsZveJUZuv5SpspoWPk1xVTeI'
  }
]);

export const MONSTER_LEVEL_2_STATS = loadFromStorage('dev_monster_level_2_stats', [
  {
    name: 'Level 2 Monster',
    hp: 4,
    defenseDice: 2,
    rerolls: 1,
    attackOptions: [
      { MELEE: 5, MANA: 0, RANGED_MANA: 0 },
      { MELEE: 0, MANA: 4, RANGED_MANA: 0 },
      { MELEE: 3, MANA: 2, RANGED_MANA: 0 },
      { MELEE: 0, MANA: 0, RANGED_MANA: 3 }
    ],
    rewards: {
      xp: 4,
      gold: 2,
      vp: 1
    },
    image: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/monsters/dragonborn%20archer.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb25zdGVycy9kcmFnb25ib3JuIGFyY2hlci5wbmciLCJpYXQiOjE3NzQwMzQzNTQsImV4cCI6MTgwNTU3MDM1NH0.Eup6c4d_xBeL4kW6dyi8IZVB6NgvM7e8W7mY4WLXaMw'
  }
]);

export const MONSTER_LEVEL_3_STATS = loadFromStorage('dev_monster_level_3_stats', [
  {
    name: 'Level 3 Monster',
    hp: 7,
    defenseDice: 3,
    manaDefenseDice: 2,
    rerolls: 2,
    attackOptions: [
      { MELEE: 7, MANA: 0, RANGED_MANA: 0 },
      { MELEE: 0, MANA: 6, RANGED_MANA: 0 },
      { MELEE: 4, MANA: 3, RANGED_MANA: 0 },
      { MELEE: 0, MANA: 0, RANGED_MANA: 4 }
    ],
    rewards: {
      xp: 6,
      gold: 4,
      vp: 2
    },
    image: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/monsters/red%20dragon.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb25zdGVycy9yZWQgZHJhZ29uLnBuZyIsImlhdCI6MTc3NDAzNDM3MywiZXhwIjoxODA1NTcwMzczfQ.YZBrgk6H6OhO-PcWKXA4pAEuPXyF-u94EzlBoDxYK1Y'
  }
]);

export const BOSS_STATS = loadFromStorage('dev_boss_stats', [
  {
    name: 'Boss Dragon',
    hp: 12,
    dice: {
      MANA: 5,
      MELEE: 4,
      DEFENSE: 3,
      DEFENSE_MANA: 4
    },
    rerolls: 3,
    rewards: {
      xp: 8,
      gold: 7,
      vp: 3
    },
    image: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/monsters/god%20level.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb25zdGVycy9nb2QgbGV2ZWwucG5nIiwiaWF0IjoxNzc0MDM0Mzg3LCJleHAiOjE4MDU1NzAzODd9.c1_pc6N3Vcr1utPbkbmcU1D6C8tJWSFF-WLAKD9Tx2o'
  }
]);

export const MONSTER_ICONS: Record<number, string> = {
  1: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/icons/level%201%20monster.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29ucy9sZXZlbCAxIG1vbnN0ZXIucG5nIiwiaWF0IjoxNzc0NDEwODUzLCJleHAiOjE4MDU5NDY4NTN9.bKRk9_ftZwC2h6E8gvJTGI6lln5sKLOL6N-uEwui_qY',
  2: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/icons/level%202%20monster.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29ucy9sZXZlbCAyIG1vbnN0ZXIucG5nIiwiaWF0IjoxNzc0NDEwODc1LCJleHAiOjE4MDU5NDY4NzV9.yHM5X_qDQHruMmQCta5Pietjp2ARnwQc1D3t6hvMbpo',
  3: 'https://gvgdhxqfmtcmtmrnrctc.supabase.co/storage/v1/object/sign/icons/level%203%20monster.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWYxNTk1NC0zNmRhLTRkYTctYmFmMi00YzNkODFhYzI1NDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29ucy9sZXZlbCAzIG1vbnN0ZXIucG5nIiwiaWF0IjoxNzc0NDEwODkzLCJleHAiOjE4MDU5NDY4OTN9.I2tPAISB5u1nDII33RDCL6hCNDprL1kQh-NJA3CXTvc'
};

export const INITIAL_QUESTS: any[] = loadFromStorage('dev_quests', [
  { id: 'q1', description: 'Spend 8 gold to complete the quest', type: 'SPEND_GOLD', requirement: 8, rewardVP: 1 },
  { id: 'q2', description: 'Spend 4xp to complete the quest', type: 'SPEND_XP', requirement: 4, rewardVP: 1 },
  { id: 'q3', description: 'Have 3 added skills to your units', type: 'ADDED_SKILLS', requirement: 3, rewardVP: 1 },
  { id: 'q4', description: 'Have 2 castles on the board', type: 'CASTLES', requirement: 2, rewardVP: 1 },
  { id: 'q5', description: 'Have completed 2 adventures', type: 'ADVENTURES', requirement: 2, rewardVP: 1 },
  { id: 'q6', description: 'Defeat 3 monsters', type: 'MONSTERS', requirement: 3, rewardVP: 1 },
  { id: 'q7', description: 'Defeat an enemy player unit in combat', type: 'ENEMY_UNITS', requirement: 1, rewardVP: 1 },
  { id: 'q11', description: 'Have 1 knight and 1 mage in the game board', type: 'UNIT_COMPOSITION', requirement: { mages: 1, knights: 1 }, rewardVP: 1 },
  { id: 'q12', description: 'Control at least 4 hexes out of the capital (control= have units or castles in the hex)', type: 'CONTROL_HEXES', requirement: 4, rewardVP: 1 },
  { id: 'q13', description: 'Generate at least 2 defense in a combat against another player', type: 'PVP_DEFENSE', requirement: 2, rewardVP: 1 },
  { id: 'q14', description: 'Have 2 units in an old city hex', type: 'UNITS_IN_OLD_CITY', requirement: 2, rewardVP: 1 },
  { id: 'q15', description: 'Have 2 level 2 skills', type: 'LEVEL_2_SKILLS', requirement: 2, rewardVP: 1 }
]);

export const ADVANCED_QUESTS: any[] = [
  { id: 'aq1', description: 'Have 3 level 3 skills', type: 'LEVEL_3_SKILLS', requirement: 3, rewardVP: 2 },
  { id: 'aq2', description: 'Spend 16 gold to complete the quest', type: 'SPEND_GOLD', requirement: 16, rewardVP: 2 },
  { id: 'aq3', description: 'Spend 8 gold to complete the quest', type: 'SPEND_GOLD', requirement: 8, rewardVP: 2 },
  { id: 'aq4', description: 'Win a pvp combat against at least 1 level 3 unit', type: 'PVP_LEVEL_3_UNIT', requirement: 1, rewardVP: 2 },
  { id: 'aq5', description: 'Have 3 mages and 2 knights in the board', type: 'UNIT_COMPOSITION', requirement: { mages: 3, knights: 2 }, rewardVP: 2 },
  { id: 'aq6', description: 'Generate over 10 damage in a pvp combat', type: 'PVP_DAMAGE', requirement: 10, rewardVP: 2 },
  { id: 'q8', description: 'Spend 10 gold to complete the quest', type: 'SPEND_GOLD', requirement: 10, rewardVP: 2 },
  { id: 'q9', description: 'Spend 6xp to complete the quest', type: 'SPEND_XP', requirement: 6, rewardVP: 2 },
  { id: 'q10', description: 'Have 3 castles on the board', type: 'CASTLES', requirement: 3, rewardVP: 2 }
];

export const NORMAL_ADVENTURES = loadFromStorage('dev_normal_adventures', [
  { title: "The Wandering Sage", story: "You encounter an old man sitting by a campfire. He offers to share his wisdom or some of his supplies.", skillId: 'MAGIC_1' },
  { title: "Abandoned Armory", story: "You find a half-buried chest in the ruins of an old fort. Inside are well-preserved weapons and some coins.", skillId: 'SWORD_1' },
  { title: "The Lucky Charm", story: "A traveling merchant is grateful for your protection and offers you a mysterious amulet or some gold.", skillId: 'LUCKY_1' },
  { title: "Ancient Shield", story: "In a hidden cave, you find a shield bearing the crest of a forgotten hero. It still hums with protective energy.", skillId: 'DEFENSE_1' }
]);

export const ADVANCED_ADVENTURES = loadFromStorage('dev_advanced_adventures', [
  { title: "The Dragon's Hoard", story: "You stumble upon a small portion of a dragon's treasure. It's dangerous, but the rewards are great." },
  { title: "Forgotten Library", story: "A crumbling tower contains scrolls of immense power and historical value." },
  { title: "The King's Bounty", story: "You recover a lost royal artifact. The kingdom is willing to reward you handsomely." }
]);

export const YEAR_EVENTS = [
  {
    id: 'DUNGEON_SPAWN',
    title: 'The Dungeon Awakens',
    flavor: 'A dark energy pulses from the depths. The dungeons are spewing forth their monstrous inhabitants!',
    description: 'Each dungeon sends out a level 2 monster (level 3 if any player has 5+ VP).'
  },
  {
    id: 'FREE_RECRUIT',
    title: 'Call to Arms',
    flavor: 'A surge of patriotism and courage sweeps the land. Volunteers flock to your banners!',
    description: 'Each player chooses to recruit for free: 2 warriors OR 1 mage OR 1 knight.'
  },
  {
    id: 'DUNGEON_ATTACK',
    title: 'The Shadow Strikes',
    flavor: 'Monstrous shadows emerge from the dungeons, striking at those who dare linger near their gates!',
    description: 'Level 2 monster attack dice are rolled (level 3 if any player has 6+ VP). Each player chooses one hex with units adjacent to a dungeon entrance to apply damage.'
  },
  {
    id: 'FREE_SKILL',
    title: 'Arcane Enlightenment',
    flavor: 'The stars align, revealing ancient secrets and granting sudden mastery to those who seek it!',
    description: 'Each player chooses one level 2 skill to buy for free (level 3 if any player has 5+ VP and the faction is able).'
  },
  {
    id: 'LAKE_XP_BONUS',
    title: 'The Waters of Wisdom',
    flavor: 'The lakes shimmer with an ethereal light, granting profound insights to those who contemplate their depths.',
    description: 'Lakes give double XP bonus until the end of the year.'
  },
  {
    id: 'DEFENSE_DICE_BONUS',
    title: 'The Unyielding Wall',
    flavor: 'A divine protection settles over your troops. Their shields seem reinforced by an invisible force!',
    description: 'Defense dice produce double defenses until the end of the year.'
  },
  {
    id: 'PLAINS_GOLD_REDUCTION',
    title: 'The Lean Harvest',
    flavor: 'A blight has struck the fields, and the once-rich plains now yield only a fraction of their usual bounty.',
    description: 'Plains produce half gold (rounded up) until the end of the year.'
  },
  {
    id: 'BOSS_MOVE',
    title: 'The Wandering Terror',
    flavor: 'The ground shakes as the Great Dragon shifts its lair, seeking a new peak from which to survey its domain!',
    description: 'The boss hex is moved to the place of an unoccupied mountain hex.'
  }
];
