export const EQUIPMENT_SLOTS = Object.freeze([
  { id: 'staff', name: 'Посох' },
  { id: 'head', name: 'Голова' },
  { id: 'body', name: 'Корпус' },
  { id: 'hands', name: 'Руки' },
  { id: 'legs', name: 'Ноги' },
  { id: 'boots', name: 'Ботинки' },
  { id: 'amulet', name: 'Амулет' },
  { id: 'ring', name: 'Кольцо' }
]);

export const RARITIES = Object.freeze({
  normal: { name: 'Обычный', color: '#c9d1d9', affixes: 0, weight: 42 },
  magic: { name: 'Магический', color: '#6cb6ff', affixes: 1, weight: 28 },
  rare: { name: 'Редкий', color: '#f1e05a', affixes: 2, weight: 17 },
  epic: { name: 'Эпический', color: '#c77dff', affixes: 3, weight: 8 },
  legendary: { name: 'Легендарный', color: '#ff9d3d', affixes: 4, weight: 4 },
  unique: { name: 'Уникальный', color: '#ff5d73', affixes: 5, weight: 1 }
});

const BASES = Object.freeze({
  staff: ['Ясеневый посох', 'Фокусирующий жезл'],
  head: ['Капюшон странника', 'Рунный венец'],
  body: ['Полевое облачение', 'Мантия эфира'],
  hands: ['Перчатки чародея', 'Боевые наручи'],
  legs: ['Походные поножи', 'Штаны заклинателя'],
  boots: ['Сапоги следопыта', 'Эфирные ботинки'],
  amulet: ['Медный талисман', 'Подвеска сфер'],
  ring: ['Кольцо ученика', 'Печатка кузни']
});

const PREFIXES = ['Точный', 'Стойкий', 'Быстрый', 'Пылающий', 'Насыщенный', 'Закалённый'];
const SUFFIXES = ['сосредоточения', 'преграды', 'потока', 'искр', 'ветров', 'странника'];

const BASE_MODIFIERS = Object.freeze({
  staff: { damage: 3 },
  head: { maxMana: 6 },
  body: { armor: 2, maxHealth: 6 },
  hands: { castSpeed: 0.03 },
  legs: { armor: 1, maxHealth: 4 },
  boots: { moveSpeed: 0.05 },
  amulet: { manaRegen: 0.25 },
  ring: { critChance: 0.015 }
});

const AFFIXES = Object.freeze([
  { stat: 'damage', min: 2, max: 6, slots: ['staff', 'amulet', 'ring'] },
  { stat: 'maxHealth', min: 6, max: 18, slots: ['head', 'body', 'hands', 'legs', 'boots', 'amulet', 'ring'] },
  { stat: 'maxMana', min: 5, max: 15, slots: ['staff', 'head', 'body', 'amulet', 'ring'] },
  { stat: 'armor', min: 1, max: 5, slots: ['head', 'body', 'hands', 'legs', 'boots'] },
  { stat: 'moveSpeed', min: 0.03, max: 0.12, slots: ['boots', 'legs', 'amulet'] },
  { stat: 'manaRegen', min: 0.3, max: 1.2, slots: ['staff', 'head', 'amulet', 'ring'] },
  { stat: 'cooldownRecovery', min: 0.02, max: 0.08, slots: ['staff', 'hands', 'amulet', 'ring'] },
  { stat: 'critChance', min: 0.01, max: 0.05, slots: ['staff', 'hands', 'amulet', 'ring'] },
  { stat: 'evasion', min: 0.01, max: 0.05, slots: ['head', 'body', 'legs', 'boots'] },
  { stat: 'fireResist', min: 0.02, max: 0.09, slots: ['head', 'body', 'hands', 'legs', 'boots', 'amulet', 'ring'] },
  { stat: 'airDamage', min: 0.03, max: 0.12, slots: ['staff', 'amulet', 'ring'] },
  { stat: 'fireDamage', min: 0.03, max: 0.12, slots: ['staff', 'amulet', 'ring'] }
]);

let nextItemId = 1;

function between(random, min, max) {
  return min + (max - min) * random();
}

function choose(random, values) {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))];
}

function rollRarity(random) {
  const entries = Object.entries(RARITIES);
  const total = entries.reduce((sum, [, rarity]) => sum + rarity.weight, 0);
  let roll = random() * total;
  for (const [id, rarity] of entries) {
    roll -= rarity.weight;
    if (roll <= 0) return id;
  }
  return 'normal';
}

export function createEmptyEquipment() {
  return Object.fromEntries(EQUIPMENT_SLOTS.map((slot) => [slot.id, null]));
}

export function generateItem({ slot, rarity, power = 1, random = Math.random } = {}) {
  const slotId = slot || choose(random, EQUIPMENT_SLOTS).id;
  const rarityId = rarity && RARITIES[rarity] ? rarity : rollRarity(random);
  const rarityData = RARITIES[rarityId];
  const available = AFFIXES.filter((affix) => affix.slots.includes(slotId));
  const modifiers = Object.fromEntries(Object.entries(BASE_MODIFIERS[slotId] || {}).map(([stat, value]) => [
    stat,
    Number((value * Math.max(1, power)).toFixed(3))
  ]));
  const remaining = [...available];

  for (let index = 0; index < rarityData.affixes && remaining.length; index += 1) {
    const pickedIndex = Math.floor(random() * remaining.length);
    const affix = remaining.splice(pickedIndex, 1)[0];
    const raw = between(random, affix.min, affix.max) * Math.max(1, power);
    modifiers[affix.stat] = Number((raw < 1 ? raw : Math.round(raw)).toFixed(3));
  }

  const baseName = choose(random, BASES[slotId] || ['Неизвестный предмет']);
  const prefix = rarityData.affixes >= 1 ? choose(random, PREFIXES) : '';
  const suffix = rarityData.affixes >= 3 ? ' ' + choose(random, SUFFIXES) : '';
  const uniqueName = rarityId === 'unique'
    ? 'Реликвия: ' + baseName
    : (prefix + ' ' + baseName + suffix).trim();

  return {
    id: 'item-' + nextItemId++,
    slot: slotId,
    rarity: rarityId,
    name: uniqueName,
    power,
    modifiers
  };
}

export function equipmentBonuses(equipment) {
  const total = {};
  for (const item of Object.values(equipment)) {
    if (!item) continue;
    for (const [stat, value] of Object.entries(item.modifiers)) {
      total[stat] = (total[stat] || 0) + value;
    }
  }
  return total;
}

export function equipItem(equipment, item) {
  if (!item || !Object.hasOwn(equipment, item.slot)) return { equipped: false, replaced: null };
  const replaced = equipment[item.slot];
  equipment[item.slot] = item;
  return { equipped: true, replaced };
}

export function compareItems(candidate, equipped) {
  const stats = new Set([
    ...Object.keys(candidate?.modifiers || {}),
    ...Object.keys(equipped?.modifiers || {})
  ]);
  return Object.fromEntries(
    [...stats].map((stat) => [
      stat,
      Number(((candidate?.modifiers?.[stat] || 0) - (equipped?.modifiers?.[stat] || 0)).toFixed(3))
    ])
  );
}
