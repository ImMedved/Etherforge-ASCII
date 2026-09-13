import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EQUIPMENT_SLOTS,
  RARITIES,
  createEmptyEquipment,
  equipItem,
  equipmentBonuses,
  generateItem
} from '../src/game/items.js';
import {
  STAT_DEFINITIONS,
  calculateCharacterStats
} from '../src/game/character-stats.js';

test('equipment foundation exposes eight slots and six rarity tiers', () => {
  assert.equal(EQUIPMENT_SLOTS.length, 8);
  assert.deepEqual(Object.keys(RARITIES), ['normal', 'magic', 'rare', 'epic', 'legendary', 'unique']);
  assert.equal(Object.keys(createEmptyEquipment()).length, 8);
});

test('generated equipment can be equipped and contributes character stats', () => {
  const equipment = createEmptyEquipment();
  const item = generateItem({ slot: 'staff', rarity: 'rare', power: 2, random: () => 0.25 });
  assert.equal(item.slot, 'staff');
  assert.ok(Object.keys(item.modifiers).length >= 2);
  assert.equal(equipItem(equipment, item).equipped, true);
  const bonuses = equipmentBonuses(equipment);
  const stats = calculateCharacterStats(bonuses, { air: 2, fire: 0, water: 0, earth: 0 });
  assert.ok(stats.airDamage >= 0.08);
  assert.ok(stats.damage > 0);
});

test('character sheet contains more than twenty-five actual statistics and no character level', () => {
  assert.ok(STAT_DEFINITIONS.length > 25);
  assert.equal(STAT_DEFINITIONS.some((stat) => stat.id === 'level'), false);
});
