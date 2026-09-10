const SELF_CENTERED = /осьминог|водяная сфера|щит|линза|зеркало/i;
const PULLING = /торнадо|смерч|водоворот|циркуляция/i;
const HARD_CONTROL = /давление океана|сковывание|резонанс|тектонический сдвиг|атмосферный коллапс|абсолютная тишина/i;

export function abilityTarget(spell, player, requestedTarget) {
  return SELF_CENTERED.test(spell.name)
    ? { x: Math.round(player.x), y: Math.round(player.y) }
    : requestedTarget;
}

function pullToward(enemy, center, world, steps) {
  for (let step = 0; step < steps; step += 1) {
    const dx = Math.sign(center.x - enemy.x);
    const dy = Math.sign(center.y - enemy.y);
    const options = Math.abs(center.x - enemy.x) >= Math.abs(center.y - enemy.y)
      ? [{ x: enemy.x + dx, y: enemy.y }, { x: enemy.x, y: enemy.y + dy }]
      : [{ x: enemy.x, y: enemy.y + dy }, { x: enemy.x + dx, y: enemy.y }];
    const next = options.find((point) => world.isPassable(point.x, point.y));
    if (!next || (next.x === enemy.x && next.y === enemy.y)) break;
    enemy.x = next.x;
    enemy.y = next.y;
  }
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
