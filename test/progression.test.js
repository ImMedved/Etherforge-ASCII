import test from 'node:test';
import assert from 'node:assert/strict';
import { canCastFormula, maxSpellLevel } from '../src/game/progression.js';

test('spell level is limited by the weaker selected sphere', () => {
  const levels = { air: 5, fire: 2, water: 0, earth: 3 };
  assert.equal(maxSpellLevel(levels, 1, 2), 2);
  assert.equal(maxSpellLevel(levels, 4, 4), 3);
  assert.equal(maxSpellLevel(levels, 1, 3), 0);
});

test('locked spell levels cannot be cast', () => {
  const levels = { air: 4, fire: 2, water: 1, earth: 0 };
  assert.equal(canCastFormula(levels, 1, 2, 2), true);
  assert.equal(canCastFormula(levels, 1, 2, 3), false);
  assert.equal(canCastFormula(levels, 1, 4, 1), false);
});
