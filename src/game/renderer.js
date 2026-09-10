import { ELEMENTS, VIEWPORT_COLS, VIEWPORT_ROWS } from '../config.js';
import { terrainSample } from './terrain-pattern.js';
import { lightingFromAnimations, sampleAmbientSpherePulse, sampleAnimation, sampleStatusParticles } from './animations/primitives.js';
import { sampleSignatureSpell } from './animations/signature-spells.js';

const COLORS = {
  grass: '#315e3c', grass2: '#4c7953', sand: '#8b815a', water: '#26728a', foam: '#75d5df',
  rock: '#73847a', tree: '#61a364', player: '#d8ffca', enemy: '#f17868', sphere: '#6ae8ff',
  air: '#9beeff', fire: '#ff6a55', earth: '#6ddb76', damage: '#ff4f45', heal: '#62ef82',
  void: '#07100b', ui: '#d9f4df',
  ghost: '#b9e8ea',
};

export const ENEMY_SPRITES = Object.freeze({
  wolf: [
    ' /\\_/\\ ',
    '( o.o )',
    ' / ^ \\ ',
  ],
  goblin: [
    '  .-.-.  ',
    ' / o o \\ ',
    '| \\_^_/ |',
    ' /|===|\\ ',
    '  /   \\  ',
  ],
  orc: [
    '   .---.   ',
    '  /o   o\\  ',
    ' | /[__]\\ | ',
    '/|==||||==|\\',
    ' |  ||||  | ',
    '/__ /\\ __\\',
  ],
  ghost: [
    '  .---.  ',
    ' / o o \\ ',
    '|   ~   |',
    ' \\  ^  / ',
    '  \\.../  ',
  ],
});

export function playerSpriteFor(player, animation = {}) {
  const mode = animation.mode ?? 'idle';
  const frame = animation.frame ?? 0;
  const lookingLeft = player.facingX < 0;
  const eyes = lookingLeft ? '(<  o)' : player.facingX > 0 ? '(o  >)' : '(o  o)';
  const orb = frame % 2 ? '+' : '*';
  const feet = mode === 'walk'
    ? ['   /| \\    ', '  / |  \\   ', '   / |\\    ', '  /  | \\   '][frame % 4]
    : '   / | \\   ';

  if (mode === 'cast' && lookingLeft) {
    return [
      `${orb}      /\\    `,
      '|\\    /__\\   ',
      `| \\  ${eyes}   `,
      '|  \\-/|==|\\  ',
      '|    /_|  |_\\ ',
      `| ${feet.trimStart()}`,
    ];
  }
  if (mode === 'cast') {
    return [
      `    /\\      ${orb}`,
      '   /__\\    /|',
      `   ${eyes}  / |`,
      '  /|==|\\-/  |',
      ' /_|  |_\\   |',
      `${feet} |`,
    ];
  }
  return [
    `    /\\      ${orb}`,
    '   /__\\    /|',
    `   ${eyes}   / |`,
    '  /|==|\\-/  |',
    ' /_|  |_\\   |',
    `${feet} |`,
  ];
}

export function cameraRasterOffset(visualCamera, rasterCamera) {
  return {
    x: (rasterCamera.x - visualCamera.x - rasterCamera.y + visualCamera.y) * 2,
    y: rasterCamera.x - visualCamera.x + rasterCamera.y - visualCamera.y,
  };
}

export class AsciiRenderer {
  constructor(element) {
    this.element = element;
    this.context = element.getContext('2d', { alpha: false });
    this.cols = VIEWPORT_COLS;
    this.rows = VIEWPORT_ROWS;
    this.centerX = Math.floor(this.cols / 2);
    this.centerY = Math.floor(this.rows / 2) + 4;
  }

  project(point, camera) {
    const dx = point.x - camera.x;
    const dy = point.y - camera.y;
    return { x: Math.round(this.centerX + (dx - dy) * 2), y: Math.round(this.centerY + dx + dy) };
  }

  screenToWorld(screenX, screenY, camera) {
    const axis = (screenX - this.centerX) / 2;
    const depth = screenY - this.centerY;
    return {
      x: Math.round(camera.x + (axis + depth) / 2),
      y: Math.round(camera.y + (depth - axis) / 2),
    };
  }

  pointerToWorld(event, camera) {
    const rect = this.element.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.cols;
    const y = ((event.clientY - rect.top) / rect.height) * this.rows;
    return this.screenToWorld(x, y, camera);
  }

  render(state, now) {
    const chars = Array.from({ length: this.rows }, () => Array(this.cols).fill(' '));
    const colors = Array.from({ length: this.rows }, () => Array(this.cols).fill(COLORS.void));
    const visualCamera = {
      x: state.player.visualX ?? state.player.x,
      y: state.player.visualY ?? state.player.y,
    };
    const camera = { x: Math.round(visualCamera.x), y: Math.round(visualCamera.y) };
    const cameraOffset = cameraRasterOffset(visualCamera, camera);
    const plot = (x, y, char, color) => {
      if (x < 0 || y < 0 || x >= this.cols || y >= this.rows || char === ' ') return;
      chars[y][x] = char;
      colors[y][x] = COLORS[color] ?? color ?? COLORS.ui;
    };
    const text = (x, y, value, color) => {
      [...value].forEach((char, index) => plot(x + index, y, char, color));
    };

    for (let sy = 0; sy < this.rows; sy += 1) {
      for (let sx = 0; sx < this.cols; sx += 1) {
        const worldPoint = this.screenToWorld(sx, sy, camera);
        const tile = state.world.getTile(worldPoint.x, worldPoint.y);
        const globalX = sx - this.centerX + (camera.x - camera.y) * 2;
        const globalY = sy - this.centerY + camera.x + camera.y;
        const sample = terrainSample(tile, globalX, globalY, now);
        plot(sx, sy, sample.char, sample.color);
      }
    }

    const drawables = [...state.world.decorations]
      .filter((item) => Math.abs(item.x - camera.x) < 28 && Math.abs(item.y - camera.y) < 28)
      .sort((a, b) => a.x + a.y - (b.x + b.y));

    for (const item of drawables) {
      const screen = this.project(item, camera);
      if (item.type === 'tree') {
        text(screen.x - 2, screen.y - 3, ' /\\ ', 'tree');
        text(screen.x - 3, screen.y - 2, '/###\\', 'tree');
        text(screen.x - 1, screen.y - 1, '||', 'rock');
      } else {
        text(screen.x - 2, screen.y - 1, '/##\\', 'rock');
        text(screen.x - 2, screen.y, '\\__/', 'rock');
      }
    }

    for (const field of state.fields) {
      const pulse = Math.floor(now / 220) % 2 === 0 ? field.glyph : '.';
      for (const point of this.fieldRing(field)) {
        const screen = this.project(point, camera);
        plot(screen.x, screen.y, pulse, field.color);
      }
    }

    for (const projectile of state.projectiles) {
      projectile.trail.forEach((point, index) => {
        const screen = this.project(point, camera);
        const trailFrame = Math.floor(now / 70) + index;
        const glyph = projectile.trailGlyphs?.[trailFrame % projectile.trailGlyphs.length] ?? (index % 2 ? '.' : projectile.glyph);
        const color = projectile.trailColors?.[trailFrame % projectile.trailColors.length] ?? projectile.color;
        plot(screen.x, screen.y, glyph, color);
      });
    }

    for (const sphere of state.world.spheres.filter((item) => item.active)) {
      const screen = this.project(sphere, camera);
      const pulse = Math.sin(now / 180 + sphere.key) > 0 ? sphere.key : '*';
      text(screen.x - 2, screen.y - 2, ' .-. ', sphere.color);
      text(screen.x - 2, screen.y - 1, `( ${pulse} )`, sphere.color);
      text(screen.x - 2, screen.y, " '-' ", sphere.color);
      for (const particle of sampleAmbientSpherePulse(sphere, now, sphere.key, sphere.color)) {
        const pulseScreen = this.project(particle, camera);
        plot(pulseScreen.x, pulseScreen.y + Math.round(particle.screenDy ?? 0), particle.glyph, particle.color);
      }
    }

    for (const enemy of state.enemies.sort((a, b) => a.x + a.y - (b.x + b.y))) {
      const screen = this.project(enemy, camera);
      const sprite = ENEMY_SPRITES[enemy.type] ?? ENEMY_SPRITES.goblin;
      const enemyColor = enemy.type === 'ghost' ? 'ghost' : 'enemy';
      const hover = enemy.flying ? -2 + Math.round(Math.sin(now / 180 + enemy.id.length)) : 0;
      const barWidth = enemy.type === 'orc' ? 9 : enemy.type === 'goblin' ? 7 : 5;
      const health = Math.max(0, Math.ceil((enemy.hp / enemy.maxHealth) * barWidth));
      text(screen.x - Math.floor((barWidth + 2) / 2), screen.y - sprite.length + hover, `[${'#'.repeat(health)}${'.'.repeat(barWidth - health)}]`, enemyColor);
      sprite.forEach((line, row) => text(screen.x - Math.floor(line.length / 2), screen.y - sprite.length + 1 + row + hover, line, enemyColor));
      if (enemy.flying) {
        text(screen.x - 2, screen.y + hover + 1, '. o .', 'air');
        text(screen.x - 1, screen.y + hover + 2, '. .', 'ghost');
      }
      const statusTypes = [];
      if (enemy.burnUntil > now) statusTypes.push('burn');
      if (enemy.slowedUntil > now) statusTypes.push('frost');
      if ((enemy.steamUntil ?? 0) > now) statusTypes.push('steam');
      for (const type of statusTypes) {
        for (const particle of sampleStatusParticles(enemy, type, now)) {
          const particleScreen = this.project(particle, camera);
          plot(particleScreen.x, particleScreen.y + Math.round(particle.screenDy ?? 0), particle.glyph, particle.color);
        }
      }
    }

    for (const effect of state.effects) {
      if (now < (effect.startAt ?? effect.createdAt)) continue;
      const alternate = Math.floor((now - effect.createdAt) / (effect.frameMs ?? 100)) % 2;
      for (const point of effect.points) {
        const screen = this.project(point, camera);
        const glyph = point.glyph ?? effect.glyphs?.[alternate % effect.glyphs.length] ?? (alternate ? effect.glyph : '*');
        plot(screen.x, screen.y, glyph, point.color ?? effect.color);
      }
    }

    for (const animation of state.animations) {
      const particles = animation.type === 'signature-spell'
        ? sampleSignatureSpell(animation, now, state.player)
        : sampleAnimation(animation, now, state.player);
      for (const particle of particles) {
        const screen = this.project(particle, camera);
        plot(screen.x, screen.y + Math.round(particle.screenDy ?? 0), particle.glyph, particle.color);
      }
    }

    for (const projectile of state.projectiles) {
      if (now < projectile.startAt) continue;
      const screen = this.project(projectile, camera);
      const animatedGlyph = projectile.animationGlyphs?.[Math.floor(now / 65) % projectile.animationGlyphs.length] ?? projectile.glyph;
      if (projectile.size >= 3) text(screen.x - 1, screen.y, `(${animatedGlyph})`, projectile.color);
      else if (projectile.size === 2) text(screen.x - 1, screen.y, `${animatedGlyph}${animatedGlyph}`, projectile.color);
      else plot(screen.x, screen.y, animatedGlyph, projectile.color);
    }

    const player = this.project(visualCamera, camera);
    const walking = Boolean(state.player.motion);
    const casting = now < (state.player.castUntil ?? 0);
    const animationMode = casting ? 'cast' : walking ? 'walk' : 'idle';
    const animationFrame = casting
      ? Math.floor((now - state.player.castStartedAt) / 65)
      : walking ? Math.floor((state.player.motion.progress ?? 0) * 4) : Math.floor(now / 420);
    const bob = walking && animationFrame % 2 ? -1 : 0;
    const playerSprite = playerSpriteFor(state.player, { mode: animationMode, frame: animationFrame });
    playerSprite.forEach((line, row) => text(player.x - Math.floor(line.length / 2), player.y - 5 + row + bob, line, 'player'));
    if (casting) {
      const phase = Math.max(0, Math.min(1, (now - state.player.castStartedAt) / (state.player.castUntil - state.player.castStartedAt)));
      const directionX = state.player.castDirectionX || 0;
      const directionY = state.player.castDirectionY || 0;
      for (let step = 1; step <= 3 + Math.round(phase * 4); step += 1) {
        plot(player.x + directionX * (6 + step), player.y - 3 + directionY * step, step % 2 ? '+' : '*', state.preparedSpell?.elements[step % 2]?.color ?? 'air');
      }
    }

    const castElements = state.preparedSpell
      ? [...state.preparedSpell.elements]
      : state.input.slice(0, 2).map((key) => ELEMENTS[key]);
    castElements.forEach((element, index) => {
      const orbit = now / 260 + index * Math.PI;
      const x = player.x + Math.round(Math.cos(orbit) * 4);
      const y = player.y - 9 + Math.round(Math.sin(orbit));
      text(x - 1, y, `(${element.glyph})`, element.color);
    });

    for (const number of state.combatNumbers) {
      const progress = Math.min(1, (now - number.createdAt) / (number.expiresAt - number.createdAt));
      const screen = this.project(number, camera);
      const drift = ((number.id % 3) - 1) * Math.min(2, Math.round(progress * 2));
      text(screen.x - Math.floor(number.text.length / 2) + drift, screen.y - 5 - Math.round(progress * 5), number.text, number.color);
    }

    this.drawBuffer(chars, colors, cameraOffset, lightingFromAnimations(state.animations, now));
  }

  drawBuffer(chars, colors, cameraOffset = { x: 0, y: 0 }, lighting = null) {
    const rect = this.element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const pixelWidth = Math.round(rect.width * dpr);
    const pixelHeight = Math.round(rect.height * dpr);
    if (this.element.width !== pixelWidth || this.element.height !== pixelHeight) {
      this.element.width = pixelWidth;
      this.element.height = pixelHeight;
    }
    const ctx = this.context;
    const cellWidth = rect.width / this.cols;
    const cellHeight = rect.height / this.rows;
    const fontSize = Math.max(4, cellHeight * .96);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#030a07';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.font = `${fontSize}px "Cascadia Mono", Consolas, monospace`;
    ctx.textBaseline = 'top';
    const naturalWidth = Math.max(1, ctx.measureText('M').width);
    ctx.setTransform(dpr * cellWidth / naturalWidth, 0, 0, dpr, 0, 0);
    const usedColors = [...new Set(colors.flat())];
    for (let y = 0; y < this.rows; y += 1) {
      for (const color of usedColors) {
        const row = chars[y].map((char, x) => colors[y][x] === color ? char : ' ').join('');
        if (!row.trim()) continue;
        ctx.fillStyle = color;
        ctx.fillText(row, cameraOffset.x * naturalWidth, (y + cameraOffset.y) * cellHeight);
      }
    }
    if (lighting?.alpha > 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = lighting.alpha;
      ctx.fillStyle = lighting.color;
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.globalAlpha = 1;
    }
  }

  fieldRing(field) {
    const points = [];
    for (let x = -field.radius; x <= field.radius; x += 1) {
      for (let y = -field.radius; y <= field.radius; y += 1) {
        const d = Math.hypot(x, y);
        if (d > field.radius - 0.8 && d <= field.radius + 0.3) points.push({ x: field.x + x, y: field.y + y });
      }
    }
    return points;
  }
}
