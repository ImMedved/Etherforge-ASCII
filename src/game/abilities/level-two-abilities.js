export const LEVEL_TWO_SPELLS = Object.freeze([
  'Циркуляция', 'Печь', 'Пузырь', 'Линза', 'Огнемёт',
  'Струя пара', 'Озеро лавы', 'Водяной резак', 'Грязевой щит', 'Сковывание',
]);

export function levelTwoImmediateDamageMultiplier(spellName) {
  if (spellName === 'Пузырь' || spellName === 'Линза' || spellName === 'Грязевой щит') return 0;
  if (spellName === 'Циркуляция' || spellName === 'Сковывание') return 0.45;
  if (spellName === 'Печь' || spellName === 'Озеро лавы') return 0.65;
  return 1;
}

export function applyLevelTwoMechanics(state, spell, targets, center, now) {
  if (spell.level !== 2) return false;

  if (spell.name === 'Циркуляция') {
    for (const enemy of targets) enemy.slowedUntil = Math.max(enemy.slowedUntil, now + 2800);
  } else if (spell.name === 'Пузырь') {
    for (const enemy of targets) enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 1350);
    state.fields.push({
      x: center.x, y: center.y, radius: 2.5, damage: Math.round(spell.damage * .9),
      color: 'water', glyph: 'O', nextTick: now + 1100, expiresAt: now + 1350,
      remainingTicks: 1,
    });
  } else if (spell.name === 'Линза') {
    state.player.shield = Math.min(90, state.player.shield + 10);
  } else if (spell.name === 'Грязевой щит') {
    state.player.shield = Math.min(90, state.player.shield + 18);
  } else if (spell.name === 'Сковывание') {
    for (const enemy of targets) enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 2300);
  }
  return true;
}
