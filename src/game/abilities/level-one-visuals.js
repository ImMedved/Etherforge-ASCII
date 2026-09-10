import { pointsOnLine } from '../entities.js';

export const LEVEL_ONE_SPELLS = Object.freeze([
  'Порыв', 'Взрыв', 'Капли', 'Пылевое облако', 'Фаербол',
  'Паровое облако', 'Комья магмы', 'Водяной шар', 'Болото', 'Встряска',
]);

function ring(center, radius, glyphs, colors, count = Math.max(8, Math.ceil(radius * 10))) {
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
      const noise = Math.abs((x * 17 + y * 31 + x * y * 7) % 11);
      if (Math.hypot(x, y) <= radius + .4 && noise < 7) {
        points.push({
          x: center.x + x,
          y: center.y + y,
          glyph: glyphs[noise % glyphs.length],
          color: colors[noise % colors.length],
        });
      }
    }
  }
  return points;
}

function crack(center, radius) {
  const points = [];
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]];
  directions.forEach(([dx, dy], branch) => {
    for (let step = 0; step <= radius; step += 1) {
      points.push({
        x: center.x + dx * step,
        y: center.y + dy * step,
        glyph: step % 2 ? '/' : '_',
        color: branch % 2 ? 'fire' : 'earth',
      });
    }
  });
  return points;
}

function addEffect(state, points, now, options = {}) {
  state.effects.push({
    points,
    glyph: options.glyph ?? '*',
    glyphs: options.glyphs,
    color: options.color ?? 'ui',
    createdAt: now + (options.delay ?? 0),
    startAt: now + (options.delay ?? 0),
    expiresAt: now + (options.delay ?? 0) + (options.duration ?? 420),
    frameMs: options.frameMs ?? 85,
  });
}

export function addLevelOneCastVisuals(state, spell, origin, target, now) {
  if (spell.level !== 1) return false;
  const line = pointsOnLine(origin, target).slice(0, 5).map((point, index) => ({
    ...point,
    glyph: index % 2 ? '+' : spell.elements[0].glyph,
    color: spell.elements[index % spell.elements.length].color,
  }));
  addEffect(state, ring(origin, 1.2, ['.', '+'], spell.elements.map((element) => element.color), 10), now, { duration: 260 });
  addEffect(state, line, now, { delay: 70, duration: 280 });
  return true;
}

export function addLevelOneImpactVisuals(state, spellName, center, now) {
  if (!LEVEL_ONE_SPELLS.includes(spellName)) return false;

  if (spellName === 'Порыв') {
    [1.2, 2.2, 3.2].forEach((radius, index) => addEffect(state, ring(center, radius, [')', '>', '.'], ['air'], 7 + index * 3), now, { delay: index * 75, duration: 260 }));
  } else if (spellName === 'Взрыв') {
    addEffect(state, cloud(center, 1, ['*', '@', '+'], ['fire', 'air']), now, { duration: 260, frameMs: 55 });
    addEffect(state, ring(center, 2.4, ['*', '+', 'o'], ['fire', 'air'], 24), now, { delay: 80, duration: 430 });
    addEffect(state, ring(center, 3.4, ['.', '*'], ['air', 'fire'], 28), now, { delay: 170, duration: 360 });
  } else if (spellName === 'Капли') {
    addEffect(state, ring(center, .8, ['.', 'o', '~'], ['water', 'air'], 9), now, { duration: 300 });
    addEffect(state, ring(center, 1.7, ['~', '.', '~'], ['water'], 16), now, { delay: 90, duration: 380 });
  } else if (spellName === 'Пылевое облако') {
    addEffect(state, cloud(center, 3, ['.', ':', 'o', ','], ['earth', 'air']), now, { duration: 1100, frameMs: 120 });
    addEffect(state, ring(center, 3.5, ['(', ')', '.'], ['air', 'earth'], 26), now, { delay: 100, duration: 950 });
  } else if (spellName === 'Фаербол') {
    addEffect(state, cloud(center, 1, ['@', '*', '+'], ['fire', 'air']), now, { duration: 330, frameMs: 50 });
    addEffect(state, ring(center, 2.3, ['*', '^', '.'], ['fire', 'air'], 22), now, { delay: 70, duration: 480 });
  } else if (spellName === 'Паровое облако') {
    addEffect(state, cloud(center, 3, ['o', 'O', '.', '~'], ['water', 'air', 'fire']), now, { duration: 1200, frameMs: 105 });
    addEffect(state, ring(center, 3.2, ['o', '~', '*'], ['air', 'water', 'fire'], 26), now, { delay: 120, duration: 900 });
  } else if (spellName === 'Комья магмы') {
    addEffect(state, crack(center, 3), now, { duration: 750, frameMs: 90 });
    addEffect(state, ring(center, 2, ['o', '*', '#'], ['fire', 'earth'], 18), now, { delay: 90, duration: 520 });
  } else if (spellName === 'Водяной шар') {
    [1, 2, 3].forEach((radius, index) => addEffect(state, ring(center, radius, ['~', 'o', '~'], ['water', 'air'], 12 + radius * 5), now, { delay: index * 95, duration: 410 }));
  } else if (spellName === 'Болото') {
    addEffect(state, cloud(center, 3, ['~', ':', ',', 'o'], ['earth', 'water']), now, { duration: 1500, frameMs: 150 });
    addEffect(state, ring(center, 3.4, ['~', '#', '.'], ['water', 'earth'], 28), now, { delay: 120, duration: 1200 });
  } else if (spellName === 'Встряска') {
    addEffect(state, crack(center, 4), now, { duration: 700, frameMs: 70 });
    [1.5, 3].forEach((radius, index) => addEffect(state, ring(center, radius, ['_', '/', '#'], ['earth', 'air'], 18 + index * 8), now, { delay: index * 100, duration: 470 }));
  }
  return true;
}
