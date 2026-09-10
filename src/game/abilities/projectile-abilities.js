import { spawnProjectile } from './projectiles.js';
import { SPELL_RANGE_MULTIPLIER } from '../../config.js';

const PROFILES = Object.freeze({
  'Фаербол': { speed: 8, range: 14, damageScale: 1.1, glyph: '*', color: 'fire', animationGlyphs: ['*', '@', '+'], trailGlyphs: ['.', '*', '^'], trailColors: ['fire', 'air'], splashRadius: 2.4, size: 2 },
  'Водяной шар': { speed: 6.5, range: 13, damageScale: 1, glyph: 'O', color: 'water', animationGlyphs: ['O', '0', 'o'], trailGlyphs: ['~', '.', 'o'], trailColors: ['water', 'air'], splashRadius: 3, size: 2 },
  'Капли': { speed: 11, range: 11, damageScale: 0.24, glyph: '.', color: 'water', animationGlyphs: ['.', 'o'], trailGlyphs: ['.', "'", '~'], trailColors: ['water', 'air'], count: 6, spread: 0.075, delayStep: 35 },
  'Паровое облако': { speed: 7.5, range: 12, damageScale: 0.52, glyph: 'o', color: 'water', glyphs: ['O', '*'], colors: ['water', 'fire'], animationGlyphs: ['o', 'O', '~', '*'], trailGlyphs: ['.', 'o', '~'], trailColors: ['water', 'fire', 'air'], count: 2, spread: 0.05, delayStep: 110, splashRadius: 3.2 },
  'Комья магмы': { speed: 6.5, range: 12, damageScale: 0.42, glyph: 'o', color: 'fire', animationGlyphs: ['o', 'O', '@', '#'], trailGlyphs: ['.', '*', '#'], trailColors: ['fire', 'earth'], count: 4, spread: 0.13, delayStep: 55, splashRadius: 3 },
  'Встряска': { speed: 6, range: 10, damageScale: 0.75, glyph: '_', color: 'earth', animationGlyphs: ['_', '-', '=', '#'], trailGlyphs: ['_', '.', '/'], trailColors: ['earth', 'air'], count: 3, spread: 0.045, delayStep: 45, pierce: 3, hitRadius: 0.8 },
  'Огнемёт': { speed: 10, range: 7, damageScale: 0.22, glyph: '^', color: 'fire', animationGlyphs: ['^', '*', '+'], trailGlyphs: ['.', '^', '*'], trailColors: ['fire', 'air'], count: 8, spread: 0.1, delayStep: 45, hitRadius: 0.75 },
  'Струя пара': { speed: 11, range: 10, damageScale: 0.28, glyph: '~', color: 'water', animationGlyphs: ['~', '=', 'o'], trailGlyphs: ['.', 'o', '~'], trailColors: ['water', 'fire', 'air'], count: 6, spread: 0.045, delayStep: 40, pierce: 1 },
  'Водяной резак': { speed: 13, range: 16, damageScale: 1.05, glyph: '-', color: 'water', animationGlyphs: ['-', '=', '-'], trailGlyphs: ['-', '.', '='], trailColors: ['water', 'air'], pierce: 4, ignoreObstacles: true },
  'Воздушная пуля': { speed: 18, range: 17, damageScale: 1.45, glyph: '=', color: 'air', animationGlyphs: ['=', '>', '+'], trailGlyphs: ['-', '.', '='], trailColors: ['air', 'earth'], pierce: 6, hitRadius: 0.75, size: 2 },
  'Живой огонь': { speed: 9, range: 11, damageScale: 0.82, glyph: '*', color: 'fire', animationGlyphs: ['*', '@', '^'], trailGlyphs: ['.', '*', '+'], trailColors: ['fire', 'air'], chain: 3, splashRadius: 0.6 },
  'Плазменный луч': { speed: 24, range: 18, damageScale: 1.35, glyph: '=', color: 'fire', animationGlyphs: ['=', '#', '+'], trailGlyphs: ['=', '-', '.'], trailColors: ['fire', 'air'], pierce: 12, hitRadius: 0.9, size: 2 },
  'Термический шок': { speed: 10, range: 13, damageScale: 0.58, glyph: 'o', color: 'water', glyphs: ['O', '*'], colors: ['water', 'fire'], animationGlyphs: ['O', '*', 'o', '+'], trailGlyphs: ['~', '^', '.'], trailColors: ['water', 'fire', 'air'], count: 2, spread: 0.025, delayStep: 90, splashRadius: 4 },
  'Огненный дождь': { mode: 'rain', speed: 12, range: 8, damageScale: 0.28, glyph: '*', color: 'fire', animationGlyphs: ['*', 'o', '@'], trailGlyphs: ['|', '.', '^'], trailColors: ['fire', 'earth'], count: 9, splashRadius: 0.7 },
  'Гидроудар': { speed: 5, range: 14, damageScale: 1.5, glyph: 'O', color: 'water', animationGlyphs: ['O', '0', '@', 'o'], trailGlyphs: ['~', 'O', '.'], trailColors: ['water', 'air'], splashRadius: 6, hitRadius: 1.1, size: 3 },
  'Струи': { speed: 12, range: 15, damageScale: 0.25, glyph: '~', color: 'water', animationGlyphs: ['~', '=', 'o'], trailGlyphs: ['.', '~', '='], trailColors: ['water', 'earth', 'air'], count: 10, spread: 0.17, delayStep: 30, pierce: 1 },
  'Огненный фронт': { speed: 9, range: 13, damageScale: 0.32, glyph: '^', color: 'fire', animationGlyphs: ['^', '*', '#'], trailGlyphs: ['.', '^', '*'], trailColors: ['fire', 'air'], count: 9, spread: 0.16, delayStep: 35, pierce: 1 },
});

function playerOrigin(player) {
  return { x: player.visualX ?? player.x, y: player.visualY ?? player.y };
}

function spawnRain(state, spell, target, profile, now) {
  for (let index = 0; index < profile.count; index += 1) {
    const angle = (index / profile.count) * Math.PI * 2;
    const origin = { x: target.x + Math.cos(angle) * 5, y: target.y + Math.sin(angle) * 5 };
    const landing = {
      x: target.x + Math.cos(angle * 2.3) * (index % 3),
      y: target.y + Math.sin(angle * 1.7) * (index % 3),
    };
    spawnProjectile(state, origin, landing, {
      ...profile,
      range: profile.range * SPELL_RANGE_MULTIPLIER,
      level: spell.level,
      elements: spell.elements,
      damage: spell.damage * profile.damageScale,
      spellName: spell.name,
      delay: index * 65,
      ignoreObstacles: true,
    }, now);
  }
}

export function castProjectileAbility(state, spell, target, now) {
  const profile = PROFILES[spell.name];
  if (!profile) return null;
  if (profile.mode === 'rain') {
    spawnRain(state, spell, target, profile, now);
    return { projectileCount: profile.count };
  }

  const count = profile.count ?? 1;
  const spread = profile.spread ?? 0;
  const origin = playerOrigin(state.player);
  for (let index = 0; index < count; index += 1) {
    const centeredIndex = index - (count - 1) / 2;
    spawnProjectile(state, origin, target, {
      ...profile,
      range: profile.range * SPELL_RANGE_MULTIPLIER,
      level: spell.level,
      elements: spell.elements,
      damage: spell.damage * profile.damageScale,
      spellName: spell.name,
      glyph: profile.glyphs?.[index % profile.glyphs.length] ?? profile.glyph,
      color: profile.colors?.[index % profile.colors.length] ?? profile.color,
      angleOffset: centeredIndex * spread,
      delay: index * (profile.delayStep ?? 0),
    }, now);
  }
  return { projectileCount: count };
}

export const PROJECTILE_SPELL_NAMES = Object.freeze(Object.keys(PROFILES));
