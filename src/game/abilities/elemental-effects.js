import { damageEntity } from '../combat-feedback.js';
import { moveActor, normalizeVector } from '../movement.js';

function pushActor(actor, center, strength, world) {
  const direction = normalizeVector({ x: actor.x - center.x, y: actor.y - center.y }) ?? { x: 1, y: 0 };
  moveActor(actor, { x: direction.x * strength, y: direction.y * strength }, world);
}

export function applyElementalHit(state, actor, hit, now, context = null) {
  const elementIds = hit.elements.map((element) => typeof element === 'string' ? element : element.id);
  const vulnerability = (actor.vulnerableUntil ?? 0) > now ? 1.35 : 1;
  const damage = Math.max(1, Math.round(hit.damage * vulnerability));
  if (context?.damage) context.damage(actor, damage, now, { elements: elementIds });
  else damageEntity(state, actor, damage, now);

  if (elementIds.includes('fire')) {
    const durationScale = 1 + Math.max(0, context?.owner?.effectDurationBonus ?? 0);
    actor.burnUntil = Math.max(actor.burnUntil ?? 0, now + (1500 + hit.level * 260) * durationScale);
    actor.nextBurnTick = now + 420;
  }
  if (elementIds.includes('water')) {
    const durationScale = 1 + Math.max(0, context?.owner?.effectDurationBonus ?? 0);
    actor.slowedUntil = Math.max(actor.slowedUntil ?? 0, now + (800 + hit.level * 210) * durationScale);
  }
  if (elementIds.includes('water') && elementIds.includes('fire')) {
    actor.steamUntil = Math.max(actor.steamUntil ?? 0, now + 1200 + hit.level * 220);
  }
  if (elementIds.includes('earth')) {
    actor.stunnedUntil = Math.max(actor.stunnedUntil ?? 0, now + 180 + hit.level * 90);
  }
  if (elementIds.includes('air')) {
    pushActor(actor, hit.origin, Math.max(1, Math.ceil(hit.level / 2)), state.world);
  }

  return damage;
}
