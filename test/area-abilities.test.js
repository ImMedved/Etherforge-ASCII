import test from 'node:test';
import assert from 'node:assert/strict';
import { abilityTarget, applyAreaAbilityMechanics } from '../src/game/abilities/area-abilities.js';

test('orbiting water spells are centered on the wizard', () => {
  const target = abilityTarget({ name: 'Водяная сфера' }, { x: 4, y: 7 }, { x: 20, y: 20 });
  assert.deepEqual(target, { x: 4, y: 7 });
});

test('vortex spells pull targets and control spells stun them', () => {
  const enemy = { x: 8, y: 5, stunnedUntil: 0 };
  const state = { world: { isPassable: () => true } };
  applyAreaAbilityMechanics(state, { name: 'Торнадо', level: 4 }, [enemy], { x: 5, y: 5 }, 100);
  assert.equal(enemy.x, 6);
  applyAreaAbilityMechanics(state, { name: 'Резонанс', level: 4 }, [enemy], { x: 5, y: 5 }, 100);
  assert.equal(enemy.stunnedUntil, 1320);
});

test('control effects keep fractional coordinates in the real-time movement model', () => {
  const enemy = { x: 8.35, y: 5.2, stunnedUntil: 0 };
  const state = { world: { isPassable: () => true } };
  const before = Math.hypot(enemy.x - 5.1, enemy.y - 5.05);
  applyAreaAbilityMechanics(state, { name: 'Торнадо', level: 4 }, [enemy], { x: 5.1, y: 5.05 }, 100);
  assert.ok(Math.hypot(enemy.x - 5.1, enemy.y - 5.05) < before);
  assert.equal(Number.isInteger(enemy.x) && Number.isInteger(enemy.y), false);
});
