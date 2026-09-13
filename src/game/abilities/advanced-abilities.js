import { damageEntity, healEntity } from '../combat-feedback.js';
import { moveActor, normalizeVector } from '../movement.js';

export const ADVANCED_SPELLS = Object.freeze([
  'Вакуумный карман', 'Горячий воздух', 'Давление океана', 'Воздушная пуля', 'Живой огонь',
  'Испарение', 'Плавление', 'Гейзер', 'Подземный взрыв', 'Разлом',
  'Торнадо', 'Огненный смерч', 'Водоворот', 'Резонанс', 'Плазменный луч',
  'Термический шок', 'Огненный дождь', 'Осьминог', 'Кавитация', 'Тектонический сдвиг',
  'Атмосферный коллапс', 'Огненный фронт', 'Воздушное зеркало', 'Абсолютная тишина', 'Солнцепад',
  'Гидроудар', 'Магматический катаклизм', 'Водяная сфера', 'Струи', 'Геошторм',
]);

export function advancedImmediateDamageMultiplier(spellName) {
  if (spellName === 'Воздушное зеркало') return 0;
  if (['Давление океана', 'Плавление', 'Резонанс', 'Абсолютная тишина'].includes(spellName)) return 0.45;
  if (['Вакуумный карман', 'Водоворот', 'Торнадо'].includes(spellName)) return 0.72;
  return 1;
}

function pushAway(state, actor, center, strength = 1) {
  const direction = normalizeVector({ x: actor.x - center.x, y: actor.y - center.y }) ?? { x: 1, y: 0 };
  moveActor(actor, { x: direction.x * strength, y: direction.y * strength }, state.world);
}

function prolongBurn(enemy, now, duration) {
  enemy.burnUntil = Math.max(enemy.burnUntil ?? 0, now + duration);
  enemy.nextBurnTick = Math.min(enemy.nextBurnTick || now + 350, now + 350);
}

export function applyAdvancedHitMechanics(state, enemy, spellName, level, center, now) {
  if (spellName === 'Воздушная пуля') enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 350);
  else if (spellName === 'Живой огонь') prolongBurn(enemy, now, 3600);
  else if (spellName === 'Плазменный луч') {
    prolongBurn(enemy, now, 3000);
    enemy.vulnerableUntil = Math.max(enemy.vulnerableUntil ?? 0, now + 2200);
  } else if (spellName === 'Термический шок') {
    enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 1200);
    enemy.slowedUntil = Math.max(enemy.slowedUntil, now + 2400);
  } else if (spellName === 'Огненный дождь' || spellName === 'Огненный фронт') prolongBurn(enemy, now, 4200);
  else if (spellName === 'Гидроудар') {
    enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 1600);
    pushAway(state, enemy, center, 2);
  } else if (spellName === 'Струи') {
    enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 700);
    pushAway(state, enemy, center, 1);
  }
  return level >= 3;
}

export function applyAdvancedAreaMechanics(state, spell, targets, center, now, owner = state.player, team = 'player') {
  if (spell.level < 3) return false;

  if (spell.name === 'Вакуумный карман') {
    for (const enemy of targets) {
      enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 650);
      pushAway(state, enemy, center, 2);
    }
  } else if (spell.name === 'Горячий воздух') {
    for (const enemy of targets) prolongBurn(enemy, now, 3800);
  } else if (spell.name === 'Давление океана') {
    for (const enemy of targets) {
      enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 1800);
      enemy.slowedUntil = Math.max(enemy.slowedUntil, now + 3800);
    }
  } else if (spell.name === 'Испарение') {
    for (const enemy of targets) {
      prolongBurn(enemy, now, 2500);
      enemy.slowedUntil = Math.max(enemy.slowedUntil, now + 2800);
    }
  } else if (spell.name === 'Плавление') {
    for (const enemy of targets) enemy.vulnerableUntil = Math.max(enemy.vulnerableUntil ?? 0, now + 5200);
  } else if (spell.name === 'Гейзер') {
    for (const enemy of targets) {
      enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 1100);
      pushAway(state, enemy, center, 2);
    }
  } else if (spell.name === 'Подземный взрыв') {
    for (const enemy of targets) enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 900);
    state.fields.push({ x: center.x, y: center.y, radius: 3, damage: 4, color: 'earth', glyph: ':', nextTick: now + 600, expiresAt: now + 2800, owner, team });
  } else if (spell.name === 'Торнадо' || spell.name === 'Водоворот') {
    for (const enemy of targets) enemy.slowedUntil = Math.max(enemy.slowedUntil, now + 4200);
  } else if (spell.name === 'Огненный смерч') {
    for (const enemy of targets) {
      prolongBurn(enemy, now, 4800);
      enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 750);
    }
  } else if (spell.name === 'Резонанс') {
    for (const enemy of targets) enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 2600);
  } else if (spell.name === 'Осьминог') {
    for (const enemy of targets) enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 900);
  } else if (spell.name === 'Кавитация') {
    for (const enemy of targets) enemy.vulnerableUntil = Math.max(enemy.vulnerableUntil ?? 0, now + 3000);
  } else if (spell.name === 'Тектонический сдвиг') {
    for (const enemy of targets) enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 3200);
  } else if (spell.name === 'Атмосферный коллапс') {
    for (const enemy of targets) {
      enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 2800);
      pushAway(state, enemy, center, 3);
    }
  } else if (spell.name === 'Воздушное зеркало') {
    owner.shield = Math.min(120, (owner.shield ?? 0) + 55);
    owner.reflectUntil = Math.max(owner.reflectUntil ?? 0, now + 6500);
  } else if (spell.name === 'Абсолютная тишина') {
    for (const enemy of targets) enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 4200);
  } else if (spell.name === 'Солнцепад') {
    for (const enemy of targets) prolongBurn(enemy, now, 6000);
    state.fields.push({ x: center.x, y: center.y, radius: 4, damage: 7, color: 'fire', glyph: '^', nextTick: now + 500, expiresAt: now + 3200, owner, team });
  } else if (spell.name === 'Магматический катаклизм') {
    for (const enemy of targets) {
      prolongBurn(enemy, now, 5500);
      enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 1500);
    }
  } else if (spell.name === 'Водяная сфера') {
    healEntity(state, owner, 24, now);
    owner.shield = Math.min(120, (owner.shield ?? 0) + 24);
    state.fields = state.fields.filter((field) => field.sourceSpell !== 'Водяная сфера');
    state.fields.push({
      x: owner.x, y: owner.y, radius: 4, damage: 6,
      color: 'water', glyph: 'O', nextTick: now + 450, expiresAt: now + 4800,
      sourceSpell: 'Водяная сфера', followOwner: true, followPlayer: owner === state.player, owner, team,
    });
  } else if (spell.name === 'Геошторм') {
    for (const enemy of targets) enemy.stunnedUntil = Math.max(enemy.stunnedUntil, now + 2400);
  }
  return true;
}

export function reflectedMeleeDamage(state, source, receivedDamage, now, defender = state.player) {
  if (!source || (defender.reflectUntil ?? 0) <= now || receivedDamage <= 0) return 0;
  return damageEntity(state, source, Math.max(1, Math.round(receivedDamage * 1.5)), now);
}
