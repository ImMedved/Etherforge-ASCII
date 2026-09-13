import { damageEntity, healEntity } from './combat-feedback.js';

export function actorTeam(state, actor) {
  if (actor?.team) return actor.team;
  return actor === state.player ? 'player' : 'enemy';
}

export function allActors(state) {
  return [state.player, ...(state.enemies ?? [])].filter(Boolean);
}

export function hostileActors(state, ownerOrTeam) {
  const team = typeof ownerOrTeam === 'string' ? ownerOrTeam : actorTeam(state, ownerOrTeam);
  return allActors(state).filter((actor) => actor.hp > 0 && actorTeam(state, actor) !== team);
}

export function alliedActors(state, ownerOrTeam) {
  const team = typeof ownerOrTeam === 'string' ? ownerOrTeam : actorTeam(state, ownerOrTeam);
  return allActors(state).filter((actor) => actor.hp > 0 && actorTeam(state, actor) === team);
}

export function createActorAbilityContext(state, spell, owner, rawTarget, now, options = {}) {
  const team = options.team ?? actorTeam(state, owner);
  const context = {
    state,
    spell,
    owner,
    rawTarget,
    target: rawTarget,
    now,
    team,
    power: options.power ?? 1,
    manaCost: options.manaCost ?? spell.manaCost ?? 0,
    cooldownMs: options.cooldownMs ?? spell.cooldownMs ?? 0,
    telegraph: options.telegraph ?? null,
    hostileActors: options.hostileActors ?? hostileActors(state, team),
    alliedActors: options.alliedActors ?? alliedActors(state, team),
    log: options.log ?? true,
  };
  context.damage = (target, amount, at = now, metadata = {}) => {
    if (typeof state.damageActor === 'function') return state.damageActor(owner, target, amount, at, metadata);
    return damageEntity(state, target, amount, at);
  };
  context.heal = (target, amount, at = now) =>
    healEntity(state, target, amount * (1 + Math.max(0, owner.healingPower ?? 0)), at);
  return context;
}

export function isAbilityContext(value) {
  return Boolean(value?.state && value?.owner && value?.spell && Number.isFinite(value?.now));
}
