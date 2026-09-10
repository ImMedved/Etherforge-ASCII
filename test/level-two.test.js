import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_SPELLS, getSpell } from '../src/data/spells.js';
import { clampTarget } from '../src/game/spell-system.js';
import { applyLevelTwoMechanics, LEVEL_TWO_SPELLS, levelTwoImmediateDamageMultiplier } from '../src/game/abilities/level-two-abilities.js';
import { addLevelTwoImpactVisuals } from '../src/game/abilities/level-two-visuals.js';

test('all generic spell targets receive the 50 percent range increase', () => {
  assert.deepEqual(clampTarget({ x: 0, y: 0 }, { x: 20, y: 0 }), { x: 20, y: 0 });
  assert.deepEqual(clampTarget({ x: 0, y: 0 }, { x: 30, y: 0 }), { x: 21, y: 0 });
});

test('every second-level spell has a dedicated multi-stage animation', () => {
  const catalog = BASE_SPELLS.filter((spell) => spell.level === 2).map((spell) => spell.name).sort();
  assert.deepEqual([...LEVEL_TWO_SPELLS].sort(), catalog);
  for (const spellName of LEVEL_TWO_SPELLS) {
    const state = { effects: [] };
    assert.equal(addLevelTwoImpactVisuals(state, spellName, { x: 5, y: 5 }, 0), true);
    assert.ok(state.effects.length >= 2, spellName);
  }
});

test('bubble defers damage while shields are non-damaging', () => {
  assert.equal(levelTwoImmediateDamageMultiplier('Пузырь'), 0);
  assert.equal(levelTwoImmediateDamageMultiplier('Линза'), 0);
  assert.equal(levelTwoImmediateDamageMultiplier('Грязевой щит'), 0);
  const enemy = { stunnedUntil: 0 };
  const state = { player: { shield: 0 }, fields: [] };
  applyLevelTwoMechanics(state, getSpell(1, 3, 2), [enemy], { x: 4, y: 4 }, 100);
  assert.ok(enemy.stunnedUntil > 100);
  assert.equal(state.fields[0].remainingTicks, 1);
  assert.ok(state.fields[0].nextTick > 100);
});
