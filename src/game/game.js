import { ELEMENTS, INITIAL_ENEMY_COUNT, PLAYER_MAX_HEALTH } from '../config.js';
import { BASE_SPELLS, ORDERED_COMBINATION_COUNT, getSpell } from '../data/spells.js';
import { createEnemy, distance } from './entities.js';
import { AsciiRenderer } from './renderer.js';
import { SpellSystem } from './spell-system.js';
import { createWorld } from './world.js';
import { updateProjectiles } from './abilities/projectiles.js';
import { canCastFormula, maxSpellLevel } from './progression.js';
import { damageEntity, healEntity } from './combat-feedback.js';
import { isAbilityReady } from './cooldowns.js';
import { reflectedMeleeDamage } from './abilities/advanced-abilities.js';

const MOVE_KEYS = new Set(['w', 'a', 's', 'd']);
const MOVE_DURATION = 145;

const PHYSICAL_KEYS = Object.freeze({
  KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
  KeyQ: 'q', KeyE: 'e', KeyR: 'r',
  KeyZ: 'z', KeyX: 'x', KeyC: 'c', KeyV: 'v',
  Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
  Numpad1: '1', Numpad2: '2', Numpad3: '3', Numpad4: '4', Numpad5: '5',
  Escape: 'escape',
});

export function inputKeyFromEvent(event) {
  return PHYSICAL_KEYS[event.code] ?? event.key.toLowerCase();
}

export function movementVectorFromKeys(keys) {
  const vertical = (keys.has('s') ? 1 : 0) - (keys.has('w') ? 1 : 0);
  const horizontal = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0);
  if (vertical === 0 && horizontal === 0) return null;
  return {
    x: Math.sign(vertical + horizontal),
    y: Math.sign(vertical - horizontal),
    screenX: horizontal,
    screenY: vertical,
  };
}

export class Game {
  constructor(documentRef = document) {
    this.document = documentRef;
    this.ui = {
      viewport: documentRef.querySelector('#viewport'),
      statusLine: documentRef.querySelector('#status-line'),
      coordinates: documentRef.querySelector('#coordinates'),
      worldStatus: documentRef.querySelector('#world-status'),
      sequence: documentRef.querySelector('#sequence'),
      unlockLabel: documentRef.querySelector('#unlock-label'),
      spellName: documentRef.querySelector('#spell-name'),
      spellDescription: documentRef.querySelector('#spell-description'),
      spellCode: documentRef.querySelector('#spell-code'),
      spellTags: documentRef.querySelector('#spell-tags'),
      sphereLevels: documentRef.querySelector('#sphere-levels'),
      healthBar: documentRef.querySelector('#health-bar'),
      healthLabel: documentRef.querySelector('#health-label'),
      shieldLabel: documentRef.querySelector('#shield-label'),
      killCount: documentRef.querySelector('#kill-count'),
      combatLog: documentRef.querySelector('#combat-log'),
      overlay: documentRef.querySelector('#overlay'),
      overlayKicker: documentRef.querySelector('#overlay-kicker'),
      overlayTitle: documentRef.querySelector('#overlay-title'),
      overlayContent: documentRef.querySelector('#overlay-content'),
      closeOverlay: documentRef.querySelector('#close-overlay'),
    };

    const world = createWorld();
    this.state = {
      world,
      player: {
        x: 29, y: 32, visualX: 29, visualY: 32,
        hp: PLAYER_MAX_HEALTH, maxHealth: PLAYER_MAX_HEALTH, shield: 0,
        motion: null, walkFrame: 0, facingX: 0, facingY: 1,
        castStartedAt: 0, castUntil: 0, castDirectionX: 1, castDirectionY: 0,
      },
      enemies: [],
      effects: [],
      fields: [],
      projectiles: [],
      animations: [],
      combatNumbers: [],
      lastCastAt: -Infinity,
      elementLevels: { air: 0, fire: 0, water: 0, earth: 0 },
      unlocked: false,
      input: [],
      preparedSpell: null,
      defeated: 0,
      logEntries: [],
      nextEnemyUpdate: 0,
      gameOver: false,
      log: (message) => this.addLog(message),
    };
    this.renderer = new AsciiRenderer(this.ui.viewport);
    this.spells = new SpellSystem();
    this.pressed = new Set();
    this.queuedMoveKeys = new Set();
    this.nextMoveAt = 0;
    this.lastFrame = 0;
    this.overlayType = null;
  }

  start() {
    for (let i = 0; i < INITIAL_ENEMY_COUNT; i += 1) this.spawnEnemy();
    this.bindEvents();
    this.addLog('Сигнал получен. Найдите стихийные сферы.');
    this.updateHud();
    this.ui.viewport.focus();
    requestAnimationFrame((time) => this.frame(time));
  }

  bindEvents() {
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.pressed.delete(this.inputKey(event)));
    window.addEventListener('blur', () => {
      this.pressed.clear();
      this.queuedMoveKeys.clear();
    });
    this.ui.viewport.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      this.ui.viewport.focus();
      this.castAtPointer(event);
    });
    this.ui.closeOverlay.addEventListener('click', () => this.closeOverlay());
    this.ui.overlay.addEventListener('click', (event) => {
      if (event.target === this.ui.overlay) this.closeOverlay();
    });
  }

  onKeyDown(event) {
    const key = this.inputKey(event);
    if (key === 'escape') {
      this.closeOverlay();
      return;
    }
    if (key === 'e') {
      event.preventDefault();
      this.toggleOverlay('journal');
      return;
    }
    if (key === 'r') {
      event.preventDefault();
      this.toggleOverlay('inventory');
      return;
    }
    if (this.overlayType) return;
    if (MOVE_KEYS.has(key)) {
      event.preventDefault();
      this.pressed.add(key);
      this.queuedMoveKeys.add(key);
      const now = performance.now();
      if (!this.state.player.motion && this.nextMoveAt <= now) this.nextMoveAt = now + 32;
      return;
    }
    if (key === 'q') {
      this.state.input = [];
      this.state.preparedSpell = null;
      this.setStatus('Формула рассеяна.');
      this.updateHud();
      return;
    }
    if (/^[1-5]$/.test(key)) this.enterRune(Number(key));
    if (/^[zxcv]$/.test(key)) this.setStatus('Модификаторы откроются в следующей главе разработки.');
  }

  inputKey(event) {
    return inputKeyFromEvent(event);
  }

  enterRune(key) {
    if (key === 5 && this.state.input.length < 2) {
      this.state.input = [];
      this.setStatus('Ветка хаоса пока запечатана.');
      this.updateHud();
      return;
    }
    if (this.state.input.length < 2 && key > 4) return;
    if (this.state.input.length < 2) {
      const element = ELEMENTS[key];
      const level = this.state.elementLevels[element.id];
      if (level < 1) {
        this.setStatus(`${element.name}: сфера ещё не найдена.`);
        return;
      }
    }
    if (this.state.input.length === 2) {
      const [first, second] = this.state.input;
      const maximum = maxSpellLevel(this.state.elementLevels, first, second);
      if (!canCastFormula(this.state.elementLevels, first, second, key)) {
        this.setStatus(`Уровень ${key} закрыт. Для этой пары доступен уровень 1–${maximum}.`);
        this.updateHud();
        return;
      }
    }
    this.state.input.push(key);
    if (this.state.input.length === 3) {
      const [first, second, level] = this.state.input;
      const spell = getSpell(first, second, level);
      this.state.input = [];
      if (spell) {
        this.state.preparedSpell = spell;
        this.addLog(`Формула ${spell.code}: ${spell.name}.`);
        this.setStatus(`${spell.name} готово. Выберите цель ЛКМ.`);
      }
    }
    this.updateHud();
  }

  tryMove(delta, now = performance.now()) {
    if (this.state.gameOver || this.state.player.motion || !delta) return false;
    const next = { x: this.state.player.x + delta.x, y: this.state.player.y + delta.y };
    const occupied = this.state.enemies.some((enemy) => enemy.x === next.x && enemy.y === next.y);
    if (!this.state.world.isPassable(next.x, next.y) || occupied) {
      this.setStatus('Путь перекрыт.');
      this.nextMoveAt = now + 90;
      return false;
    }
    const from = { x: this.state.player.visualX, y: this.state.player.visualY };
    this.state.player.x = next.x;
    this.state.player.y = next.y;
    this.state.player.facingX = delta.screenX;
    this.state.player.facingY = delta.screenY;
    this.state.player.walkFrame += 1;
    this.state.player.motion = { from, to: next, startedAt: now, duration: MOVE_DURATION, progress: 0 };
    this.nextMoveAt = now + MOVE_DURATION;
    for (const sphere of this.state.world.spheres.filter((item) => item.active && distance(next, item) <= 1.15)) {
      this.collectSphere(sphere, now);
    }
    this.updateHud();
    return true;
  }

  collectSphere(sphere, now = performance.now()) {
    const oldLevel = this.state.elementLevels[sphere.elementId];
    const newLevel = Math.min(5, oldLevel + 1);
    this.state.elementLevels[sphere.elementId] = newLevel;
    this.state.unlocked = true;
    this.state.player.shield = Math.min(40, this.state.player.shield + 6);
    healEntity(this.state, this.state.player, 8, now);
    this.addLog(`${sphere.name}: уровень ${newLevel} / 5.`);
    this.setStatus(`${ELEMENTS[sphere.key].name} усилен до уровня ${newLevel}.`);
    this.ui.worldStatus.textContent = 'СФЕРЫ РЕЗОНИРУЮТ';
    if (newLevel < 5) {
      this.state.world.respawnSphere(sphere, [this.state.player, ...this.state.enemies]);
    } else {
      sphere.active = false;
    }
  }

  castAtPointer(event) {
    if (this.overlayType || this.state.gameOver) return;
    if (!this.state.unlocked) {
      this.setStatus('Без сферы заклинания недоступны.');
      return;
    }
    if (!this.state.preparedSpell) {
      this.setStatus('Сначала введите формулу из трёх цифр.');
      return;
    }
    const now = performance.now();
    if (!isAbilityReady(this.state.lastCastAt, now)) return;
    const camera = { x: this.state.player.visualX, y: this.state.player.visualY };
    const target = this.renderer.pointerToWorld(event, camera);
    const spell = this.state.preparedSpell;
    const castDx = target.x - this.state.player.x;
    const castDy = target.y - this.state.player.y;
    this.state.player.castStartedAt = now;
    this.state.player.castUntil = now + 520;
    this.state.player.castDirectionX = Math.sign(castDx - castDy);
    this.state.player.castDirectionY = Math.sign(castDx + castDy);
    if (!this.state.player.castDirectionX && !this.state.player.castDirectionY) this.state.player.castDirectionY = -1;
    if (this.state.player.castDirectionX) this.state.player.facingX = this.state.player.castDirectionX;
    if (this.state.player.castDirectionY) this.state.player.facingY = this.state.player.castDirectionY;
    const castResult = this.spells.cast(this.state, spell, target, now);
    this.state.lastCastAt = now;
    this.setStatus(`${spell.name} ${castResult.projectile ? 'запущено' : 'применено'}. Способность остаётся выбранной.`);
    this.resolveDefeated();
    this.updateHud();
  }

  frame(now) {
    const delta = Math.min(34, now - this.lastFrame || 16);
    this.lastFrame = now;
    this.update(now, delta);
    this.renderer.render(this.state, now);
    requestAnimationFrame((time) => this.frame(time));
  }

  update(now, deltaMs) {
    this.updatePlayerMotion(now);
    if (!this.overlayType && !this.state.gameOver && !this.state.player.motion && now >= this.nextMoveAt) {
      const intentKeys = new Set([...this.pressed, ...this.queuedMoveKeys]);
      const direction = movementVectorFromKeys(intentKeys);
      this.queuedMoveKeys.clear();
      if (direction) this.tryMove(direction, now);
    }
    this.state.effects = this.state.effects.filter((effect) => effect.expiresAt > now);
    this.state.fields = this.state.fields.filter((field) => field.expiresAt > now);
    this.state.combatNumbers = this.state.combatNumbers.filter((number) => number.expiresAt > now);
    this.state.animations = this.state.animations.filter((animation) => animation.expiresAt > now);
    updateProjectiles(this.state, now, deltaMs);
    this.tickFields(now);
    this.tickEnemies(now);
    this.resolveDefeated();
  }

  updatePlayerMotion(now) {
    const player = this.state.player;
    if (!player.motion) return;
    const progress = Math.min(1, (now - player.motion.startedAt) / player.motion.duration);
    const eased = progress;
    player.visualX = player.motion.from.x + (player.motion.to.x - player.motion.from.x) * eased;
    player.visualY = player.motion.from.y + (player.motion.to.y - player.motion.from.y) * eased;
    player.motion.progress = progress;
    if (progress >= 1) {
      player.visualX = player.x;
      player.visualY = player.y;
      player.motion = null;
    }
  }

  tickFields(now) {
    for (const field of this.state.fields) {
      if (field.followPlayer) {
        field.x = this.state.player.visualX;
        field.y = this.state.player.visualY;
      }
      if (now < field.nextTick) continue;
      field.nextTick = now + 550;
      for (const enemy of this.state.enemies) {
        if (distance(field, enemy) <= field.radius + 0.5) damageEntity(this.state, enemy, field.damage, now);
      }
      if (Number.isFinite(field.remainingTicks)) {
        field.remainingTicks -= 1;
        if (field.remainingTicks <= 0) field.expiresAt = now;
      }
    }
  }

  tickEnemies(now) {
    for (const enemy of this.state.enemies) {
      if (enemy.burnUntil > now && enemy.nextBurnTick <= now) {
        damageEntity(this.state, enemy, 3, now);
        enemy.nextBurnTick = now + 450;
      }
    }
    if (now < this.state.nextEnemyUpdate || this.state.gameOver || !this.state.unlocked) return;
    this.state.nextEnemyUpdate = now + 100;

    for (const enemy of this.state.enemies) {
      if (enemy.stunnedUntil > now) continue;
      const gap = distance(enemy, this.state.player);
      if (gap <= 1.2 && enemy.nextAttackAt <= now) {
        this.damagePlayer(enemy.damage, enemy);
        enemy.nextAttackAt = now + enemy.attackInterval;
        continue;
      }
      if (gap > enemy.visionRange || enemy.nextMoveAt > now) continue;
      const dx = Math.sign(this.state.player.x - enemy.x);
      const dy = Math.sign(this.state.player.y - enemy.y);
      const options = Math.abs(this.state.player.x - enemy.x) > Math.abs(this.state.player.y - enemy.y)
        ? [{ x: enemy.x + dx, y: enemy.y }, { x: enemy.x, y: enemy.y + dy }]
        : [{ x: enemy.x, y: enemy.y + dy }, { x: enemy.x + dx, y: enemy.y }];
      const canTraverse = (point) => enemy.flying
        ? this.state.world.getTile(point.x, point.y) !== 'void'
        : this.state.world.isPassable(point.x, point.y);
      const next = options.find((point) => canTraverse(point)
        && !this.state.enemies.some((other) => other !== enemy && other.x === point.x && other.y === point.y)
        && !(point.x === this.state.player.x && point.y === this.state.player.y));
      if (next) {
        enemy.x = next.x;
        enemy.y = next.y;
      }
      enemy.nextMoveAt = now + enemy.moveInterval * (enemy.slowedUntil > now ? 1.8 : 1);
    }
  }

  damagePlayer(amount, source = null) {
    const now = performance.now();
    const incomingDamage = amount;
    let remaining = amount;
    if (this.state.player.shield > 0) {
      const absorbed = Math.min(this.state.player.shield, remaining);
      this.state.player.shield -= absorbed;
      remaining -= absorbed;
    }
    damageEntity(this.state, this.state.player, remaining, now);
    reflectedMeleeDamage(this.state, source, incomingDamage, now);
    if (remaining) this.addLog(`Враг наносит ${remaining} урона.`);
    if (this.state.player.hp <= 0) {
      this.state.gameOver = true;
      this.setStatus('СИГНАЛ ПОТЕРЯН. Обновите страницу, чтобы начать заново.');
      this.ui.worldStatus.textContent = 'СИГНАЛ ПОТЕРЯН';
    }
    this.updateHud();
  }

  resolveDefeated() {
    const defeated = this.state.enemies.filter((enemy) => enemy.hp <= 0);
    if (!defeated.length) return;
    this.state.enemies = this.state.enemies.filter((enemy) => enemy.hp > 0);
    for (const enemy of defeated) {
      this.state.defeated += 1;
      this.addLog(`${enemy.name} уничтожен. Новая цель обнаружена.`);
      this.spawnEnemy();
    }
    this.updateHud();
  }

  spawnEnemy() {
    const excluded = [this.state.player, ...this.state.world.spheres.filter((sphere) => sphere.active), ...this.state.enemies];
    const isInitialWave = this.state.defeated === 0 && this.state.enemies.length < INITIAL_ENEMY_COUNT;
    const position = this.state.world.findSpawn(excluded, 7, isInitialWave ? 11 : null);
    this.state.enemies.push(createEnemy(position, this.state.defeated + 1));
  }

  updateHud() {
    const player = this.state.player;
    this.ui.coordinates.textContent = `X:${String(player.x).padStart(2, '0')} Y:${String(player.y).padStart(2, '0')}`;
    this.ui.healthLabel.textContent = `${player.hp} / ${player.maxHealth}`;
    this.ui.healthBar.style.width = `${(player.hp / player.maxHealth) * 100}%`;
    this.ui.shieldLabel.textContent = String(player.shield);
    this.ui.killCount.textContent = `ЦЕЛЕЙ: ${this.state.defeated}`;
    this.ui.unlockLabel.textContent = this.state.unlocked ? 'АКТИВНО' : 'ЗАБЛОКИРОВАНО';
    this.ui.unlockLabel.classList.toggle('active', this.state.unlocked);
    const elementSlot = (key) => {
      const element = ELEMENTS[key];
      return element
        ? `<span class="element-${element.id}">${element.glyph} ${element.short} L${this.state.elementLevels[element.id]}</span>`
        : '<span>?</span>';
    };
    this.ui.sequence.innerHTML = `${elementSlot(this.state.input[0])}<b>+</b>${elementSlot(this.state.input[1])}<b>+</b><span>${this.state.input[2] ?? '?'}</span>`;
    this.ui.sphereLevels.innerHTML = Object.values(ELEMENTS).map((element) =>
      `<span class="element-${element.id}">${element.glyph} ${element.short} ${this.state.elementLevels[element.id]}/5</span>`).join('');
    const spell = this.state.preparedSpell;
    this.ui.spellName.textContent = spell?.name ?? 'Нет заклинания';
    this.ui.spellDescription.textContent = spell?.description ?? (this.state.unlocked
      ? 'Введите две сферы и уровень.'
      : 'Соберите формулу после получения сферы.');
    this.ui.spellCode.textContent = spell?.code ?? '---';
    this.ui.spellTags.innerHTML = spell
      ? `<span>УРОВЕНЬ ${spell.level}</span>${spell.elements.map((element) => `<span>${element.name.toUpperCase()}</span>`).join('')}`
      : '';
  }

  addLog(message) {
    this.state.logEntries.unshift(message);
    this.state.logEntries = this.state.logEntries.slice(0, 5);
    this.ui.combatLog.innerHTML = this.state.logEntries.map((entry) => `<li>${entry}</li>`).join('');
  }

  setStatus(message) {
    this.ui.statusLine.textContent = message;
  }

  toggleOverlay(type) {
    if (this.overlayType === type) {
      this.closeOverlay();
      return;
    }
    this.overlayType = type;
    this.pressed.clear();
    this.queuedMoveKeys.clear();
    this.ui.overlay.hidden = false;
    if (type === 'journal') this.renderJournal();
    else this.renderInventory();
  }

  closeOverlay() {
    this.overlayType = null;
    this.ui.overlay.hidden = true;
    this.ui.viewport.focus();
  }

  renderJournal() {
    const collected = Object.values(this.state.elementLevels).some((level) => level > 0);
    this.ui.overlayKicker.textContent = 'ПОЛЕВОЙ ЖУРНАЛ';
    this.ui.overlayTitle.textContent = 'Задания';
    this.ui.overlayContent.innerHTML = `
      <article class="quest ${collected ? 'done' : ''}">
        <span class="quest-index">01</span>
        <div><h3>${collected ? '[ВЫПОЛНЕНО]' : '[АКТИВНО]'} Голос сферы</h3>
        <p>${collected ? 'Первая сфера пробудила базовую магию.' : 'Найдите одну из четырёх стихийных сфер.'}</p></div>
      </article>
      <article class="quest ${this.state.defeated >= 3 ? 'done' : ''}">
        <span class="quest-index">02</span>
        <div><h3>${this.state.defeated >= 3 ? '[ВЫПОЛНЕНО]' : '[АКТИВНО]'} Полевая проверка</h3>
        <p>Уничтожьте трёх скитальцев. Прогресс: ${Math.min(this.state.defeated, 3)} / 3.</p></div>
      </article>`;
  }

  renderInventory() {
    this.ui.overlayKicker.textContent = 'СУМКА МАГА';
    this.ui.overlayTitle.textContent = 'Инвентарь';
    this.ui.overlayContent.innerHTML = `
      <div class="inventory-grid">
        ${Object.values(ELEMENTS).map((element) => `<article class="inventory-item"><pre class="element-${element.id}"> .-.\n( ${element.glyph} )\n '-'</pre><div><h3>${element.name}</h3><p>УРОВЕНЬ ${this.state.elementLevels[element.id]} / 5</p></div></article>`).join('')}
        <article class="inventory-item"><pre>[###]\n | |</pre><div><h3>Базовые формулы</h3><p>${this.state.unlocked ? `${BASE_SPELLS.length} чар / ${ORDERED_COMBINATION_COUNT} комбинаций` : 'ЗАБЛОКИРОВАНО'}</p></div></article>
        <article class="inventory-item locked"><pre>[ Z ]\n[ X ]</pre><div><h3>Инферно / Растения</h3><p>НЕДОСТУПНО В ЭТОЙ ГЛАВЕ</p></div></article>
        <article class="inventory-item locked"><pre>[ C ]\n[ V ]</pre><div><h3>Свет / Тьма</h3><p>НЕДОСТУПНО В ЭТОЙ ГЛАВЕ</p></div></article>
      </div>
      ${this.state.unlocked ? this.spellIndexMarkup() : ''}`;
  }

  spellIndexMarkup() {
    return `<div class="spell-index"><h3>Открытые базовые чары</h3>${[1, 2, 3, 4, 5].map((level) => `
      <section><h4>УРОВЕНЬ ${level}</h4><p>${BASE_SPELLS.filter((spell) => spell.level === level && spell.key.split('-').every((id) => this.state.elementLevels[id] >= level)).map((spell) => spell.name).join(' / ') || 'пока закрыт'}</p></section>`).join('')}</div>`;
  }
}
