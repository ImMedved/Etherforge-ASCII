import test from 'node:test';
import assert from 'node:assert/strict';
import { getSpell } from '../src/data/spells.js';
import { SpellSystem } from '../src/game/spell-system.js';
import { updateProjectiles } from '../src/game/abilities/projectiles.js';
import { PROJECTILE_SPELL_NAMES } from '../src/game/abilities/projectile-abilities.js';
import { BASE_SPELLS } from '../src/data/spells.js';
import { spawnProjectile } from '../src/game/abilities/projectiles.js';

function enemy(id, x, y) {
  return {
    id, x, y, hp: 50, maxHealth: 50,
    burnUntil: 0, nextBurnTick: 0, slowedUntil: 0, stunnedUntil: 0,
  };
}

function projectileState(enemies) {
  return {
    player: { x: 2, y: 2, visualX: 2, visualY: 2, shield: 0 },
    enemies,
    projectiles: [],
    effects: [],
    fields: [],
    world: { isPassable: () => true },
    log: () => {},
  };
}

test('fireball exists as a moving projectile and damages on collision', () => {
  const target = enemy('target', 6, 2);
  const state = projectileState([target]);
  const result = new SpellSystem().cast(state, getSpell(2, 2, 1), target, 0);
  assert.equal(result.projectile, true);
  assert.equal(state.projectiles.length, 1);
  for (let now = 50; now <= 900; now += 50) updateProjectiles(state, now, 50);
  assert.equal(target.hp, 29);
  assert.ok(target.burnUntil > 0);
  assert.equal(state.projectiles.length, 0);
});

test('water cutter pierces multiple targets', () => {
  const first = enemy('first', 5, 2);
  const second = enemy('second', 8, 2);
  const state = projectileState([first, second]);
  new SpellSystem().cast(state, getSpell(3, 3, 2), second, 0);
  for (let now = 50; now <= 1100; now += 50) updateProjectiles(state, now, 50);
  assert.ok(first.hp < 50);
  assert.ok(second.hp < 50);
});

test('every dedicated projectile profile belongs to the base spell book', () => {
  const baseNames = new Set(BASE_SPELLS.map((spell) => spell.name));
  assert.equal(PROJECTILE_SPELL_NAMES.length, 17);
  for (const name of PROJECTILE_SPELL_NAMES) assert.ok(baseNames.has(name), name);
});

test('fast projectiles hit enemies crossed between two frames', () => {
  const target = enemy('swept-target', 5, 2);
  const state = projectileState([target]);
  spawnProjectile(state, { x: 2, y: 2 }, { x: 12, y: 2 }, {
    speed: 100, range: 20, damage: 10, level: 1,
    elements: getSpell(2, 2, 1).elements, glyph: '*', color: 'fire',
  }, 0);
  updateProjectiles(state, 50, 50);
  assert.equal(target.hp, 40);
});

test('fireball explosion damages the full visible impact ring', () => {
  const direct = enemy('direct', 6, 2);
  const edge = enemy('edge', 6, 4.2);
  const state = projectileState([direct, edge]);
  new SpellSystem().cast(state, getSpell(2, 2, 1), direct, 0);
  for (let now = 50; now <= 1000; now += 50) updateProjectiles(state, now, 50);
  assert.ok(direct.hp < 50);
  assert.ok(edge.hp < 50);
});

test('hydrostrike damages enemies across its six-cell visual collapse', () => {
  const direct = enemy('hydro-direct', 7, 2);
  const edge = enemy('hydro-edge', 7, 7.5);
  const state = projectileState([direct, edge]);
  new SpellSystem().cast(state, getSpell(2, 3, 5), direct, 0);
  for (let now = 50; now <= 1600; now += 50) updateProjectiles(state, now, 50);
  assert.ok(direct.hp < 50);
  assert.ok(edge.hp < 50);
});
