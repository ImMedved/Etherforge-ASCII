function pushEnemy(enemy, center, strength, world) {
  const dx = Math.sign(enemy.x - center.x) || 1;
  const dy = Math.sign(enemy.y - center.y);
  for (let step = 0; step < strength; step += 1) {
    const nx = enemy.x + dx;
    const ny = enemy.y + dy;
    if (!world.isPassable(Math.round(nx), Math.round(ny))) break;
    enemy.x = nx;
    enemy.y = ny;
  }
}

export function applyElementalHit(state, enemy, hit, now) {
  const elementIds = hit.elements.map((element) => typeof element === 'string' ? element : element.id);
  const vulnerability = (enemy.vulnerableUntil ?? 0) > now ? 1.35 : 1;
  const damage = Math.max(1, Math.round(hit.damage * vulnerability));
  damageEntity(state, enemy, damage, now);

  if (elementIds.includes('fire')) {
    enemy.burnUntil = Math.max(enemy.burnUntil, now + 1500 + hit.level * 260);
    enemy.nextBurnTick = now + 420;
  }
  if (elementIds.includes('water')) {
    enemy.slowedUntil = Math.max(enemy.slowedUntil, now + 800 + hit.level * 210);
  }
  if (elementIds.includes('water') && elementIds.includes('fire')) {
    enemy.steamUntil = Math.max(enemy.steamUntil ?? 0, now + 1200 + hit.level * 220);
  }
  if (elementIds.includes('earth')) {
    enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 180 + hit.level * 90);
  }
  if (elementIds.includes('air')) {
    pushEnemy(enemy, hit.origin, Math.max(1, Math.ceil(hit.level / 2)), state.world);
  }

  return damage;
}
import { damageEntity } from '../combat-feedback.js';
