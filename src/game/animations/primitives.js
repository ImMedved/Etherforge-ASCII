const clamp01 = (value) => Math.max(0, Math.min(1, value));

function progress(animation, now) {
  return clamp01((now - animation.createdAt) / (animation.expiresAt - animation.createdAt));
}

function point(x, y, glyph, color, screenDy = 0) {
  return { x, y, glyph, color, screenDy };
}

export function spawnTornado(state, center, now, options = {}) {
  state.animations ??= [];
  state.animations.push({ type: 'tornado', x: center.x, y: center.y, colors: options.colors ?? ['air'], radius: options.radius ?? 4, height: options.height ?? 8, glyphs: options.glyphs ?? ['(', ')', '~', '@'], createdAt: now, expiresAt: now + (options.duration ?? 1700) });
}

export function spawnRift(state, origin, target, now, options = {}) {
  state.animations ??= [];
  state.animations.push({ type: 'rift', origin: { x: origin.x, y: origin.y }, target: { x: target.x, y: target.y }, colors: options.colors ?? ['earth'], width: options.width ?? 1.2, glyphs: options.glyphs ?? ['#', '/', '_', '^'], createdAt: now, expiresAt: now + (options.duration ?? 1500) });
}

export function spawnSphericalExplosion(state, center, now, options = {}) {
  state.animations ??= [];
  state.animations.push({ type: 'spherical-explosion', x: center.x, y: center.y, colors: options.colors ?? ['fire', 'air'], radius: options.radius ?? 4, glyphs: options.glyphs ?? ['*', '@', '+', '.'], createdAt: now, expiresAt: now + (options.duration ?? 800) });
}

export function spawnSpherePulse(state, center, now, options = {}) {
  state.animations ??= [];
  state.animations.push({ type: 'sphere-pulse', x: center.x, y: center.y, colors: options.colors ?? ['water', 'air'], radius: options.radius ?? 3, rings: options.rings ?? 3, glyphs: options.glyphs ?? ['O', 'o', '.', '+'], followPlayer: options.followPlayer ?? false, createdAt: now, expiresAt: now + (options.duration ?? 1300) });
}

export function spawnLighting(state, now, options = {}) {
  state.animations ??= [];
  state.animations.push({ type: 'lighting', overlayColor: options.color ?? '#ff8a45', peakAlpha: options.alpha ?? .16, createdAt: now, expiresAt: now + (options.duration ?? 900) });
}

function sampleTornado(animation, now) {
  const t = progress(animation, now);
  const points = [];
  for (let level = 0; level < animation.height; level += 1) {
    const levelRatio = level / Math.max(1, animation.height - 1);
    const radius = .5 + animation.radius * (.25 + levelRatio * .75);
    for (let arm = 0; arm < 3; arm += 1) {
      const angle = t * Math.PI * 9 + level * .95 + arm * Math.PI * 2 / 3;
      points.push(point(
        animation.x + Math.cos(angle) * radius,
        animation.y + Math.sin(angle) * radius,
        animation.glyphs[(level + arm + Math.floor(t * 12)) % animation.glyphs.length],
        animation.colors[(level + arm) % animation.colors.length],
        -level * .72,
      ));
    }
  }
  return points;
}

function sampleRift(animation, now) {
  const t = progress(animation, now);
  const dx = animation.target.x - animation.origin.x;
  const dy = animation.target.y - animation.origin.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const count = Math.max(5, Math.ceil(length * 1.6));
  const points = [];
  for (let index = 0; index <= count * t; index += 1) {
    const along = index / count;
    const jitter = Math.sin(index * 5.17 + t * 8) * animation.width;
    points.push(point(animation.origin.x + dx * along + nx * jitter, animation.origin.y + dy * along + ny * jitter, animation.glyphs[index % animation.glyphs.length], animation.colors[index % animation.colors.length]));
    if (index % 3 === 0) points.push(point(animation.origin.x + dx * along - nx * jitter * .7, animation.origin.y + dy * along - ny * jitter * .7, '.', animation.colors[(index + 1) % animation.colors.length], -Math.sin(t * Math.PI) * 3));
  }
  return points;
}

function sampleExplosion(animation, now) {
  const t = progress(animation, now);
  const eased = 1 - Math.pow(1 - t, 2);
  const radius = Math.max(.4, animation.radius * eased);
  const count = Math.max(12, Math.ceil(radius * 13));
  const points = [];
  for (let index = 0; index < count; index += 1) {
    const angle = index / count * Math.PI * 2;
    points.push(point(animation.x + Math.cos(angle) * radius, animation.y + Math.sin(angle) * radius, animation.glyphs[(index + Math.floor(t * 10)) % animation.glyphs.length], animation.colors[index % animation.colors.length], -Math.sin(t * Math.PI) * (index % 3)));
  }
  for (let index = 0; index < 8; index += 1) {
    const angle = index * 2.399;
    const innerRadius = radius * ((index % 3 + 1) / 4);
    points.push(point(animation.x + Math.cos(angle) * innerRadius, animation.y + Math.sin(angle) * innerRadius, animation.glyphs[index % animation.glyphs.length], animation.colors[(index + 1) % animation.colors.length], -4 * Math.sin(t * Math.PI)));
  }
  return points;
}

function samplePulse(animation, now, player) {
  const t = progress(animation, now);
  const center = animation.followPlayer && player ? player : animation;
  const points = [];
  for (let ring = 0; ring < animation.rings; ring += 1) {
    const phase = (t + ring / animation.rings) % 1;
    const radius = .5 + phase * animation.radius;
    const count = 10 + ring * 6;
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * Math.PI * 2 + t * (ring % 2 ? -4 : 4);
      points.push(point(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius, animation.glyphs[(index + ring) % animation.glyphs.length], animation.colors[(index + ring) % animation.colors.length], -Math.sin(phase * Math.PI) * 2));
    }
  }
  return points;
}

export function sampleAnimation(animation, now, player = null) {
  if (now < animation.createdAt || now >= animation.expiresAt) return [];
  if (animation.type === 'tornado') return sampleTornado(animation, now);
  if (animation.type === 'rift') return sampleRift(animation, now);
  if (animation.type === 'spherical-explosion') return sampleExplosion(animation, now);
  if (animation.type === 'sphere-pulse') return samplePulse(animation, now, player);
  return [];
}

export function lightingFromAnimations(animations, now) {
  let strongest = null;
  for (const animation of animations) {
    if (animation.type !== 'lighting' || now < animation.createdAt || now >= animation.expiresAt) continue;
    const alpha = Math.sin(progress(animation, now) * Math.PI) * animation.peakAlpha;
    if (!strongest || alpha > strongest.alpha) strongest = { color: animation.overlayColor, alpha };
  }
  return strongest;
}

function entitySeed(entity) {
  return [...String(entity.id ?? '')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function sampleStatusParticles(entity, type, now) {
  const seed = entitySeed(entity);
  const glyphs = type === 'burn' ? ['^', '*', '.', "'"] : type === 'frost' ? ['*', '+', '.', 'x'] : ['o', 'O', '.', '~'];
  const colors = type === 'burn' ? ['fire', 'air'] : type === 'frost' ? ['water', 'air'] : ['air', 'water', 'fire'];
  const count = type === 'steam' ? 7 : 5;
  return Array.from({ length: count }, (_, index) => {
    const phase = ((now / (type === 'frost' ? 520 : 360)) + index * .23 + seed * .011) % 1;
    const angle = seed + index * 2.399;
    const radius = .7 + (index % 3) * .45;
    return point(entity.x + Math.cos(angle) * radius, entity.y + Math.sin(angle) * radius, glyphs[(index + Math.floor(now / 100)) % glyphs.length], colors[index % colors.length], type === 'frost' ? -Math.sin(phase * Math.PI) * 2 : -phase * 6);
  });
}

export function sampleAmbientSpherePulse(center, now, seed = 0, color = 'air') {
  const phase = ((now / 1100) + seed * .173) % 1;
  const radius = .8 + phase * 2.2;
  const count = 10 + Math.round(radius * 4);
  return Array.from({ length: count }, (_, index) => {
    const angle = index / count * Math.PI * 2 + now / 700;
    return point(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius, ['.', 'o', '+'][index % 3], color, -Math.sin(phase * Math.PI));
  });
}
