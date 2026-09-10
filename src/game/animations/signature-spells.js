const SIGNATURES = Object.freeze({
  'Вакуумный карман': { motif: 'implosion', duration: 1250, radius: 5, glyphs: ['>', '<', ')', '('], colors: ['#d9f7ff', '#7fcce8'] },
  'Горячий воздух': { motif: 'heat', duration: 1550, radius: 5, glyphs: ['~', '^', ':', '.'], colors: ['#ffcf78', '#ff6a45', '#eafaff'] },
  'Давление океана': { motif: 'pressure', duration: 1750, radius: 5, glyphs: ['=', '~', 'O', '|'], colors: ['#4d91ff', '#7ee9ff', '#d9f7ff'] },
  'Воздушная пуля': { motif: 'sonic', duration: 700, radius: 5, glyphs: ['=', '>', ')', '.'], colors: ['#e8ffff', '#9beeff', '#bca77a'] },
  'Живой огонь': { motif: 'serpent', duration: 1400, radius: 4, glyphs: ['S', '~', '*', '@'], colors: ['#ff452f', '#ff9f45', '#fff09a'] },
  'Испарение': { motif: 'boil', duration: 1800, radius: 5, glyphs: ['o', 'O', '~', '^'], colors: ['#7ee9ff', '#f6ffff', '#ff8a55'] },
  'Плавление': { motif: 'melt', duration: 1900, radius: 5, glyphs: ['v', '~', ':', '#'], colors: ['#ff4b2e', '#ffb347', '#8f7045'] },
  'Гейзер': { motif: 'geyser', duration: 1450, radius: 5, glyphs: ['|', '!', 'O', '~'], colors: ['#3c8cff', '#7ee9ff', '#f1ffff'] },
  'Подземный взрыв': { motif: 'underground', duration: 1550, radius: 5, glyphs: ['_', '#', 'o', '^'], colors: ['#8d754d', '#68a9ff', '#d5c08a'] },
  'Разлом': { motif: 'fissure', duration: 2100, radius: 7, glyphs: ['#', '/', '\\', '^'], colors: ['#d0a85f', '#ff8755', '#6e4f35'] },
  'Торнадо': { motif: 'cyclone', duration: 2300, radius: 6, glyphs: ['(', ')', '@', '~'], colors: ['#dffaff', '#8edff2', '#ffffff'] },
  'Огненный смерч': { motif: 'fireCyclone', duration: 2400, radius: 6, glyphs: ['^', '*', '@', ')'], colors: ['#ff3c28', '#ff9b3d', '#fff19a'] },
  'Водоворот': { motif: 'whirlpool', duration: 2200, radius: 6, glyphs: ['~', 'O', 'o', ')'], colors: ['#246bff', '#52cfff', '#d9f7ff'] },
  'Резонанс': { motif: 'resonance', duration: 1900, radius: 6, glyphs: ['=', '+', '#', '.'], colors: ['#b9f6ff', '#d2b477', '#ffffff'] },
  'Плазменный луч': { motif: 'beam', duration: 850, radius: 7, glyphs: ['=', '#', '+', '*'], colors: ['#fffbd1', '#ff4e38', '#a8f5ff'] },
  'Термический шок': { motif: 'thermal', duration: 1300, radius: 5, glyphs: ['O', '*', '+', 'x'], colors: ['#4a8fff', '#ff432f', '#f5ffff'] },
  'Огненный дождь': { motif: 'meteorRain', duration: 2200, radius: 6, glyphs: ['|', '*', 'o', '^'], colors: ['#ff422e', '#ffad42', '#8e6542'] },
  'Осьминог': { motif: 'tentacles', duration: 2100, radius: 6, glyphs: ['S', '~', 'O', 'o'], colors: ['#238cff', '#55d8ff', '#c9f7ff'] },
  'Кавитация': { motif: 'cavitation', duration: 1950, radius: 6, glyphs: ['o', 'O', '.', '*'], colors: ['#4d91ff', '#dffaff', '#ffcf90'] },
  'Тектонический сдвиг': { motif: 'tectonic', duration: 2300, radius: 7, glyphs: ['#', '=', '/', '^'], colors: ['#d1ad69', '#8f6f42', '#dffaff'] },
  'Атмосферный коллапс': { motif: 'collapse', duration: 2500, radius: 8, glyphs: ['(', ')', '<', '>', '@'], colors: ['#efffff', '#a1dded', '#668a9a'] },
  'Огненный фронт': { motif: 'fireWall', duration: 1900, radius: 7, glyphs: ['^', '*', '#', '>'], colors: ['#ff3625', '#ff8d36', '#ffe57e'] },
  'Воздушное зеркало': { motif: 'mirror', duration: 2700, radius: 6, glyphs: ['/', '\\', '+', 'O'], colors: ['#f5ffff', '#8eeaff', '#6d9cff'] },
  'Абсолютная тишина': { motif: 'silence', duration: 2800, radius: 8, glyphs: ['.', '_', 'o'], colors: ['#304457', '#172331', '#94adba'] },
  'Солнцепад': { motif: 'sunfall', duration: 2400, radius: 8, glyphs: ['@', '*', '+', '^'], colors: ['#fff4a6', '#ffad36', '#ff3e25'] },
  'Гидроудар': { motif: 'hydro', duration: 2100, radius: 7, glyphs: ['O', '~', '=', '.'], colors: ['#2f79ff', '#61dfff', '#f1ffff'] },
  'Магматический катаклизм': { motif: 'magma', duration: 2900, radius: 8, glyphs: ['#', '*', '^', 'o'], colors: ['#ff3625', '#ff9c35', '#7b5135'] },
  'Водяная сфера': { motif: 'waterOrbit', duration: 4800, radius: 6, glyphs: ['O', 'o', '~', '+'], colors: ['#3c8cff', '#67e5ff', '#efffff'] },
  'Струи': { motif: 'jets', duration: 1800, radius: 8, glyphs: ['=', '~', '!', '>'], colors: ['#3486ff', '#71e6ff', '#dffaff'] },
  'Геошторм': { motif: 'geostorm', duration: 3000, radius: 8, glyphs: ['#', 'o', '/', '^'], colors: ['#d7b46e', '#8b6a42', '#c6f5ff'] },
});

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const wrapIndex = (value, length) => ((value % length) + length) % length;
const makePoint = (x, y, glyph, color, screenDy = 0) => ({ x, y, glyph, color, screenDy });

function basis(animation) {
  const dx = animation.target.x - animation.origin.x;
  const dy = animation.target.y - animation.origin.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  return { dx, dy, length, ux: dx / length, uy: dy / length, nx: -dy / length, ny: dx / length };
}

function ring(points, center, radius, count, profile, phase = 0, screenDy = 0) {
  for (let index = 0; index < count; index += 1) {
    const angle = index / count * Math.PI * 2 + phase;
    points.push(makePoint(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius, profile.glyphs[index % profile.glyphs.length], profile.colors[index % profile.colors.length], screenDy));
  }
}

function ray(points, center, angle, length, profile, phase = 0, lift = 0) {
  for (let step = 1; step <= length; step += 1) {
    points.push(makePoint(center.x + Math.cos(angle) * step, center.y + Math.sin(angle) * step, profile.glyphs[wrapIndex(step + Math.floor(phase * 8), profile.glyphs.length)], profile.colors[step % profile.colors.length], -lift * step));
  }
}

function spiral(points, center, radius, turns, profile, phase, height = 0) {
  const count = Math.ceil(radius * 16);
  for (let index = 0; index < count; index += 1) {
    const ratio = index / count;
    const angle = ratio * Math.PI * 2 * turns + phase;
    points.push(makePoint(center.x + Math.cos(angle) * radius * ratio, center.y + Math.sin(angle) * radius * ratio, profile.glyphs[index % profile.glyphs.length], profile.colors[index % profile.colors.length], -height * ratio));
  }
}

function line(points, animation, profile, phase, width = 0) {
  const vector = basis(animation);
  const count = Math.ceil(vector.length * 2);
  for (let index = 0; index <= count; index += 1) {
    const ratio = index / count;
    const wobble = width ? Math.sin(index * 2.3 + phase) * width : 0;
    points.push(makePoint(animation.origin.x + vector.dx * ratio + vector.nx * wobble, animation.origin.y + vector.dy * ratio + vector.ny * wobble, profile.glyphs[wrapIndex(index, profile.glyphs.length)], profile.colors[index % profile.colors.length]));
  }
}

function signaturePoints(animation, now) {
  const profile = animation.profile;
  const t = clamp01((now - animation.createdAt) / profile.duration);
  const phase = t * Math.PI * 2;
  const center = animation.followPlayer && animation.player ? animation.player : animation.target;
  const points = [];

  switch (profile.motif) {
    case 'implosion':
      for (let spoke = 0; spoke < 12; spoke += 1) ray(points, center, spoke / 12 * Math.PI * 2, profile.radius * (1 - t) + 1, profile, phase);
      ring(points, center, profile.radius * (1 - t) + .5, 28, profile, -phase);
      break;
    case 'heat':
      for (let column = -4; column <= 4; column += 1) for (let level = 0; level < 7; level += 1) points.push(makePoint(center.x + column * .7 + Math.sin(phase * 3 + level) * .4, center.y + column * .25, profile.glyphs[(column + level + 20) % profile.glyphs.length], profile.colors[(level + 2) % profile.colors.length], -level - t * 3));
      break;
    case 'pressure':
      for (let layer = 0; layer < 6; layer += 1) ring(points, center, profile.radius - layer * .7, 24 - layer * 2, profile, 0, -8 * (1 - t) - layer);
      break;
    case 'sonic':
      line(points, animation, profile, phase, .15);
      for (let wave = 1; wave <= 3; wave += 1) ring(points, center, wave * 1.2 + t, 12 + wave * 4, profile, phase);
      break;
    case 'serpent':
      for (let index = 0; index < 30; index += 1) { const ratio = index / 29; const angle = phase * 2 + ratio * 8; points.push(makePoint(center.x + Math.cos(angle) * profile.radius * ratio, center.y + Math.sin(angle) * profile.radius * ratio, profile.glyphs[index % profile.glyphs.length], profile.colors[index % profile.colors.length], -Math.sin(ratio * Math.PI) * 4)); }
      break;
    case 'boil':
      for (let index = 0; index < 35; index += 1) { const angle = index * 2.399; const r = profile.radius * ((index % 7) / 7); const rise = (t + index * .13) % 1; points.push(makePoint(center.x + Math.cos(angle) * r, center.y + Math.sin(angle) * r, profile.glyphs[index % profile.glyphs.length], profile.colors[index % profile.colors.length], -rise * 9)); }
      break;
    case 'melt':
      ring(points, center, profile.radius * (.7 + t * .3), 35, profile, phase * .2);
      for (let index = -5; index <= 5; index += 1) points.push(makePoint(center.x + index * .7, center.y + Math.sin(index + phase) * 1.4, profile.glyphs[(index + 20) % profile.glyphs.length], profile.colors[(index + 20) % profile.colors.length], Math.abs(index % 3) + t * 3));
      break;
    case 'geyser':
      for (let level = 0; level < 12; level += 1) for (let side = -1; side <= 1; side += 1) points.push(makePoint(center.x + side * (.4 + level * .08) + Math.sin(phase * 4 + level) * .25, center.y + side * .2, profile.glyphs[(level + side + 8) % profile.glyphs.length], profile.colors[(level + side + 8) % profile.colors.length], -level));
      ring(points, center, 2.5 + Math.sin(phase) * .4, 24, profile, phase, -10);
      break;
    case 'underground':
      ring(points, center, 1 + t * 4, 30, profile, phase);
      for (let index = 0; index < 18; index += 1) { const angle = index * 2.399; const r = 1 + t * profile.radius; points.push(makePoint(center.x + Math.cos(angle) * r, center.y + Math.sin(angle) * r, profile.glyphs[index % profile.glyphs.length], profile.colors[index % profile.colors.length], -Math.sin(t * Math.PI) * (4 + index % 5))); }
      break;
    case 'fissure':
      line(points, animation, profile, phase * 3, 1.2 + t);
      line(points, { ...animation, origin: { x: animation.origin.x + .5, y: animation.origin.y - .5 } }, profile, -phase * 2, .6);
      break;
    case 'cyclone': case 'fireCyclone':
      for (let level = 0; level < 12; level += 1) { const r = .5 + level * .42; ring(points, center, r, 3, profile, phase * 5 + level, -level * .75); }
      break;
    case 'whirlpool':
      spiral(points, center, profile.radius, 3.5, profile, -phase * 3);
      ring(points, center, 1 + (1 - t) * 4, 28, profile, phase);
      break;
    case 'resonance':
      for (let wave = 0; wave < 5; wave += 1) ring(points, center, ((t + wave / 5) % 1) * profile.radius, 16 + wave * 4, profile, wave % 2 ? phase : -phase);
      for (let axis = 0; axis < 4; axis += 1) ray(points, center, axis * Math.PI / 2, profile.radius, profile, phase);
      break;
    case 'beam': {
      const vector = basis(animation); line(points, animation, profile, phase, .15);
      for (let index = 0; index < 25; index += 1) { const ratio = index / 24; const side = Math.sin(index * 3 + phase * 8) * .8; points.push(makePoint(animation.origin.x + vector.dx * ratio + vector.nx * side, animation.origin.y + vector.dy * ratio + vector.ny * side, profile.glyphs[index % profile.glyphs.length], profile.colors[(index + 1) % profile.colors.length], -Math.sin(ratio * Math.PI))); }
      break;
    }
    case 'thermal':
      for (let side = -1; side <= 1; side += 2) for (let index = 0; index < 22; index += 1) { const angle = side * (index / 22 * Math.PI + phase); points.push(makePoint(center.x + Math.cos(angle) * profile.radius * t, center.y + Math.sin(angle) * profile.radius * t, profile.glyphs[index % profile.glyphs.length], side < 0 ? profile.colors[0] : profile.colors[1], -Math.sin(t * Math.PI) * 3)); }
      break;
    case 'meteorRain':
      for (let index = 0; index < 28; index += 1) { const angle = index * 2.399; const r = profile.radius * ((index % 9) / 9); const fall = (t + index * .09) % 1; points.push(makePoint(center.x + Math.cos(angle) * r, center.y + Math.sin(angle) * r, profile.glyphs[index % profile.glyphs.length], profile.colors[index % profile.colors.length], -12 + fall * 12)); }
      break;
    case 'tentacles':
      for (let arm = 0; arm < 8; arm += 1) for (let step = 1; step <= 8; step += 1) { const angle = arm * Math.PI / 4 + Math.sin(phase * 3 + step * .7) * .35; points.push(makePoint(center.x + Math.cos(angle) * step * .75, center.y + Math.sin(angle) * step * .75, profile.glyphs[(arm + step) % profile.glyphs.length], profile.colors[arm % profile.colors.length], -Math.sin(step * .7 + phase) * 2)); }
      break;
    case 'cavitation':
      for (let index = 0; index < 45; index += 1) { const angle = index * 2.399; const base = profile.radius * ((index % 11) / 11); const collapse = Math.abs(Math.sin(phase + index)); points.push(makePoint(center.x + Math.cos(angle) * base * collapse, center.y + Math.sin(angle) * base * collapse, profile.glyphs[(index + Math.floor(t * 10)) % profile.glyphs.length], profile.colors[index % profile.colors.length], -collapse * 3)); }
      break;
    case 'tectonic':
      for (let slab = -4; slab <= 4; slab += 1) for (let edge = -3; edge <= 3; edge += 1) points.push(makePoint(center.x + slab * 1.2, center.y + edge * .8 + Math.sin(slab + phase) * 1.2, profile.glyphs[(slab + edge + 20) % profile.glyphs.length], profile.colors[(slab + 10) % profile.colors.length], -Math.abs(Math.sin(phase + slab)) * 4));
      break;
    case 'collapse':
      for (let shell = 0; shell < 5; shell += 1) ring(points, center, profile.radius * (1 - t) + shell * .45, 30 - shell * 3, profile, phase + shell, -Math.sin(t * Math.PI) * shell * 2);
      break;
    case 'fireWall': {
      const vector = basis(animation); const travel = t * vector.length;
      for (let offset = -6; offset <= 6; offset += 1) for (let level = 0; level < 5; level += 1) points.push(makePoint(animation.origin.x + vector.ux * travel + vector.nx * offset, animation.origin.y + vector.uy * travel + vector.ny * offset, profile.glyphs[(offset + level + 20) % profile.glyphs.length], profile.colors[(level + 1) % profile.colors.length], -level * 1.2));
      break;
    }
    case 'mirror':
      for (let side = 0; side < 4; side += 1) { const angle = phase + side * Math.PI / 2; ray(points, center, angle, profile.radius, profile, phase); ray(points, center, angle + Math.PI / 4, profile.radius * .7, profile, -phase); }
      ring(points, center, profile.radius * .75, 32, profile, -phase * 2);
      break;
    case 'silence':
      for (let shell = 0; shell < 4; shell += 1) ring(points, center, profile.radius * ((t + shell * .22) % 1), 20 + shell * 5, profile, 0);
      for (let index = 0; index < 18; index += 1) points.push(makePoint(center.x + Math.cos(index * 2.399) * profile.radius * .7, center.y + Math.sin(index * 2.399) * profile.radius * .7, '.', profile.colors[index % profile.colors.length], 0));
      break;
    case 'sunfall':
      ring(points, center, 2.2 + Math.sin(phase) * .3, 38, profile, phase, -14 * (1 - t));
      for (let spoke = 0; spoke < 12; spoke += 1) ray(points, center, spoke * Math.PI / 6, profile.radius * t, profile, phase, .25);
      break;
    case 'hydro':
      for (let shell = 0; shell < 4; shell += 1) ring(points, center, profile.radius * Math.abs(Math.sin(phase / 2 + shell * .3)), 22 + shell * 7, profile, -phase, -Math.sin(t * Math.PI) * (5 - shell));
      break;
    case 'magma':
      for (let vent = 0; vent < 9; vent += 1) { const angle = vent * 2.399; const r = (vent % 4 + 1) * 1.7; ray(points, center, angle, r, profile, phase, .3); for (let level = 0; level < 6; level += 1) points.push(makePoint(center.x + Math.cos(angle) * r, center.y + Math.sin(angle) * r, profile.glyphs[(vent + level) % profile.glyphs.length], profile.colors[(vent + level) % profile.colors.length], -Math.abs(Math.sin(phase + vent)) * level)); }
      break;
    case 'waterOrbit':
      ring(points, center, profile.radius, 42, profile, phase * 2);
      for (let orb = 0; orb < 5; orb += 1) { const angle = phase * (orb % 2 ? -2 : 2) + orb * Math.PI * 2 / 5; ring(points, { x: center.x + Math.cos(angle) * profile.radius * .7, y: center.y + Math.sin(angle) * profile.radius * .7 }, .8, 10, profile, -phase, -2 - orb % 2); }
      break;
    case 'jets':
      for (let jet = 0; jet < 12; jet += 1) ray(points, center, jet * Math.PI / 6 + Math.sin(phase * 2 + jet) * .18, profile.radius * (.45 + t * .55), profile, phase, .35);
      break;
    case 'geostorm':
      for (let rock = 0; rock < 38; rock += 1) { const band = 2 + rock % 4; const angle = phase * (band % 2 ? 2 : -1.4) + rock * 2.399; points.push(makePoint(center.x + Math.cos(angle) * band * 1.7, center.y + Math.sin(angle) * band * 1.7, profile.glyphs[rock % profile.glyphs.length], profile.colors[rock % profile.colors.length], -2 - Math.sin(angle * 2) * 5)); }
      break;
    default: break;
  }
  return points;
}

export function spawnSignatureSpell(state, spellName, origin, target, now, options = {}) {
  const profile = SIGNATURES[spellName];
  if (!profile) return false;
  state.animations ??= [];
  state.animations.push({ type: 'signature-spell', spellName, profile, origin: { x: origin.x, y: origin.y }, target: { x: target.x, y: target.y }, followPlayer: options.followPlayer ?? (spellName === 'Водяная сфера' || spellName === 'Воздушное зеркало'), createdAt: now, expiresAt: now + profile.duration });
  return true;
}

export function sampleSignatureSpell(animation, now, player = null) {
  if (animation.type !== 'signature-spell' || now < animation.createdAt || now >= animation.expiresAt) return [];
  animation.player = player;
  return signaturePoints(animation, now);
}

const VOLLEYS = new Set(['Огненный дождь', 'Огненный фронт', 'Струи']);

export function spawnProjectileSignature(state, spellName, origin, target, now) {
  state.signatureTimes ??= {};
  if (VOLLEYS.has(spellName) && now - (state.signatureTimes[spellName] ?? -Infinity) < 750) return false;
  state.signatureTimes[spellName] = now;
  return spawnSignatureSpell(state, spellName, origin, target, now);
}

export const SIGNATURE_SPELL_NAMES = Object.freeze(Object.keys(SIGNATURES));
export const SIGNATURE_MOTIFS = Object.freeze(Object.fromEntries(
  Object.entries(SIGNATURES).map(([spellName, profile]) => [spellName, profile.motif]),
));
