import test from 'node:test';
import assert from 'node:assert/strict';
import { createActorAbilityContext } from '../src/game/actor-abilities.js';
import { updateProjectiles } from '../src/game/abilities/projectiles.js';
import { getSpell } from '../src/data/spells.js';
import { Game } from '../src/game/game.js';
import { createEnemy } from '../src/game/entities.js';
import { abilityRange, SpellSystem, spellTargeting } from '../src/game/spell-system.js';

function actor(id, team, x, y) {
  return {
    id, team, name: id, x, y, hp: 100, maxHealth: 100, shield: 0,
    burnUntil: 0, nextBurnTick: 0, slowedUntil: 0, stunnedUntil: 0,
  };
}

function stateWith(player, enemies) {
  return {
    player, enemies, effects: [], fields: [], projectiles: [], animations: [], combatNumbers: [],
    world: { getTile: () => 'grass', isPassable: () => true },
    log: () => {},
  };
}

test('the same spell system lets an enemy owner damage the player target', () => {
  const player = actor('player', 'player', 6, 2);
  const caster = actor('caster', 'enemy', 2, 2);
  const state = stateWith(player, [caster]);
  const spell = getSpell(2, 2, 1);
  const context = createActorAbilityContext(state, spell, caster, player, 0, { power: 0.5 });
  const result = new SpellSystem().cast(context);
  assert.equal(result.projectile, true);
  for (let now = 50; now <= 1000; now += 50) updateProjectiles(state, now, 50);
  assert.ok(player.hp < player.maxHealth);
  assert.equal(caster.hp, caster.maxHealth);
});

test('persistent areas retain their owner and team instead of assuming the player', () => {
  const player = actor('player', 'player', 5, 5);
  const caster = actor('caster', 'enemy', 2, 2);
  const state = stateWith(player, [caster]);
  const spell = getSpell(2, 4, 2);
  new SpellSystem().cast(createActorAbilityContext(state, spell, caster, player, 100));
  assert.ok(state.fields.length > 0);
  assert.ok(state.fields.every((field) => field.owner === caster));
  assert.ok(state.fields.every((field) => field.team === 'enemy'));
});

test('enemy ability scheduling creates a visible telegraph before resolution', () => {
  const player = actor('player', 'player', 5, 5);
  const caster = createEnemy({ x: 8, y: 5 }, 1, 'goblin');
  const game = {
    state: { player, enemies: [caster], telegraphs: [], unlocked: true, gameOver: false },
    addLog() {},
  };
  Game.prototype.tickEnemyAbilities.call(game, 100);
  assert.equal(game.state.telegraphs.length, 1);
  assert.equal(game.state.telegraphs[0].owner, caster);
  assert.equal(game.state.telegraphs[0].shape, 'line');
  assert.ok(caster.pendingAbility.resolvesAt > 100);
});

test('pre-aim metadata distinguishes trajectory, area and actual range', () => {
  const fireball = getSpell(2, 2, 1);
  const blast = getSpell(1, 2, 1);
  const cutter = getSpell(3, 3, 2);
  assert.equal(spellTargeting(fireball), 'line');
  assert.equal(spellTargeting(blast), 'area');
  assert.ok(abilityRange(cutter) > abilityRange(fireball));
});

test('actor spell range bonuses expand actual targeting range', () => {
  const fireball = getSpell(2, 2, 1);
  assert.equal(abilityRange(fireball, { spellRangeBonus: 0.5 }), abilityRange(fireball) * 1.5);
});
