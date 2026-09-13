import { spawnLighting, spawnRift, spawnSpherePulse, spawnSphericalExplosion, spawnTornado } from './primitives.js';

const TORNADO = {
  'Циркуляция': { colors: ['air'], radius: 3, height: 5, duration: 1200 },
  'Торнадо': { colors: ['air'], radius: 5, height: 10, duration: 2100 },
  'Огненный смерч': { colors: ['fire', 'air'], glyphs: ['^', '*', '(', ')'], radius: 5, height: 11, duration: 2200 },
  'Водоворот': { colors: ['water', 'air'], glyphs: ['~', 'O', '(', ')'], radius: 5, height: 6, duration: 1900 },
};

const RIFTS = {
  'Встряска': { colors: ['earth', 'air'], width: .7, duration: 800 },
  'Подземный взрыв': { colors: ['earth', 'water'], width: 1.3, duration: 1300 },
  'Разлом': { colors: ['earth', 'air'], width: 1.7, duration: 1900 },
  'Тектонический сдвиг': { colors: ['earth', 'air'], width: 2.1, duration: 2100 },
  'Магматический катаклизм': { colors: ['earth', 'fire'], glyphs: ['#', '*', '/', '^'], width: 2.4, duration: 2400 },
  'Геошторм': { colors: ['earth', 'air'], width: 2.2, duration: 2200 },
};

const EXPLOSIONS = {
  'Взрыв': { colors: ['fire', 'air'], radius: 3.4, duration: 720 },
  'Фаербол': { colors: ['fire', 'air'], radius: 2.4, duration: 650 },
  'Водяной шар': { colors: ['water', 'air'], glyphs: ['O', '~', 'o', '.'], radius: 3, duration: 800 },
  'Термический шок': { colors: ['water', 'fire', 'air'], radius: 4, duration: 900 },
  'Атмосферный коллапс': { colors: ['air'], glyphs: ['(', ')', '<', '>'], radius: 6, duration: 1200 },
  'Солнцепад': { colors: ['fire', 'air'], glyphs: ['@', '*', '+', '^'], radius: 7, duration: 1300 },
  'Гидроудар': { colors: ['water', 'air'], glyphs: ['O', '~', '=', '.'], radius: 6, duration: 1200 },
};

const PULSES = {
  'Пузырь': { colors: ['water', 'air'], radius: 3, rings: 2, duration: 1400 },
  'Линза': { colors: ['earth', 'air'], glyphs: ['/', '\\', '+', '.'], radius: 3.5, duration: 1300 },
  'Грязевой щит': { colors: ['earth', 'water'], glyphs: ['#', 'O', 'o', '.'], radius: 3.5, duration: 1500 },
  'Воздушное зеркало': { colors: ['air', 'water'], glyphs: ['/', '\\', 'O', '+'], radius: 5, rings: 4, duration: 2200, followPlayer: true },
  'Водяная сфера': { colors: ['water', 'air'], radius: 5, rings: 4, duration: 4700, followPlayer: true },
};

const LIGHTING = {
  'Печь': { color: '#ff7138', alpha: .12, duration: 1500 },
  'Горячий воздух': { color: '#ff9a52', alpha: .11, duration: 1300 },
  'Плазменный луч': { color: '#ffdf9a', alpha: .18, duration: 500 },
  'Огненный дождь': { color: '#c9472f', alpha: .12, duration: 1700 },
  'Атмосферный коллапс': { color: '#a5dbea', alpha: .14, duration: 1200 },
  'Абсолютная тишина': { color: '#06101b', alpha: .38, duration: 2600 },
  'Солнцепад': { color: '#ffd27a', alpha: .28, duration: 1500 },
  'Магматический катаклизм': { color: '#ff542f', alpha: .18, duration: 2400 },
};

export function applyReusableSpellAnimation(state, spellName, origin, target, now, phase = 'all') {
  const tornado = TORNADO[spellName];
  if (tornado && phase !== 'cast') spawnTornado(state, target, now, tornado);
  const rift = RIFTS[spellName];
  if (rift && phase !== 'cast') spawnRift(state, origin, target, now, rift);
  const explosion = EXPLOSIONS[spellName];
  if (explosion && phase !== 'cast') spawnSphericalExplosion(state, target, now, explosion);
  const pulse = PULSES[spellName];
  if (pulse && phase !== 'cast') spawnSpherePulse(state, target, now, { ...pulse, followActor: pulse.followPlayer ? origin : null });
  const lighting = LIGHTING[spellName];
  if (lighting && phase !== 'impact') spawnLighting(state, now, lighting);
  return Boolean(tornado || rift || explosion || pulse || lighting);
}

export function applyReusableProjectileAnimation(state, spellName, origin, target, now) {
  state.reusableAnimationTimes ??= {};
  if (now - (state.reusableAnimationTimes[spellName] ?? -Infinity) < 450) return false;
  state.reusableAnimationTimes[spellName] = now;
  return applyReusableSpellAnimation(state, spellName, origin, target, now, 'impact');
}

export const REUSABLE_ANIMATION_SPELLS = Object.freeze([...new Set([
  ...Object.keys(TORNADO), ...Object.keys(RIFTS), ...Object.keys(EXPLOSIONS), ...Object.keys(PULSES), ...Object.keys(LIGHTING),
])]);
