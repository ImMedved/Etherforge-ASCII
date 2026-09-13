import { distance, pointsOnLine } from './entities.js';
import { applyElementalHit } from './abilities/elemental-effects.js';
import { castProjectileAbility, projectileRangeFor, PROJECTILE_SPELL_NAMES } from './abilities/projectile-abilities.js';
import { abilityTarget, applyAreaAbilityMechanics } from './abilities/area-abilities.js';
import { addLevelOneCastVisuals, addLevelOneImpactVisuals } from './abilities/level-one-visuals.js';
import { SPELL_RANGE_MULTIPLIER } from '../config.js';
import { applyLevelTwoMechanics, levelTwoImmediateDamageMultiplier } from './abilities/level-two-abilities.js';
import { addLevelTwoCastVisuals, addLevelTwoImpactVisuals } from './abilities/level-two-visuals.js';
import { advancedImmediateDamageMultiplier, applyAdvancedAreaMechanics, applyAdvancedHitMechanics } from './abilities/advanced-abilities.js';
import { addAdvancedCastVisuals, addAdvancedImpactVisuals } from './abilities/advanced-visuals.js';
import { applyReusableSpellAnimation } from './animations/spell-presets.js';
import { spawnSignatureSpell } from './animations/signature-spells.js';
import { createActorAbilityContext, isAbilityContext } from './actor-abilities.js';

const LINE_SPELLS = /луч|резак|струя|огнемёт|пуля|фронт/i;
const DEFENSIVE_SPELLS = /щит|линза|зеркало/i;
const FIELD_SPELLS = /облако|болото|озеро|печь|циркуляция|испарение|торнадо|смерч|водоворот|резонанс|разлом|дождь|кавитация|тишина|катаклизм|геошторм/i;

export function spellTargeting(spell) {
  if (DEFENSIVE_SPELLS.test(spell.name) || /осьминог|водяная сфера/i.test(spell.name)) return 'self';
  if (LINE_SPELLS.test(spell.name) || PROJECTILE_SPELL_NAMES.includes(spell.name)) return 'line';
  return 'area';
}

export function abilityRange(spell, actor = null) {
  const baseRange = projectileRangeFor(spell.name) ?? 14 * SPELL_RANGE_MULTIPLIER;
  return baseRange * (1 + Math.max(0, actor?.spellRangeBonus ?? 0));
}

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
  cast(stateOrContext, spellArg, rawTargetArg, nowArg, options = {}) {
    const context = isAbilityContext(stateOrContext)
      ? stateOrContext
      : createActorAbilityContext(stateOrContext, spellArg, options.owner ?? stateOrContext.player, rawTargetArg, nowArg, options);
    const { state, spell, owner, rawTarget, now } = context;
    const range = abilityRange(spell, owner);
    const radius = spell.radius * (1 + Math.max(0, owner?.areaSizeBonus ?? 0));
    const target = abilityTarget(spell, owner, clampTarget(owner, rawTarget, range));
    context.target = target;
    addLevelOneCastVisuals(state, spell, owner, target, now);
    addLevelTwoCastVisuals(state, spell, owner, target, now);
    addAdvancedCastVisuals(state, spell, owner, target, now);
    const projectileCast = castProjectileAbility(context, target);
    if (projectileCast) {
      applyReusableSpellAnimation(state, spell.name, owner, target, now, 'cast');
      if (context.log) state.log(`${owner.name ?? 'Маг'} — ${spell.name}: выпущено снарядов — ${projectileCast.projectileCount}.`);
      return { target, hitCount: 0, projectile: true };
    }

    const isLine = LINE_SPELLS.test(spell.name);
    const isDefensive = DEFENSIVE_SPELLS.test(spell.name);
    const line = pointsOnLine(owner, target);
    const area = circlePoints(target, radius);
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
      const shield = Math.round((14 + spell.level * 8) * (1 + Math.max(0, owner.shieldPower ?? 0)));
      owner.shield = Math.min(90, (owner.shield ?? 0) + shield);
      if (context.log) state.log(`${spell.name}: щит +${shield}.`);
    }

    const targets = context.hostileActors.filter((actor) => {
      if (isLine) return line.some((point) => distance(point, actor) <= 1.2);
      return distance(target, actor) <= radius + 0.5;
    });

    for (const actor of targets) {
      const falloff = isLine ? 1 : Math.max(0.6, 1 - distance(target, actor) * 0.08);
      const defensivePenalty = isDefensive ? 0.35 : 1;
      if (immediateDamageMultiplier > 0) {
        const damage = Math.max(2, Math.round(spell.damage * context.power * falloff * defensivePenalty * immediateDamageMultiplier));
        applyElementalHit(state, actor, {
          damage,
          elements: elementIds,
          level: spell.level,
          origin: target,
        }, now, context);
        applyAdvancedHitMechanics(state, actor, spell.name, spell.level, target, now);
      }
    }
    applyAreaAbilityMechanics(state, spell, targets, target, now);
    applyLevelTwoMechanics(state, spell, targets, target, now, owner, context.team);
    applyAdvancedAreaMechanics(state, spell, targets, target, now, owner, context.team);
    addLevelOneImpactVisuals(state, spell.name, target, now);
    addLevelTwoImpactVisuals(state, spell.name, target, now);
    addAdvancedImpactVisuals(state, spell.name, target, now);
    applyReusableSpellAnimation(state, spell.name, owner, target, now);
    spawnSignatureSpell(state, spell.name, owner, target, now, {
      followActor: spellTargeting(spell) === 'self' ? owner : null,
    });

    if (FIELD_SPELLS.test(spell.name)) {
      state.fields.push({
        x: target.x,
        y: target.y,
        radius,
        damage: Math.max(2, Math.floor(spell.level * 1.4)),
        color: primary.color,
        glyph: primary.glyph,
        nextTick: now + 550,
        expiresAt: now + (2200 + spell.level * 550) * (1 + Math.max(0, owner.effectDurationBonus ?? 0)),
        owner,
        team: context.team,
      });
    }

    if (context.log && targets.length) state.log(`${spell.name}: поражено целей — ${targets.length}.`);
    else if (context.log && !isDefensive) state.log(`${spell.name}: цель не задета.`);
    return { target, hitCount: targets.length };
  }
}
