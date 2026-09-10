import test from 'node:test';
import assert from 'node:assert/strict';
import { getSpell } from '../src/data/spells.js';
import { SpellSystem } from '../src/game/spell-system.js';

function makeState(enemy) {
  return {
    player: { x: 2, y: 2, shield: 0 },
    enemies: [enemy],
    effects: [],
    fields: [],
    world: { isPassable: () => true },
    log: () => {},
  };
}

test('a fifth-level offensive spell can defeat a test enemy', () => {
  const enemy = { x: 5, y: 5, hp: 40, burnUntil: 0, nextBurnTick: 0, slowedUntil: 0, stunnedUntil: 0 };
  const state = makeState(enemy);
  new SpellSystem().cast(state, getSpell(2, 2, 5), enemy, 1000);
  assert.ok(enemy.hp <= 0);
  assert.ok(state.effects.length >= 4);
});

test('element traits reuse status logic and persistent fields', () => {
  const enemy = { x: 5, y: 5, hp: 100, burnUntil: 0, nextBurnTick: 0, slowedUntil: 0, stunnedUntil: 0 };
  const state = makeState(enemy);
  new SpellSystem().cast(state, getSpell(2, 4, 2), enemy, 1000);
  assert.ok(enemy.burnUntil > 1000);
  assert.ok(enemy.stunnedUntil > 1000);
  assert.equal(state.fields.length, 1);
});
