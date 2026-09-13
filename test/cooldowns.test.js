import test from 'node:test';
import assert from 'node:assert/strict';
import { abilityAvailability, commitAbilityCost, cooldownRemaining, isAbilityReady } from '../src/game/cooldowns.js';
import { getSpell } from '../src/data/spells.js';

test('spells consume mana and use their own visible cooldowns', () => {
  const actor = { mana: 100, cooldowns: {} };
  const fireball = getSpell(2, 2, 1);
  const hydrostrike = getSpell(2, 3, 5);
  assert.notEqual(fireball.cooldownMs, hydrostrike.cooldownMs);
  assert.equal(isAbilityReady(actor, fireball, 500), true);
  assert.equal(commitAbilityCost(actor, fireball, 500).ready, true);
  assert.equal(actor.mana, 100 - fireball.manaCost);
  assert.equal(cooldownRemaining(actor, fireball, 500), fireball.cooldownMs);
  assert.equal(isAbilityReady(actor, fireball, 500), false);
  assert.equal(isAbilityReady(actor, hydrostrike, 500), true);
  actor.mana = 0;
  assert.equal(abilityAvailability(actor, hydrostrike, 500).reason, 'mana');
});

test('cooldown recovery shortens ability cooldowns', () => {
  const actor = { mana: 100, cooldowns: {}, cooldownRecovery: 0.25 };
  const spell = getSpell(2, 2, 1);
  commitAbilityCost(actor, spell, 1000);
  assert.equal(cooldownRemaining(actor, spell, 1000), spell.cooldownMs / 1.25);
});
