import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_SPELLS, ORDERED_COMBINATION_COUNT, getSpell } from '../src/data/spells.js';

test('catalog contains every unordered base recipe for five levels', () => {
  assert.equal(BASE_SPELLS.length, 50);
  assert.equal(new Set(BASE_SPELLS.map((spell) => spell.id)).size, 50);
  assert.equal(ORDERED_COMBINATION_COUNT, 80);
});

test('example 1 1 1 casts level-one air plus air', () => {
  const spell = getSpell(1, 1, 1);
  assert.equal(spell.name, 'Порыв');
  assert.equal(spell.level, 1);
  assert.deepEqual(spell.elements.map((element) => element.id), ['air', 'air']);
});

test('the first two spheres are symmetric', () => {
  assert.equal(getSpell(2, 3, 4).name, 'Термический шок');
  assert.equal(getSpell(3, 2, 4).name, 'Термический шок');
});

test('all 80 ordered inputs resolve to a spell', () => {
  for (let level = 1; level <= 5; level += 1) {
    for (let first = 1; first <= 4; first += 1) {
      for (let second = 1; second <= 4; second += 1) {
        assert.ok(getSpell(first, second, level), `missing ${first}${second}${level}`);
      }
    }
  }
});
