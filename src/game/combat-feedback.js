let combatNumberSerial = 0;

export function addCombatNumber(state, target, amount, type, now) {
  const rounded = Math.max(0, Math.round(Math.abs(amount)));
  if (!rounded) return 0;
  state.combatNumbers ??= [];
  state.combatNumbers.push({
    id: ++combatNumberSerial,
    x: target.visualX ?? target.x,
    y: target.visualY ?? target.y,
    text: `${type === 'heal' ? '+' : '-'}${rounded}`,
    color: type === 'heal' ? 'heal' : 'damage',
    createdAt: now,
    expiresAt: now + 900,
  });
  return rounded;
}

export function damageEntity(state, entity, amount, now) {
  const damage = Math.min(Math.max(0, entity.hp), Math.max(0, Math.round(amount)));
  entity.hp -= damage;
  addCombatNumber(state, entity, damage, 'damage', now);
  return damage;
}

export function healEntity(state, entity, amount, now) {
  const healing = Math.min(Math.max(0, entity.maxHealth - entity.hp), Math.max(0, Math.round(amount)));
  entity.hp += healing;
  addCombatNumber(state, entity, healing, 'heal', now);
  return healing;
}
