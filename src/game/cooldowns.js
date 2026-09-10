export const ABILITY_COOLDOWN_MS = 1000;

export function isAbilityReady(lastCastAt, now) {
  return !Number.isFinite(lastCastAt) || now - lastCastAt >= ABILITY_COOLDOWN_MS;
}
