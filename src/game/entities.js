let enemySerial = 0;

export const ENEMY_ARCHETYPES = Object.freeze({
  wolf: Object.freeze({ id: 'wolf', name: 'Дикий волк', maxHealth: 30, moveInterval: 220, damage: 2, attackInterval: 800, visionRange: 28 }),
  goblin: Object.freeze({ id: 'goblin', name: 'Гоблин-разведчик', maxHealth: 46, moveInterval: 360, damage: 4, attackInterval: 1100, visionRange: 24 }),
  orc: Object.freeze({ id: 'orc', name: 'Орк-налётчик', maxHealth: 78, moveInterval: 620, damage: 7, attackInterval: 1650, visionRange: 22 }),
  ghost: Object.freeze({ id: 'ghost', name: 'Блуждающий призрак', maxHealth: 38, moveInterval: 280, damage: 3, attackInterval: 950, visionRange: 30, flying: true }),
});

const ENEMY_TYPE_ORDER = ['wolf', 'goblin', 'orc', 'ghost'];

export function createEnemy(position, threat = 1, requestedType = null) {
  enemySerial += 1;
  const type = requestedType ?? ENEMY_TYPE_ORDER[(enemySerial - 1) % ENEMY_TYPE_ORDER.length];
  const archetype = ENEMY_ARCHETYPES[type] ?? ENEMY_ARCHETYPES.goblin;
  const maxHealth = archetype.maxHealth + Math.min(Math.max(0, threat - 1), 8) * 2;
  return {
    id: `enemy-${enemySerial}`,
    type: archetype.id,
    name: archetype.name,
    x: position.x,
    y: position.y,
    hp: maxHealth,
    maxHealth,
    moveInterval: archetype.moveInterval,
    damage: archetype.damage,
    attackInterval: archetype.attackInterval,
    visionRange: archetype.visionRange,
    flying: archetype.flying ?? false,
    burnUntil: 0,
    nextBurnTick: 0,
    slowedUntil: 0,
    stunnedUntil: 0,
    nextMoveAt: 0,
    nextAttackAt: 0,
  };
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointsOnLine(from, to) {
  const points = [];
  let x0 = Math.round(from.x);
  let y0 = Math.round(from.y);
  const x1 = Math.round(to.x);
  const y1 = Math.round(to.y);
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;

  while (true) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    const doubled = 2 * error;
    if (doubled >= dy) {
      error += dy;
      x0 += sx;
    }
    if (doubled <= dx) {
      error += dx;
      y0 += sy;
    }
  }
  return points;
}
