import { SEA_DEPTH, WORLD_SIZE } from '../config.js';
import { PROLOGUE_HOUSES, PROLOGUE_VILLAGES } from '../data/prologue.js';

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
    { x: 16, y: 14, r: 7 },
    { x: PROLOGUE_VILLAGES.portVillage.center.x, y: PROLOGUE_VILLAGES.portVillage.center.y, r: 12 },
    { x: PROLOGUE_VILLAGES.undeadVillage.center.x, y: PROLOGUE_VILLAGES.undeadVillage.center.y, r: 17 },
    { x: 23, y: 20, r: 5 },
  ];
  const isClearing = (x, y) => clearings.some((spot) => Math.hypot(x - spot.x, y - spot.y) < spot.r);

  for (let i = 0; i < 68; i += 1) {
    const x = 4 + Math.floor(random() * (WORLD_SIZE - 8));
    const y = SEA_DEPTH + 5 + Math.floor(random() * (WORLD_SIZE - SEA_DEPTH - 11));
    if (!isClearing(x, y)) addDecoration(i < 14 ? 'tree' : 'rock', x, y);
  }

  const spheres = [
    { key: 1, elementId: 'air', name: 'Сфера Воздуха', color: 'air', x: 23, y: 20, active: true, story: true },
    { key: 2, elementId: 'fire', name: 'Сфера Огня', color: 'fire', x: 90, y: 60, active: false, story: true },
    { key: 3, elementId: 'water', name: 'Синяя сфера', color: 'water', x: 24, y: 34, active: false },
    { key: 4, elementId: 'earth', name: 'Зелёная сфера', color: 'earth', x: 29, y: 26, active: false },
  ];
  const villages = Object.values(PROLOGUE_VILLAGES);
  const hub = { id: 'port-village', name: 'Сигнальный костёр Тихой Пристани', ...PROLOGUE_VILLAGES.portVillage.center };
  const houses = PROLOGUE_HOUSES.map((house) => ({
    ...house,
    halfWidth: 4,
    halfHeight: 3,
    door: { x: house.x, y: house.y + 3 }
  }));
  const landmarks = [
    { id: 'expedition-ship', type: 'ship', name: 'Корабль экспедиции', x: 12, y: 10 },
    { id: 'port-square', type: 'square', name: 'Площадь Тихой Пристани', ...PROLOGUE_VILLAGES.portVillage.center },
    { id: 'undead-outskirts', type: 'marker', name: 'Окраины Мёртвой Лощины', x: 66, y: 58 },
    { id: 'undead-square', type: 'square', name: 'Площадь Мёртвой Лощины', x: 76, y: 64 },
    { id: 'cemetery', type: 'cemetery', name: 'Старое кладбище', x: 84, y: 70 },
    { id: 'lich-tower', type: 'tower', name: 'Башня лича', x: 90, y: 60 }
  ];
  const chests = PROLOGUE_HOUSES.map((house) => ({
    id: 'cache-' + house.id,
    houseId: house.id,
    name: 'Сундук: ' + house.name,
    x: house.x + 1,
    y: house.y,
    active: false,
    opened: false
  }));

  const world = {
    size: WORLD_SIZE,
    seaDepth: SEA_DEPTH,
    blocked,
    decorations,
    spheres,
    villages,
    hub,
    houses,
    landmarks,
    chests,
    getTile(x, y) {
      if (x < 0 || y < 0 || x >= WORLD_SIZE || y >= WORLD_SIZE) return 'void';
      if (y < SEA_DEPTH) return 'water';
      if (y < SEA_DEPTH + 3) return 'sand';
      return 'grass';
    },
    isPassable(x, y) {
      const blockedByHouse = houses.some((house) => {
        const localX = x - house.x;
        const localY = y - house.y;
        const onVerticalWall = Math.abs(localX) === house.halfWidth && Math.abs(localY) <= house.halfHeight;
        const onHorizontalWall = Math.abs(localY) === house.halfHeight && Math.abs(localX) <= house.halfWidth;
        const isDoor = x === house.door.x && y === house.door.y;
        return (onVerticalWall || onHorizontalWall) && !isDoor;
      });
      return Number.isInteger(x)
        && Number.isInteger(y)
        && this.getTile(x, y) !== 'water'
        && this.getTile(x, y) !== 'void'
        && !blocked.has(tileKey(x, y))
        && !blockedByHouse;
    },
    houseAt(point) {
      return houses.find((house) =>
        Math.abs(point.x - house.x) < house.halfWidth
        && Math.abs(point.y - house.y) < house.halfHeight) || null;
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
        const objectFree = !this.chests.some((chest) => chest.x === x && chest.y === y);
        if (this.isPassable(x, y) && farEnough && closeEnough && sphereFree && objectFree) {
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
