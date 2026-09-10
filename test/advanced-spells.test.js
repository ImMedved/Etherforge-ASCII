import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_SPELLS, getSpell } from '../src/data/spells.js';
import { ADVANCED_SPELLS, advancedImmediateDamageMultiplier, applyAdvancedAreaMechanics, reflectedMeleeDamage } from '../src/game/abilities/advanced-abilities.js';
import { ADVANCED_VISUAL_NAMES, addAdvancedImpactVisuals, addAdvancedProjectileImpactVisuals } from '../src/game/abilities/advanced-visuals.js';

const enemy = () => ({ x: 6, y: 5, hp: 100, maxHealth: 100, burnUntil: 0, nextBurnTick: 0, slowedUntil: 0, stunnedUntil: 0 });
const stateWith = (target) => ({
  player: { x: 5, y: 5, hp: 50, maxHealth: 100, shield: 0 },
  enemies: [target], effects: [], fields: [], combatNumbers: [],
  world: { isPassable: () => true },
});

test('every level three through five spell has an advanced visual profile', () => {
  const catalog = BASE_SPELLS.filter((spell) => spell.level >= 3).map((spell) => spell.name).sort();
  assert.deepEqual([...ADVANCED_SPELLS].sort(), catalog);
  assert.deepEqual([...ADVANCED_VISUAL_NAMES].sort(), catalog);
  for (const spellName of catalog) {
    const state = { effects: [] };
    assert.equal(addAdvancedImpactVisuals(state, spellName, { x: 5, y: 5 }, 100), true);
    assert.ok(state.effects.length >= 2, spellName);
  }
});

test('advanced control, vulnerability, healing and reflection mechanics work', () => {
  const target = enemy();
  const state = stateWith(target);
  applyAdvancedAreaMechanics(state, getSpell(1, 3, 3), [target], { x: 5, y: 5 }, 100);
  assert.ok(target.stunnedUntil > 100);
  assert.ok(target.slowedUntil > target.stunnedUntil);

  applyAdvancedAreaMechanics(state, getSpell(2, 4, 3), [target], { x: 5, y: 5 }, 200);
  assert.ok(target.vulnerableUntil > 200);

  applyAdvancedAreaMechanics(state, getSpell(3, 3, 5), [target], { x: 5, y: 5 }, 300);
  assert.ok(state.player.hp > 50);
  assert.equal(state.fields.at(-1).followPlayer, true);

  state.player.reflectUntil = 2000;
  const hpBeforeReflection = target.hp;
  assert.ok(reflectedMeleeDamage(state, target, 10, 400) > 0);
  assert.ok(target.hp < hpBeforeReflection);
  assert.equal(advancedImmediateDamageMultiplier('Воздушное зеркало'), 0);
});

test('large volley animations are emitted once per impact window', () => {
  const state = { effects: [] };
  assert.equal(addAdvancedProjectileImpactVisuals(state, 'Огненный дождь', { x: 1, y: 1 }, 100), true);
  const effectCount = state.effects.length;
  assert.equal(addAdvancedProjectileImpactVisuals(state, 'Огненный дождь', { x: 2, y: 2 }, 200), false);
  assert.equal(state.effects.length, effectCount);
  assert.equal(addAdvancedProjectileImpactVisuals(state, 'Огненный дождь', { x: 3, y: 3 }, 900), true);
});
