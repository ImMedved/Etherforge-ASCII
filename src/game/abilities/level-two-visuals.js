import { pointsOnLine } from '../entities.js';
import { LEVEL_TWO_SPELLS } from './level-two-abilities.js';

function ring(center, radius, glyphs, colors, count = Math.max(10, Math.ceil(radius * 10))) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
      glyph: glyphs[index % glyphs.length],
      color: colors[index % colors.length],
    };
  });
}

function cloud(center, radius, glyphs, colors) {
  const points = [];
  for (let x = -radius; x <= radius; x += 1) {
    for (let y = -radius; y <= radius; y += 1) {
      const noise = Math.abs((x * 23 + y * 41 + x * y * 5) % 13);
      if (Math.hypot(x, y) <= radius + .3 && noise < 9) {
        points.push({ x: center.x + x, y: center.y + y, glyph: glyphs[noise % glyphs.length], color: colors[noise % colors.length] });
      }
    }
  }
  return points;
}

function rays(center, radius, glyphs, colors) {
  const points = [];
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  directions.forEach(([dx, dy], branch) => {
    for (let step = 1; step <= radius; step += 1) {
      points.push({ x: center.x + dx * step, y: center.y + dy * step, glyph: glyphs[(branch + step) % glyphs.length], color: colors[branch % colors.length] });
    }
  });
  return points;
}

function cage(center, radius) {
  const points = [];
  for (let offset = -radius; offset <= radius; offset += 1) {
    points.push({ x: center.x - radius, y: center.y + offset, glyph: '|', color: 'earth' });
    points.push({ x: center.x + radius, y: center.y + offset, glyph: '|', color: 'earth' });
    points.push({ x: center.x + offset, y: center.y - radius, glyph: '=', color: 'air' });
    points.push({ x: center.x + offset, y: center.y + radius, glyph: '=', color: 'earth' });
  }
  return points;
}

function addEffect(state, points, now, options = {}) {
  state.effects.push({
    points,
    glyph: options.glyph ?? '*',
    color: options.color ?? 'ui',
    createdAt: now + (options.delay ?? 0),
    startAt: now + (options.delay ?? 0),
    expiresAt: now + (options.delay ?? 0) + (options.duration ?? 500),
    frameMs: options.frameMs ?? 90,
  });
}

export function addLevelTwoCastVisuals(state, spell, origin, target, now) {
  if (spell.level !== 2) return false;
  const colors = spell.elements.map((element) => element.color);
  addEffect(state, ring(origin, 1.4, ['+', 'o', '.'], colors, 14), now, { duration: 300, frameMs: 55 });
  const path = pointsOnLine(origin, target).slice(0, 7).map((point, index) => ({
    ...point, glyph: index % 3 === 0 ? '=' : '.', color: colors[index % colors.length],
  }));
  addEffect(state, path, now, { delay: 80, duration: 340 });
  return true;
}

export function addLevelTwoImpactVisuals(state, spellName, center, now) {
  if (!LEVEL_TWO_SPELLS.includes(spellName)) return false;

  if (spellName === 'Циркуляция') {
    [1.4, 2.5, 3.6].forEach((radius, index) => addEffect(state, ring(center, radius, ['(', ')', '@', '.'], ['air'], 14 + index * 8), now, { delay: index * 90, duration: 900 - index * 80 }));
  } else if (spellName === 'Печь') {
    addEffect(state, cloud(center, 3, ['^', '*', ':', '+'], ['fire', 'air']), now, { duration: 1450, frameMs: 75 });
    addEffect(state, ring(center, 3.5, ['^', '#', '*'], ['fire', 'earth'], 30), now, { delay: 130, duration: 1150 });
  } else if (spellName === 'Пузырь') {
    addEffect(state, ring(center, 2.4, ['O', 'o', '.'], ['water', 'air'], 28), now, { duration: 1100, frameMs: 110 });
    addEffect(state, rays(center, 3, ['~', '.', '+'], ['water', 'air']), now, { delay: 1080, duration: 420, frameMs: 55 });
  } else if (spellName === 'Линза') {
    addEffect(state, cage(center, 2), now, { duration: 950, frameMs: 120 });
    addEffect(state, rays(center, 3, ['/', '\\', '+'], ['earth', 'air']), now, { delay: 90, duration: 720 });
  } else if (spellName === 'Огнемёт') {
    addEffect(state, rays(center, 2, ['^', '*', '+'], ['fire', 'air']), now, { duration: 430, frameMs: 45 });
    addEffect(state, ring(center, 1.7, ['*', '.', '^'], ['fire'], 16), now, { delay: 60, duration: 360 });
  } else if (spellName === 'Струя пара') {
    addEffect(state, cloud(center, 2, ['o', 'O', '~', '.'], ['water', 'fire', 'air']), now, { duration: 780, frameMs: 80 });
    addEffect(state, ring(center, 2.3, ['o', '~', '*'], ['air', 'water', 'fire'], 20), now, { delay: 80, duration: 600 });
  } else if (spellName === 'Озеро лавы') {
    addEffect(state, cloud(center, 4, ['~', '^', '*', '#'], ['fire', 'earth']), now, { duration: 1800, frameMs: 120 });
    addEffect(state, ring(center, 4.2, ['#', '*', '^'], ['earth', 'fire'], 36), now, { delay: 120, duration: 1500 });
  } else if (spellName === 'Водяной резак') {
    addEffect(state, rays(center, 4, ['-', '=', '/'], ['water', 'air']), now, { duration: 420, frameMs: 45 });
    addEffect(state, ring(center, 1.6, ['~', '.', '+'], ['water'], 16), now, { delay: 50, duration: 330 });
  } else if (spellName === 'Грязевой щит') {
    addEffect(state, ring(center, 2.2, ['#', 'O', '#'], ['earth', 'water'], 24), now, { duration: 1050, frameMs: 100 });
    addEffect(state, ring(center, 3, ['o', '#', '~'], ['water', 'earth'], 30), now, { delay: 100, duration: 820 });
  } else if (spellName === 'Сковывание') {
    addEffect(state, cage(center, 3), now, { duration: 1500, frameMs: 130 });
    addEffect(state, rays(center, 3, ['#', '/', '='], ['earth', 'air']), now, { delay: 100, duration: 1200 });
  }
  return true;
}
