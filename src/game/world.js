import { SEA_DEPTH, WORLD_SIZE } from '../config.js';

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const tileKey = (x, y) => `${x},${y}`;

export function createWorld(seed = 9471) {
  const random = mulberry32(seed);
  const blocked = new Set();
  const decorations = [];

  const addDecoration = (type, x, y) => {
    if (x < 1 || y <= SEA_DEPTH + 1 || x >= WORLD_SIZE - 1 || y >= WORLD_SIZE - 1) return;
    const key = tileKey(x, y);
    if (blocked.has(key)) return;
    blocked.add(key);
    decorations.push({ type, x, y });
  };

  for (let x = 0; x < WORLD_SIZE; x += 1) {
    blocked.add(tileKey(x, WORLD_SIZE - 1));
    decorations.push({ type: 'rock', x, y: WORLD_SIZE - 1 });
  }
  for (let y = SEA_DEPTH + 1; y < WORLD_SIZE; y += 1) {
    blocked.add(tileKey(0, y));
    blocked.add(tileKey(WORLD_SIZE - 1, y));
    decorations.push({ type: 'rock', x: 0, y });
    decorations.push({ type: 'rock', x: WORLD_SIZE - 1, y });
  }

  const clearings = [
    { x: 29, y: 32, r: 8 },
    { x: 27, y: 22, r: 5 },
  ];
  const isClearing = (x, y) => clearings.some((spot) => Math.hypot(x - spot.x, y - spot.y) < spot.r);

  for (let i = 0; i < 68; i += 1) {
    const x = 4 + Math.floor(random() * (WORLD_SIZE - 8));
    const y = SEA_DEPTH + 5 + Math.floor(random() * (WORLD_SIZE - SEA_DEPTH - 11));
    if (!isClearing(x, y)) addDecoration(i < 14 ? 'tree' : 'rock', x, y);
  }

  const spheres = [
    { key: 1, elementId: 'air', name: 'Голубая сфера', color: 'air', x: 25, y: 22, active: true },
    { key: 2, elementId: 'fire', name: 'Красная сфера', color: 'fire', x: 34, y: 30, active: true },
    { key: 3, elementId: 'water', name: 'Синяя сфера', color: 'water', x: 24, y: 34, active: true },
    { key: 4, elementId: 'earth', name: 'Зелёная сфера', color: 'earth', x: 30, y: 26, active: true },
  ];

  const world = {
    size: WORLD_SIZE,
    seaDepth: SEA_DEPTH,
    blocked,
    decorations,
    spheres,
    getTile(x, y) {
      if (x < 0 || y < 0 || x >= WORLD_SIZE || y >= WORLD_SIZE) return 'void';
      if (y < SEA_DEPTH) return 'water';
      if (y < SEA_DEPTH + 3) return 'sand';
      return 'grass';
    },
    isPassable(x, y) {
      return Number.isInteger(x)
        && Number.isInteger(y)
        && this.getTile(x, y) !== 'water'
        && this.getTile(x, y) !== 'void'
        && !blocked.has(tileKey(x, y));
    },
    findSpawn(excluded = [], minDistance = 7, maxDistance = null) {
      const points = excluded.filter(Boolean);
      for (let attempt = 0; attempt < 500; attempt += 1) {
        const anchor = points[0];
        const x = maxDistance && anchor
          ? Math.round(anchor.x - maxDistance + random() * maxDistance * 2)
          : 2 + Math.floor(random() * (WORLD_SIZE - 4));
        const y = maxDistance && anchor
          ? Math.round(anchor.y - maxDistance + random() * maxDistance * 2)
          : SEA_DEPTH + 3 + Math.floor(random() * (WORLD_SIZE - SEA_DEPTH - 5));
        const farEnough = points.every((point) => Math.hypot(point.x - x, point.y - y) >= minDistance);
        const closeEnough = !maxDistance || !anchor || Math.hypot(anchor.x - x, anchor.y - y) <= maxDistance;
        const sphereFree = !this.spheres.some((sphere) => sphere.active && sphere.x === x && sphere.y === y);
        if (this.isPassable(x, y) && farEnough && closeEnough && sphereFree) {
          return { x, y };
        }
      }
      return { x: 10, y: 14 };
    },
    respawnSphere(sphere, excluded = []) {
      const otherSpheres = this.spheres.filter((other) => other !== sphere && other.active);
      const position = this.findSpawn([...excluded, ...otherSpheres], 5);
      sphere.x = position.x;
      sphere.y = position.y;
      sphere.active = true;
      return position;
    },
  };

  return world;
}
