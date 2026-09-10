import { pointsOnLine } from '../entities.js';
import { ADVANCED_SPELLS } from './advanced-abilities.js';

const VISUALS = Object.freeze({
  'Вакуумный карман': [
    { shape: 'rings', radii: [1, 2.4, 4], glyphs: ['(', ')', '<', '>'], colors: ['air'], duration: 900 },
    { shape: 'rays', radius: 4, glyphs: ['>', '.', ')'], colors: ['air'], delay: 180, duration: 520 },
  ],
  'Горячий воздух': [
    { shape: 'cloud', radius: 4, glyphs: ['^', ':', '.', '*'], colors: ['air', 'fire'], duration: 1450 },
    { shape: 'spiral', radius: 4, glyphs: ['~', '^', '*'], colors: ['fire', 'air'], delay: 100, duration: 1200 },
  ],
  'Давление океана': [
    { shape: 'rings', radii: [4, 3, 2, 1], glyphs: ['~', '=', 'O'], colors: ['water', 'air'], duration: 1350 },
    { shape: 'cage', radius: 3, glyphs: ['|', '=', '#'], colors: ['water', 'air'], delay: 180, duration: 1100 },
  ],
  'Воздушная пуля': [
    { shape: 'rays', radius: 3, glyphs: ['=', '>', '+'], colors: ['air', 'earth'], duration: 420 },
    { shape: 'ring', radius: 2, glyphs: ['.', ')', '>'], colors: ['air'], delay: 70, duration: 360 },
  ],
  'Живой огонь': [
    { shape: 'spiral', radius: 3, glyphs: ['*', '@', '^'], colors: ['fire', 'air'], duration: 800 },
    { shape: 'cloud', radius: 2, glyphs: ['*', '+', '.'], colors: ['fire'], delay: 90, duration: 700 },
  ],
  'Испарение': [
    { shape: 'cloud', radius: 4, glyphs: ['o', 'O', '~', '.'], colors: ['water', 'fire', 'air'], duration: 1600 },
    { shape: 'rings', radii: [1.5, 3, 4.5], glyphs: ['o', '*', '~'], colors: ['air', 'water', 'fire'], delay: 100, duration: 1250 },
  ],
  'Плавление': [
    { shape: 'pool', radius: 4, glyphs: ['~', ':', '#', '*'], colors: ['earth', 'fire'], duration: 1750 },
    { shape: 'cracks', radius: 4, glyphs: ['/', '_', '*'], colors: ['fire', 'earth'], delay: 130, duration: 1400 },
  ],
  'Гейзер': [
    { shape: 'rays', radius: 5, glyphs: ['|', '!', 'O'], colors: ['water', 'air'], duration: 750 },
    { shape: 'rings', radii: [1, 2.5, 4], glyphs: ['~', 'o', '.'], colors: ['water'], delay: 120, duration: 900 },
  ],
  'Подземный взрыв': [
    { shape: 'cracks', radius: 5, glyphs: ['#', '/', '_'], colors: ['earth', 'water'], duration: 1100 },
    { shape: 'cloud', radius: 3, glyphs: ['o', ':', '#'], colors: ['water', 'earth'], delay: 180, duration: 1300 },
  ],
  'Разлом': [
    { shape: 'cracks', radius: 6, glyphs: ['#', '=', '/'], colors: ['earth', 'air'], duration: 1700 },
    { shape: 'rays', radius: 4, glyphs: ['^', '#', '.'], colors: ['earth'], delay: 140, duration: 1000 },
  ],
  'Торнадо': [
    { shape: 'spiral', radius: 5, glyphs: ['(', ')', '@', '~'], colors: ['air'], duration: 1900 },
    { shape: 'rings', radii: [4.5, 3.2, 2, 1], glyphs: ['<', '>', 'o'], colors: ['air'], delay: 120, duration: 1500 },
    { shape: 'cloud', radius: 2, glyphs: ['.', 'o'], colors: ['air'], delay: 260, duration: 1100 },
  ],
  'Огненный смерч': [
    { shape: 'spiral', radius: 5, glyphs: ['^', '*', '@', ')'], colors: ['fire', 'air'], duration: 2000 },
    { shape: 'rings', radii: [1.5, 3, 4.5], glyphs: ['*', '^', '~'], colors: ['fire', 'air'], delay: 140, duration: 1550 },
    { shape: 'rays', radius: 4, glyphs: ['^', '*', '+'], colors: ['fire'], delay: 280, duration: 900 },
  ],
  'Водоворот': [
    { shape: 'spiral', radius: 5, glyphs: ['~', 'O', 'o', ')'], colors: ['water', 'air'], duration: 1950 },
    { shape: 'rings', radii: [5, 3.6, 2.2, 1], glyphs: ['~', '<', '>'], colors: ['water'], delay: 110, duration: 1600 },
    { shape: 'pool', radius: 3, glyphs: ['~', 'o', '.'], colors: ['water', 'air'], delay: 220, duration: 1200 },
  ],
  'Резонанс': [
    { shape: 'rings', radii: [1, 2, 3, 4, 5], glyphs: ['=', '-', '+'], colors: ['air', 'earth'], duration: 1700 },
    { shape: 'cage', radius: 4, glyphs: ['|', '=', '#'], colors: ['earth', 'air'], delay: 180, duration: 1350 },
    { shape: 'rays', radius: 5, glyphs: ['=', '#', '.'], colors: ['air', 'earth'], delay: 320, duration: 850 },
  ],
  'Плазменный луч': [
    { shape: 'rays', radius: 5, glyphs: ['=', '+', '*', '>'], colors: ['fire', 'air'], duration: 520 },
    { shape: 'rings', radii: [1, 2.5, 4], glyphs: ['@', '*', '.'], colors: ['fire', 'air'], delay: 80, duration: 620 },
  ],
  'Термический шок': [
    { shape: 'rings', radii: [1.2, 2.5, 4], glyphs: ['O', '*', '+'], colors: ['water', 'fire'], duration: 950 },
    { shape: 'rays', radius: 4, glyphs: ['~', '^', '!'], colors: ['water', 'fire', 'air'], delay: 120, duration: 700 },
    { shape: 'cloud', radius: 2, glyphs: ['o', '*'], colors: ['air', 'fire'], delay: 240, duration: 650 },
  ],
  'Огненный дождь': [
    { shape: 'rain', radius: 5, glyphs: ['*', '|', '^'], colors: ['fire', 'earth'], duration: 1400 },
    { shape: 'cracks', radius: 4, glyphs: ['*', '#', '/'], colors: ['fire', 'earth'], delay: 260, duration: 1000 },
    { shape: 'pool', radius: 4, glyphs: ['^', '.', '*'], colors: ['fire'], delay: 420, duration: 900 },
  ],
  'Осьминог': [
    { shape: 'tentacles', radius: 5, glyphs: ['~', 'S', 'O'], colors: ['water', 'air'], duration: 1500 },
    { shape: 'rings', radii: [1.5, 3, 5], glyphs: ['~', 'o', '.'], colors: ['water'], delay: 100, duration: 1200 },
  ],
  'Кавитация': [
    { shape: 'cloud', radius: 5, glyphs: ['o', 'O', '.', '*'], colors: ['water', 'earth', 'fire'], duration: 1700 },
    { shape: 'rings', radii: [1, 2, 3.5, 5], glyphs: ['o', '*', '+'], colors: ['water', 'fire'], delay: 180, duration: 1250 },
  ],
  'Тектонический сдвиг': [
    { shape: 'cracks', radius: 6, glyphs: ['#', '/', '='], colors: ['earth', 'air'], duration: 1900 },
    { shape: 'cage', radius: 5, glyphs: ['#', '|', '='], colors: ['earth'], delay: 150, duration: 1500 },
    { shape: 'rays', radius: 5, glyphs: ['^', '#', '/'], colors: ['earth', 'air'], delay: 300, duration: 1000 },
  ],
  'Атмосферный коллапс': [
    { shape: 'rings', radii: [6, 4.5, 3, 1.5], glyphs: ['>', '<', ')', '('], colors: ['air'], duration: 2100 },
    { shape: 'cloud', radius: 5, glyphs: ['.', 'o', '@'], colors: ['air'], delay: 260, duration: 1350 },
    { shape: 'rays', radius: 6, glyphs: ['!', '+', '>'], colors: ['air'], delay: 600, duration: 700 },
  ],
  'Огненный фронт': [
    { shape: 'rays', radius: 6, glyphs: ['^', '*', '=', '>'], colors: ['fire', 'air'], duration: 800 },
    { shape: 'rain', radius: 5, glyphs: ['^', '*', '|'], colors: ['fire'], delay: 100, duration: 1100 },
    { shape: 'pool', radius: 4, glyphs: ['^', '.', '*'], colors: ['fire', 'air'], delay: 280, duration: 900 },
  ],
  'Воздушное зеркало': [
    { shape: 'cage', radius: 4, glyphs: ['/', '\\', '|', '='], colors: ['air', 'water'], duration: 2200 },
    { shape: 'rings', radii: [2, 3.5, 5], glyphs: ['O', '+', '.'], colors: ['water', 'air'], delay: 120, duration: 1800 },
    { shape: 'rays', radius: 5, glyphs: ['+', '/', '\\'], colors: ['air'], delay: 300, duration: 1100 },
  ],
  'Абсолютная тишина': [
    { shape: 'rings', radii: [6, 4, 2], glyphs: ['.', '_', ' '], colors: ['air', 'earth'], duration: 2500 },
    { shape: 'cage', radius: 5, glyphs: ['|', '_', '.'], colors: ['earth', 'air'], delay: 180, duration: 2100 },
    { shape: 'cloud', radius: 4, glyphs: ['.', '_'], colors: ['air'], delay: 420, duration: 1500 },
  ],
  'Солнцепад': [
    { shape: 'rays', radius: 7, glyphs: ['*', '+', '|', '^'], colors: ['fire', 'air'], duration: 1200 },
    { shape: 'rings', radii: [1, 3, 5, 7], glyphs: ['@', '*', '^'], colors: ['fire', 'air'], delay: 120, duration: 1700 },
    { shape: 'pool', radius: 6, glyphs: ['^', '*', '.'], colors: ['fire'], delay: 420, duration: 1500 },
  ],
  'Гидроудар': [
    { shape: 'rings', radii: [1, 2.5, 4.5, 6], glyphs: ['O', '~', '=', '.'], colors: ['water', 'air'], duration: 1500 },
    { shape: 'rays', radius: 6, glyphs: ['~', '!', '+'], colors: ['water', 'air'], delay: 160, duration: 1000 },
    { shape: 'cloud', radius: 3, glyphs: ['o', 'O', '~'], colors: ['water'], delay: 360, duration: 1000 },
  ],
  'Магматический катаклизм': [
    { shape: 'cracks', radius: 7, glyphs: ['#', '*', '/', '^'], colors: ['earth', 'fire'], duration: 2300 },
    { shape: 'rain', radius: 6, glyphs: ['o', '*', '|'], colors: ['fire', 'earth'], delay: 180, duration: 1800 },
    { shape: 'pool', radius: 6, glyphs: ['~', '^', '#', '*'], colors: ['fire', 'earth'], delay: 450, duration: 1600 },
  ],
  'Водяная сфера': [
    { shape: 'rings', radii: [2, 3.5, 5.5], glyphs: ['O', '~', 'o'], colors: ['water', 'air'], duration: 2400 },
    { shape: 'spiral', radius: 5, glyphs: ['~', 'O', '+'], colors: ['water', 'air'], delay: 120, duration: 1900 },
    { shape: 'tentacles', radius: 4, glyphs: ['~', 'S', 'o'], colors: ['water'], delay: 300, duration: 1300 },
  ],
  'Струи': [
    { shape: 'rays', radius: 7, glyphs: ['~', '=', '!', '>'], colors: ['water', 'earth', 'air'], duration: 950 },
    { shape: 'rings', radii: [2, 4, 6], glyphs: ['~', 'o', '.'], colors: ['water'], delay: 120, duration: 1100 },
    { shape: 'rain', radius: 5, glyphs: ['|', '~', 'o'], colors: ['water', 'air'], delay: 260, duration: 900 },
  ],
  'Геошторм': [
    { shape: 'cracks', radius: 7, glyphs: ['#', '/', '=', '^'], colors: ['earth', 'air'], duration: 2400 },
    { shape: 'rain', radius: 6, glyphs: ['#', '|', '/'], colors: ['earth'], delay: 160, duration: 1900 },
    { shape: 'rings', radii: [2, 4, 6], glyphs: ['#', '^', '.'], colors: ['earth', 'air'], delay: 400, duration: 1500 },
  ],
});

function ring(center, radius, spec, count = Math.max(12, Math.ceil(radius * 10))) {
  return Array.from({ length: count }, (_, index) => {
    const angle = index / count * Math.PI * 2;
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius, glyph: spec.glyphs[index % spec.glyphs.length], color: spec.colors[index % spec.colors.length] };
  });
}

function cloud(center, radius, spec) {
  const points = [];
  for (let x = -Math.ceil(radius); x <= radius; x += 1) for (let y = -Math.ceil(radius); y <= radius; y += 1) {
    const noise = Math.abs((x * 29 + y * 43 + x * y * 11) % 17);
    if (Math.hypot(x, y) <= radius && noise < 11) points.push({ x: center.x + x, y: center.y + y, glyph: spec.glyphs[noise % spec.glyphs.length], color: spec.colors[noise % spec.colors.length] });
  }
  return points;
}

function rays(center, radius, spec, curved = false) {
  const points = [];
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  directions.forEach(([dx, dy], branch) => {
    for (let step = 1; step <= radius; step += 1) {
      const bend = curved ? Math.sin(step * 1.4 + branch) * step * .18 : 0;
      points.push({ x: center.x + dx * step + bend * dy, y: center.y + dy * step - bend * dx, glyph: spec.glyphs[(branch + step) % spec.glyphs.length], color: spec.colors[branch % spec.colors.length] });
    }
  });
  return points;
}

function cage(center, radius, spec) {
  const points = [];
  for (let offset = -radius; offset <= radius; offset += 1) {
    [[-radius, offset], [radius, offset], [offset, -radius], [offset, radius]].forEach(([x, y], index) => points.push({ x: center.x + x, y: center.y + y, glyph: spec.glyphs[index % spec.glyphs.length], color: spec.colors[index % spec.colors.length] }));
  }
  return points;
}

function layerPoints(center, spec) {
  if (spec.shape === 'ring') return ring(center, spec.radius, spec);
  if (spec.shape === 'rings') return spec.radii.flatMap((radius, index) => ring(center, radius, spec, 12 + index * 8));
  if (spec.shape === 'cloud' || spec.shape === 'pool') return cloud(center, spec.radius, spec);
  if (spec.shape === 'rays') return rays(center, spec.radius, spec);
  if (spec.shape === 'spiral' || spec.shape === 'tentacles') return rays(center, spec.radius, spec, true);
  if (spec.shape === 'cage') return cage(center, spec.radius, spec);
  if (spec.shape === 'cracks') return rays(center, spec.radius, spec, true);
  if (spec.shape === 'rain') return cloud(center, spec.radius, spec).map((point, index) => ({ ...point, y: point.y - (index % 4) }));
  return [];
}

function addEffect(state, points, now, spec) {
  state.effects.push({ points, glyph: spec.glyphs[0], color: spec.colors[0], createdAt: now + (spec.delay ?? 0), startAt: now + (spec.delay ?? 0), expiresAt: now + (spec.delay ?? 0) + spec.duration, frameMs: 65 + (spec.radius ?? 1) * 8 });
}

export function addAdvancedCastVisuals(state, spell, origin, target, now) {
  if (spell.level < 3) return false;
  const colors = spell.elements.map((element) => element.color);
  addEffect(state, ring(origin, 1.4 + spell.level * .18, { glyphs: ['+', '*', 'o'], colors }, 12 + spell.level * 2), now, { glyphs: ['+'], colors, duration: 300 + spell.level * 50 });
  const path = pointsOnLine(origin, target).slice(0, 5 + spell.level).map((point, index) => ({ ...point, glyph: index % 2 ? '=' : '+', color: colors[index % colors.length] }));
  addEffect(state, path, now, { glyphs: ['='], colors, delay: 75, duration: 300 + spell.level * 45 });
  return true;
}

export function addAdvancedImpactVisuals(state, spellName, center, now) {
  const profile = VISUALS[spellName];
  if (!profile) return false;
  profile.forEach((spec) => addEffect(state, layerPoints(center, spec), now, spec));
  return true;
}

const LARGE_VOLLEY_VISUALS = new Set(['Огненный дождь', 'Огненный фронт', 'Струи']);

export function addAdvancedProjectileImpactVisuals(state, spellName, center, now) {
  if (LARGE_VOLLEY_VISUALS.has(spellName)) {
    state.advancedVisualTimes ??= {};
    if (now - (state.advancedVisualTimes[spellName] ?? -Infinity) < 700) return false;
    state.advancedVisualTimes[spellName] = now;
  }
  return addAdvancedImpactVisuals(state, spellName, center, now);
}

export const ADVANCED_VISUAL_NAMES = Object.freeze(Object.keys(VISUALS));
