export const WORLD_SIZE = 108;
export const VIEWPORT_COLS = 204;
export const VIEWPORT_ROWS = 86;
export const SEA_DEPTH = 6;
export const PLAYER_MAX_HEALTH = 100;
export const INITIAL_ENEMY_COUNT = 4;
export const SPELL_RANGE_MULTIPLIER = 1.5;

export const ELEMENTS = Object.freeze({
  1: { id: 'air', name: 'Воздух', short: 'ВОЗ', color: 'air', glyph: ')' },
  2: { id: 'fire', name: 'Огонь', short: 'ОГН', color: 'fire', glyph: '*' },
  3: { id: 'water', name: 'Вода', short: 'ВОД', color: 'water', glyph: '~' },
  4: { id: 'earth', name: 'Земля', short: 'ЗЕМ', color: 'earth', glyph: '#' },
});

export const ELEMENT_ORDER = ['air', 'fire', 'water', 'earth'];

export const MODIFIERS = Object.freeze({
  z: { id: 'inferno', name: 'Инферно' },
  x: { id: 'nature', name: 'Растения' },
  c: { id: 'light', name: 'Свет' },
  v: { id: 'dark', name: 'Тьма' },
});
