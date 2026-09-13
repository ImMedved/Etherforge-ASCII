import {
  PLAYER_MAX_HEALTH,
  PLAYER_MAX_MANA,
  PLAYER_MANA_REGEN,
  PLAYER_MOVE_SPEED
} from '../config.js';

export const STAT_DEFINITIONS = Object.freeze([
  { id: 'maxHealth', name: 'Максимум здоровья', group: 'resources', format: 'number' },
  { id: 'healthRegen', name: 'Восстановление здоровья', group: 'resources', format: 'decimal' },
  { id: 'maxMana', name: 'Максимум маны', group: 'resources', format: 'number' },
  { id: 'manaRegen', name: 'Восстановление маны', group: 'resources', format: 'decimal' },
  { id: 'shieldPower', name: 'Сила щита', group: 'resources', format: 'percent' },
  { id: 'healingPower', name: 'Сила лечения', group: 'resources', format: 'percent' },
  { id: 'armor', name: 'Броня', group: 'defense', format: 'number' },
  { id: 'evasion', name: 'Уклонение', group: 'defense', format: 'percent' },
  { id: 'blockChance', name: 'Шанс блока', group: 'defense', format: 'percent' },
  { id: 'fireResist', name: 'Сопротивление огню', group: 'defense', format: 'percent' },
  { id: 'waterResist', name: 'Сопротивление воде', group: 'defense', format: 'percent' },
  { id: 'airResist', name: 'Сопротивление воздуху', group: 'defense', format: 'percent' },
  { id: 'earthResist', name: 'Сопротивление земле', group: 'defense', format: 'percent' },
  { id: 'damage', name: 'Урон заклинаний', group: 'offense', format: 'number' },
  { id: 'critChance', name: 'Шанс критического удара', group: 'offense', format: 'percent' },
  { id: 'critDamage', name: 'Критический урон', group: 'offense', format: 'percent' },
  { id: 'castSpeed', name: 'Скорость сотворения', group: 'offense', format: 'percent' },
  { id: 'projectileSpeed', name: 'Скорость снарядов', group: 'offense', format: 'percent' },
  { id: 'spellRange', name: 'Дальность заклинаний', group: 'offense', format: 'percent' },
  { id: 'areaSize', name: 'Область действия', group: 'offense', format: 'percent' },
  { id: 'effectDuration', name: 'Длительность эффектов', group: 'offense', format: 'percent' },
  { id: 'airDamage', name: 'Урон воздухом', group: 'elements', format: 'percent' },
  { id: 'fireDamage', name: 'Урон огнём', group: 'elements', format: 'percent' },
  { id: 'waterDamage', name: 'Урон водой', group: 'elements', format: 'percent' },
  { id: 'earthDamage', name: 'Урон землёй', group: 'elements', format: 'percent' },
  { id: 'moveSpeed', name: 'Скорость движения', group: 'utility', format: 'decimal' },
  { id: 'dashCooldown', name: 'Восстановление рывка', group: 'utility', format: 'percent' },
  { id: 'cooldownRecovery', name: 'Восстановление заклинаний', group: 'utility', format: 'percent' },
  { id: 'lootRadius', name: 'Радиус сбора', group: 'utility', format: 'percent' },
  { id: 'magicFind', name: 'Поиск магических предметов', group: 'utility', format: 'percent' },
  { id: 'goldFind', name: 'Поиск золота', group: 'utility', format: 'percent' }
]);

export const BASE_CHARACTER_STATS = Object.freeze({
  maxHealth: PLAYER_MAX_HEALTH,
  healthRegen: 0,
  maxMana: PLAYER_MAX_MANA,
  manaRegen: PLAYER_MANA_REGEN,
  shieldPower: 0,
  healingPower: 0,
  armor: 0,
  evasion: 0.05,
  blockChance: 0,
  fireResist: 0,
  waterResist: 0,
  airResist: 0,
  earthResist: 0,
  damage: 0,
  critChance: 0.05,
  critDamage: 0.5,
  castSpeed: 0,
  projectileSpeed: 0,
  spellRange: 0,
  areaSize: 0,
  effectDuration: 0,
  airDamage: 0,
  fireDamage: 0,
  waterDamage: 0,
  earthDamage: 0,
  moveSpeed: PLAYER_MOVE_SPEED,
  dashCooldown: 0,
  cooldownRecovery: 0,
  lootRadius: 0,
  magicFind: 0,
  goldFind: 0
});

export function calculateCharacterStats(equipmentBonuses = {}, sphereLevels = {}, overrides = {}) {
  const stats = { ...BASE_CHARACTER_STATS };
  for (const [stat, value] of Object.entries(equipmentBonuses)) {
    if (Object.hasOwn(stats, stat)) stats[stat] += value;
  }
  stats.airDamage += (sphereLevels.air || 0) * 0.04;
  stats.fireDamage += (sphereLevels.fire || 0) * 0.04;
  stats.waterDamage += (sphereLevels.water || 0) * 0.04;
  stats.earthDamage += (sphereLevels.earth || 0) * 0.04;
  for (const [stat, value] of Object.entries(overrides)) {
    if (Object.hasOwn(stats, stat) && Number.isFinite(value)) stats[stat] = value;
  }
  return stats;
}

export function applyCharacterStats(player, stats) {
  const healthRatio = player.maxHealth > 0 ? player.hp / player.maxHealth : 1;
  const manaRatio = player.maxMana > 0 ? player.mana / player.maxMana : 1;
  player.maxHealth = stats.maxHealth;
  player.maxMana = stats.maxMana;
  player.hp = Math.min(player.maxHealth, Math.max(1, player.maxHealth * healthRatio));
  player.mana = Math.min(player.maxMana, Math.max(0, player.maxMana * manaRatio));
  player.manaRegen = stats.manaRegen;
  player.moveSpeed = stats.moveSpeed;
  player.healthRegen = stats.healthRegen;
  player.armor = stats.armor;
  player.evasion = stats.evasion;
  player.blockChance = stats.blockChance;
  player.fireResist = stats.fireResist;
  player.waterResist = stats.waterResist;
  player.airResist = stats.airResist;
  player.earthResist = stats.earthResist;
  player.cooldownRecovery = stats.cooldownRecovery;
  player.dashCooldownRecovery = stats.dashCooldown;
  player.healingPower = stats.healingPower;
  player.shieldPower = stats.shieldPower;
  player.projectileSpeedBonus = stats.projectileSpeed;
  player.spellRangeBonus = stats.spellRange;
  player.areaSizeBonus = stats.areaSize;
  player.effectDurationBonus = stats.effectDuration;
  player.characterStats = stats;
  return player;
}

export function formatStatValue(definition, value) {
  if (definition.format === 'percent') return Math.round(value * 100) + '%';
  if (definition.format === 'decimal') return Number(value).toFixed(1);
  return String(Math.round(value));
}
