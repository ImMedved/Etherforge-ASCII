import test from 'node:test';
import assert from 'node:assert/strict';
import { ABILITY_COOLDOWN_MS, isAbilityReady } from '../src/game/cooldowns.js';

test('all ability casts share a hidden one-second cooldown', () => {
  assert.equal(ABILITY_COOLDOWN_MS, 1000);
  assert.equal(isAbilityReady(-Infinity, 10), true);
  assert.equal(isAbilityReady(500, 1499), false);
  assert.equal(isAbilityReady(500, 1500), true);
});
