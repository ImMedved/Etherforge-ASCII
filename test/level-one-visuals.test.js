import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_SPELLS } from '../src/data/spells.js';
import { addLevelOneImpactVisuals, LEVEL_ONE_SPELLS } from '../src/game/abilities/level-one-visuals.js';

test('every first-level spell has a dedicated impact animation', () => {
  const catalogNames = BASE_SPELLS.filter((spell) => spell.level === 1).map((spell) => spell.name).sort();
  assert.deepEqual([...LEVEL_ONE_SPELLS].sort(), catalogNames);
  for (const spellName of LEVEL_ONE_SPELLS) {
    const state = { effects: [] };
    assert.equal(addLevelOneImpactVisuals(state, spellName, { x: 4, y: 5 }, 100), true);
    assert.ok(state.effects.length >= 2, spellName);
    assert.ok(new Set(state.effects.flatMap((effect) => effect.points.map((point) => point.color ?? effect.color))).size >= 1);
  }
});
