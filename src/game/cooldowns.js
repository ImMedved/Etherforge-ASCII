export function cooldownRemaining(actor, ability, now) {
  const abilityId = typeof ability === 'string' ? ability : ability.id;
  return Math.max(0, (actor.cooldowns?.[abilityId] ?? 0) - now);
}

export function isAbilityReady(actor, ability, now) {
  return cooldownRemaining(actor, ability, now) === 0;
}

export function startAbilityCooldown(actor, ability, now, durationMs = ability.cooldownMs ?? 0) {
  const abilityId = typeof ability === 'string' ? ability : ability.id;
  const adjustedDuration = durationMs / (1 + Math.max(0, actor.cooldownRecovery ?? 0));
  actor.cooldowns ??= {};
  actor.cooldowns[abilityId] = now + adjustedDuration;
  return actor.cooldowns[abilityId];
}

export function abilityAvailability(actor, ability, now) {
  const remainingMs = cooldownRemaining(actor, ability, now);
  const manaCost = ability.manaCost ?? 0;
  if (remainingMs > 0) return { ready: false, reason: 'cooldown', remainingMs, manaCost };
  if ((actor.mana ?? Infinity) < manaCost) return { ready: false, reason: 'mana', remainingMs: 0, manaCost };
  return { ready: true, reason: null, remainingMs: 0, manaCost };
}

export function commitAbilityCost(actor, ability, now) {
  const availability = abilityAvailability(actor, ability, now);
  if (!availability.ready) return availability;
  if (Number.isFinite(actor.mana)) actor.mana = Math.max(0, actor.mana - availability.manaCost);
  startAbilityCooldown(actor, ability, now);
  return availability;
}
