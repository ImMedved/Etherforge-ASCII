import test from 'node:test';
import assert from 'node:assert/strict';
import { damageEntity, healEntity } from '../src/game/combat-feedback.js';

test('damage and healing create correctly colored floating numbers', () => {
  const state = { combatNumbers: [] };
  const target = { x: 4, y: 7, hp: 20, maxHealth: 30 };
  assert.equal(damageEntity(state, target, 6, 100), 6);
  assert.equal(state.combatNumbers[0].text, '-6');
  assert.equal(state.combatNumbers[0].color, 'damage');
  assert.equal(healEntity(state, target, 4, 200), 4);
  assert.equal(state.combatNumbers[1].text, '+4');
  assert.equal(state.combatNumbers[1].color, 'heal');
  assert.equal(target.hp, 18);
});

test('combat numbers show actual damage and healing without overkill', () => {
  const state = { combatNumbers: [] };
  const target = { x: 0, y: 0, hp: 3, maxHealth: 10 };
  assert.equal(damageEntity(state, target, 50, 0), 3);
  assert.equal(target.hp, 0);
  assert.equal(healEntity(state, target, 50, 10), 10);
  assert.equal(target.hp, 10);
});
