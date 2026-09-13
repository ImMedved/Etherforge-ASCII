import { distance } from '../entities.js';
import { applyElementalHit } from './elemental-effects.js';
import { addLevelOneImpactVisuals } from './level-one-visuals.js';
import { addLevelTwoImpactVisuals } from './level-two-visuals.js';
import { applyAdvancedHitMechanics } from './advanced-abilities.js';
import { addAdvancedProjectileImpactVisuals } from './advanced-visuals.js';
import { applyReusableProjectileAnimation } from '../animations/spell-presets.js';
import { spawnProjectileSignature } from '../animations/signature-spells.js';
import { actorTeam, hostileActors } from '../actor-abilities.js';

let projectileSerial = 0;

function normalizedDirection(origin, target, angleOffset = 0) {
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x) + angleOffset;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function impactPoints(center, radius) {
  const points = [{ x: center.x, y: center.y }];
  const steps = Math.max(4, Math.ceil(radius * 8));
  for (let index = 0; index < steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    points.push({
      x: center.x + Math.cos(angle) * Math.max(0.7, radius),
      y: center.y + Math.sin(angle) * Math.max(0.7, radius),
    });
  }
  return points;
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return { distance: distance(point, start), progress: 0 };
  const progress = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  const nearest = { x: start.x + dx * progress, y: start.y + dy * progress };
  return { distance: distance(point, nearest), progress };
}

export function spawnProjectile(state, origin, target, spec, now) {
  const direction = normalizedDirection(origin, target, spec.angleOffset ?? 0);
  const projectile = {
    id: `projectile-${++projectileSerial}`,
    x: origin.x,
    y: origin.y,
    vx: direction.x * spec.speed,
    vy: direction.y * spec.speed,
    speed: spec.speed,
    range: spec.range,
    travelled: 0,
    damage: spec.damage,
    owner: spec.owner ?? state.player,
    team: spec.team ?? actorTeam(state, spec.owner ?? state.player),
    context: spec.context ?? null,
    spellName: spec.spellName,
    level: spec.level,
    elements: spec.elements,
    glyph: spec.glyph,
    color: spec.color,
    animationGlyphs: spec.animationGlyphs,
    trailGlyphs: spec.trailGlyphs,
    trailColors: spec.trailColors,
    size: spec.size ?? 1,
    hitRadius: spec.hitRadius ?? 0.55,
    splashRadius: spec.splashRadius ?? 0,
    pierce: spec.pierce ?? 0,
    chain: spec.chain ?? 0,
    ignoreObstacles: spec.ignoreObstacles ?? false,
    startAt: now + (spec.delay ?? 0),
    expiresAt: now + (spec.delay ?? 0) + (spec.range / spec.speed) * 1000 + 750,
    hitIds: new Set(),
    trail: [],
    nextTrailAt: now,
  };
  state.projectiles.push(projectile);
  return projectile;
}

function addImpactEffect(state, projectile, now) {
  state.effects.push({
    points: impactPoints(projectile, Math.max(0.8, projectile.splashRadius)),
    glyph: projectile.glyph,
    color: projectile.color,
    createdAt: now,
    expiresAt: now + 420,
  });
}

function applySplash(state, projectile, directTarget, now) {
  const targets = projectile.splashRadius > 0
    ? hostileActors(state, projectile.team).filter((actor) => !projectile.hitIds.has(actor.id)
      && actor !== directTarget
      && distance(projectile, actor) <= projectile.splashRadius + 0.6)
    : [];
  if (directTarget && !projectile.hitIds.has(directTarget.id)) targets.unshift(directTarget);

  for (const actor of targets) {
    projectile.hitIds.add(actor.id);
    const falloff = directTarget === actor ? 1 : Math.max(0.55, 1 - distance(projectile, actor) * 0.18);
    applyElementalHit(state, actor, {
      damage: projectile.damage * falloff,
      elements: projectile.elements,
      level: projectile.level,
      origin: { x: projectile.x, y: projectile.y },
    }, now, projectile.context);
    applyAdvancedHitMechanics(state, actor, projectile.spellName, projectile.level, projectile, now);
  }
}

function retargetChain(state, projectile) {
  const next = hostileActors(state, projectile.team)
    .filter((actor) => !projectile.hitIds.has(actor.id) && distance(projectile, actor) <= 6)
    .sort((a, b) => distance(projectile, a) - distance(projectile, b))[0];
  if (!next) return false;
  const direction = normalizedDirection(projectile, next);
  projectile.vx = direction.x * projectile.speed;
  projectile.vy = direction.y * projectile.speed;
  projectile.chain -= 1;
  projectile.travelled = 0;
  return true;
}

function finishProjectile(state, projectile, now, directTarget = null, impactAlreadyShown = false) {
  applySplash(state, projectile, directTarget, now);
  addImpactEffect(state, projectile, now);
  if (!impactAlreadyShown) {
    addLevelOneImpactVisuals(state, projectile.spellName, projectile, now);
    addLevelTwoImpactVisuals(state, projectile.spellName, projectile, now);
    addAdvancedProjectileImpactVisuals(state, projectile.spellName, projectile, now);
    applyReusableProjectileAnimation(state, projectile.spellName, projectile, projectile, now);
    spawnProjectileSignature(state, projectile.spellName, projectile, projectile, now);
  }
  projectile.finished = true;
}

export function updateProjectiles(state, now, deltaMs) {
  const stepSeconds = Math.min(deltaMs, 50) / 1000;

  for (const projectile of state.projectiles) {
    if (projectile.finished || now < projectile.startAt) continue;
    const previous = { x: projectile.x, y: projectile.y };
    projectile.x += projectile.vx * stepSeconds;
    projectile.y += projectile.vy * stepSeconds;
    projectile.travelled += distance(previous, projectile);

    if (now >= projectile.nextTrailAt) {
      projectile.trail.push({ x: projectile.x, y: projectile.y });
      projectile.trail = projectile.trail.slice(-7);
      projectile.nextTrailAt = now + 45;
    }

    const hit = hostileActors(state, projectile.team)
      .filter((actor) => !projectile.hitIds.has(actor.id))
      .map((actor) => ({ actor, contact: distanceToSegment(actor, previous, projectile) }))
      .filter(({ contact }) => contact.distance <= projectile.hitRadius + 0.9)
      .sort((a, b) => a.contact.progress - b.contact.progress)[0]?.actor;

    if (hit) {
      applySplash(state, projectile, hit, now);
      addLevelOneImpactVisuals(state, projectile.spellName, projectile, now);
      addLevelTwoImpactVisuals(state, projectile.spellName, projectile, now);
      addAdvancedProjectileImpactVisuals(state, projectile.spellName, projectile, now);
      applyReusableProjectileAnimation(state, projectile.spellName, projectile, projectile, now);
      spawnProjectileSignature(state, projectile.spellName, projectile, projectile, now);
      if (projectile.chain > 0 && retargetChain(state, projectile)) continue;
      if (projectile.pierce > 0) {
        projectile.pierce -= 1;
        continue;
      }
      finishProjectile(state, projectile, now, hit, true);
      continue;
    }

    const tileX = Math.round(projectile.x);
    const tileY = Math.round(projectile.y);
    const hitObstacle = !projectile.ignoreObstacles && !state.world.isPassable(tileX, tileY);
    if (hitObstacle || projectile.travelled >= projectile.range || now >= projectile.expiresAt) {
      finishProjectile(state, projectile, now);
    }
  }

  state.projectiles = state.projectiles.filter((projectile) => !projectile.finished && now < projectile.expiresAt);
}
