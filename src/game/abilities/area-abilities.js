import { moveActor, normalizeVector } from '../movement.js';

const SELF_CENTERED = /осьминог|водяная сфера|щит|линза|зеркало/i;
const PULLING = /торнадо|смерч|водоворот|циркуляция/i;
const HARD_CONTROL = /давление океана|сковывание|резонанс|тектонический сдвиг|атмосферный коллапс|абсолютная тишина/i;

export function abilityTarget(spell, player, requestedTarget) {
  return SELF_CENTERED.test(spell.name)
    ? { x: player.x, y: player.y }
    : requestedTarget;
}

function pullToward(actor, center, world, strength) {
  const direction = normalizeVector({ x: center.x - actor.x, y: center.y - actor.y });
  if (direction) moveActor(actor, { x: direction.x * strength, y: direction.y * strength }, world);
}

export function applyAreaAbilityMechanics(state, spell, targets, center, now) {
  if (PULLING.test(spell.name)) {
    for (const enemy of targets) pullToward(enemy, center, state.world, Math.max(1, Math.floor(spell.level / 2)));
  }
  if (HARD_CONTROL.test(spell.name)) {
    for (const enemy of targets) {
      enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 500 + spell.level * 180);
    }
  }
}
