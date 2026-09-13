export const DEFAULT_ACTOR_RADIUS = 0.32;

const EPSILON = 1e-9;

export function normalizeVector(vector) {
  if (!vector) return null;
  const length = Math.hypot(vector.x, vector.y);
  if (length <= EPSILON) return null;
  return { x: vector.x / length, y: vector.y / length };
}

function circleTouchesTile(x, y, radius, tileX, tileY) {
  const nearestX = Math.max(tileX - 0.5, Math.min(x, tileX + 0.5));
  const nearestY = Math.max(tileY - 0.5, Math.min(y, tileY + 0.5));
  return ((x - nearestX) ** 2) + ((y - nearestY) ** 2) < (radius ** 2) - EPSILON;
}

export function isPositionPassable(world, x, y, radius = DEFAULT_ACTOR_RADIUS, flying = false) {
  const minX = Math.floor(x - radius - 0.5);
  const maxX = Math.ceil(x + radius + 0.5);
  const minY = Math.floor(y - radius - 0.5);
  const maxY = Math.ceil(y + radius + 0.5);

  for (let tileX = minX; tileX <= maxX; tileX += 1) {
    for (let tileY = minY; tileY <= maxY; tileY += 1) {
      if (!circleTouchesTile(x, y, radius, tileX, tileY)) continue;
      const traversable = flying
        ? world.getTile(tileX, tileY) !== 'void'
        : world.isPassable(tileX, tileY);
      if (!traversable) return false;
    }
  }
  return true;
}

export function overlapsActor(x, y, radius, actor, padding = 0.04) {
  if (!actor || actor.hp <= 0) return false;
  const actorRadius = actor.collisionRadius ?? DEFAULT_ACTOR_RADIUS;
  return Math.hypot(actor.x - x, actor.y - y) < radius + actorRadius + padding;
}

function canOccupy(actor, x, y, world, obstacles) {
  const radius = actor.collisionRadius ?? DEFAULT_ACTOR_RADIUS;
  return isPositionPassable(world, x, y, radius, actor.flying)
    && !obstacles.some((other) => other !== actor && overlapsActor(x, y, radius, other));
}

// Moves in small increments so dashes and slow frames cannot tunnel through a wall.
// If a diagonal is blocked, the two axes are attempted separately to slide along it.
export function moveActor(actor, displacement, world, obstacles = []) {
  const distance = Math.hypot(displacement?.x ?? 0, displacement?.y ?? 0);
  if (distance <= EPSILON) return 0;

  const steps = Math.max(1, Math.ceil(distance / 0.18));
  const stepX = displacement.x / steps;
  const stepY = displacement.y / steps;
  const originX = actor.x;
  const originY = actor.y;

  for (let step = 0; step < steps; step += 1) {
    const diagonalX = actor.x + stepX;
    const diagonalY = actor.y + stepY;
    if (canOccupy(actor, diagonalX, diagonalY, world, obstacles)) {
      actor.x = diagonalX;
      actor.y = diagonalY;
      continue;
    }

    let movedOnAxis = false;
    if (Math.abs(stepX) > EPSILON && canOccupy(actor, actor.x + stepX, actor.y, world, obstacles)) {
      actor.x += stepX;
      movedOnAxis = true;
    }
    if (Math.abs(stepY) > EPSILON && canOccupy(actor, actor.x, actor.y + stepY, world, obstacles)) {
      actor.y += stepY;
      movedOnAxis = true;
    }
    if (!movedOnAxis) break;
  }

  if (Math.abs(actor.x - Math.round(actor.x)) < EPSILON) actor.x = Math.round(actor.x);
  if (Math.abs(actor.y - Math.round(actor.y)) < EPSILON) actor.y = Math.round(actor.y);

  return Math.hypot(actor.x - originX, actor.y - originY);
}
