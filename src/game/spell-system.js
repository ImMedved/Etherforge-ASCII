import { distance, pointsOnLine } from './entities.js';
import { applyElementalHit } from './abilities/elemental-effects.js';
import { castProjectileAbility } from './abilities/projectile-abilities.js';
import { abilityTarget, applyAreaAbilityMechanics } from './abilities/area-abilities.js';
import { addLevelOneCastVisuals, addLevelOneImpactVisuals } from './abilities/level-one-visuals.js';
import { SPELL_RANGE_MULTIPLIER } from '../config.js';
import { applyLevelTwoMechanics, levelTwoImmediateDamageMultiplier } from './abilities/level-two-abilities.js';
import { addLevelTwoCastVisuals, addLevelTwoImpactVisuals } from './abilities/level-two-visuals.js';
import { advancedImmediateDamageMultiplier, applyAdvancedAreaMechanics, applyAdvancedHitMechanics } from './abilities/advanced-abilities.js';
import { addAdvancedCastVisuals, addAdvancedImpactVisuals } from './abilities/advanced-visuals.js';
import { applyReusableSpellAnimation } from './animations/spell-presets.js';
import { spawnSignatureSpell } from './animations/signature-spells.js';

const LINE_SPELLS = /луч|резак|струя|огнемёт|пуля|фронт/i;
const DEFENSIVE_SPELLS = /щит|линза|зеркало/i;
const FIELD_SPELLS = /облако|болото|озеро|печь|циркуляция|испарение|торнадо|смерч|водоворот|резонанс|разлом|дождь|кавитация|тишина|катаклизм|геошторм/i;

export function clampTarget(origin, target, maxRange = 14 * SPELL_RANGE_MULTIPLIER) {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const length = Math.hypot(dx, dy);
  if (length <= maxRange) return { x: Math.round(target.x), y: Math.round(target.y) };
  return {
    x: Math.round(origin.x + (dx / length) * maxRange),
    y: Math.round(origin.y + (dy / length) * maxRange),
  };
}

function circlePoints(center, radius) {
  const points = [];
  for (let x = -radius; x <= radius; x += 1) {
    for (let y = -radius; y <= radius; y += 1) {
      const d = Math.hypot(x, y);
      if (d <= radius && (d >= radius - 0.8 || (x + y) % 3 === 0)) {
        points.push({ x: center.x + x, y: center.y + y });
      }
    }
  }
  return points;
}

export class SpellSystem {
  cast(state, spell, rawTarget, now) {
    const target = abilityTarget(spell, state.player, clampTarget(state.player, rawTarget));
    addLevelOneCastVisuals(state, spell, state.player, target, now);
    addLevelTwoCastVisuals(state, spell, state.player, target, now);
    addAdvancedCastVisuals(state, spell, state.player, target, now);
    const projectileCast = castProjectileAbility(state, spell, target, now);
    if (projectileCast) {
      applyReusableSpellAnimation(state, spell.name, state.player, target, now, 'cast');
      state.log(`${spell.name}: выпущено снарядов — ${projectileCast.projectileCount}.`);
      return { target, hitCount: 0, projectile: true };
    }

    const isLine = LINE_SPELLS.test(spell.name);
    const isDefensive = DEFENSIVE_SPELLS.test(spell.name);
    const line = pointsOnLine(state.player, target);
    const area = circlePoints(target, spell.radius);
    const visualPoints = isLine ? [...line, ...area] : area;
    const elementIds = spell.elements.map((element) => element.id);
    const primary = spell.elements[0];
    const immediateDamageMultiplier = levelTwoImmediateDamageMultiplier(spell.name) * advancedImmediateDamageMultiplier(spell.name);

    state.effects.push({
      points: visualPoints,
      glyph: primary.glyph,
      color: primary.color,
      createdAt: now,
      expiresAt: now + 700 + spell.level * 90,
    });

    if (isDefensive) {
      const shield = 14 + spell.level * 8;
      state.player.shield = Math.min(90, state.player.shield + shield);
      state.log(`${spell.name}: щит +${shield}.`);
    }

    const targets = state.enemies.filter((enemy) => {
      if (isLine) return line.some((point) => distance(point, enemy) <= 1.2);
      return distance(target, enemy) <= spell.radius + 0.5;
    });

    for (const enemy of targets) {
      const falloff = isLine ? 1 : Math.max(0.6, 1 - distance(target, enemy) * 0.08);
      const defensivePenalty = isDefensive ? 0.35 : 1;
      if (immediateDamageMultiplier > 0) {
        const damage = Math.max(2, Math.round(spell.damage * falloff * defensivePenalty * immediateDamageMultiplier));
        applyElementalHit(state, enemy, {
          damage,
          elements: elementIds,
          level: spell.level,
          origin: target,
        }, now);
        applyAdvancedHitMechanics(state, enemy, spell.name, spell.level, target, now);
      }
    }
    applyAreaAbilityMechanics(state, spell, targets, target, now);
    applyLevelTwoMechanics(state, spell, targets, target, now);
    applyAdvancedAreaMechanics(state, spell, targets, target, now);
    addLevelOneImpactVisuals(state, spell.name, target, now);
    addLevelTwoImpactVisuals(state, spell.name, target, now);
    addAdvancedImpactVisuals(state, spell.name, target, now);
    applyReusableSpellAnimation(state, spell.name, state.player, target, now);
    spawnSignatureSpell(state, spell.name, state.player, target, now);

    if (FIELD_SPELLS.test(spell.name)) {
      state.fields.push({
        x: target.x,
        y: target.y,
        radius: spell.radius,
        damage: Math.max(2, Math.floor(spell.level * 1.4)),
        color: primary.color,
        glyph: primary.glyph,
        nextTick: now + 550,
        expiresAt: now + 2200 + spell.level * 550,
      });
    }

    if (targets.length) state.log(`${spell.name}: поражено целей — ${targets.length}.`);
    else if (!isDefensive) state.log(`${spell.name}: цель не задета.`);
    return { target, hitCount: targets.length };
  }
}
