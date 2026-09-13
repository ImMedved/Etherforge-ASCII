import {
  DASH_COOLDOWN_MS,
  DASH_DURATION_MS,
  DASH_SPEED_MULTIPLIER,
  ELEMENTS,
  INITIAL_ENEMY_COUNT,
  PLAYER_COLLISION_RADIUS,
  PLAYER_MANA_REGEN,
  PLAYER_MAX_MANA,
  PLAYER_MAX_HEALTH,
  PLAYER_MOVE_SPEED,
} from '../config.js';
import { BASE_SPELLS, ORDERED_COMBINATION_COUNT, getSpell } from '../data/spells.js';
import { createEnemy, distance } from './entities.js';
import { AsciiRenderer } from './renderer.js';
import { abilityRange, clampTarget, SpellSystem, spellTargeting } from './spell-system.js';
import { createWorld } from './world.js';
import { updateProjectiles } from './abilities/projectiles.js';
import { canCastFormula, maxSpellLevel } from './progression.js';
import { damageEntity, healEntity } from './combat-feedback.js';
import { abilityAvailability, commitAbilityCost, cooldownRemaining } from './cooldowns.js';
import { moveActor, normalizeVector } from './movement.js';
import { allActors, createActorAbilityContext, hostileActors } from './actor-abilities.js';
import {
  ACTIONS,
  CONTROL_LAYOUTS,
  actionForCode,
  createControlProfile,
  displayCode,
  rebindAction,
  runeIndexForCode,
  setControlLayout
} from './controls.js';
import {
  createCampaignProgression,
  completeMission,
  grantSphere,
  markStoryFlag,
  normalizeCampaignProgression
} from './campaign-progression.js';
import {
  createPrologueState,
  createPrologueStateAtPhase,
  normalizePrologueState,
  PROLOGUE_PHASES,
  prologueObjective,
  prologueTarget,
  recordPrologueChest,
  recordPrologueDefeat,
  recordPrologueEquipment,
  recordPrologueEnemyDefeat,
  recordPrologueHouse,
  recordPrologueHubSave,
  recordPrologueHubReturn,
  recordPrologueLocation,
  recordPrologueSphere
} from './prologue.js';
import {
  PROLOGUE_CHECKPOINTS,
  PROLOGUE_DIALOGUE,
  PROLOGUE_ENCOUNTERS,
  PROLOGUE_HOUSES,
  PROLOGUE_VILLAGES
} from '../data/prologue.js';
import { loadGame, saveGame } from './save-game.js';
import {
  EQUIPMENT_SLOTS,
  RARITIES,
  compareItems,
  createEmptyEquipment,
  equipItem,
  equipmentBonuses,
  generateItem
} from './items.js';
import {
  STAT_DEFINITIONS,
  applyCharacterStats,
  calculateCharacterStats,
  formatStatValue
} from './character-stats.js';

const MOVE_KEYS = new Set(['w', 'a', 's', 'd']);
const MOVEMENT_ACTIONS = new Set(['moveUp', 'moveDown', 'moveLeft', 'moveRight']);

const PHYSICAL_KEYS = Object.freeze({
  KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
  KeyQ: 'q', KeyE: 'e', KeyR: 'r',
  KeyZ: 'z', KeyX: 'x', KeyC: 'c', KeyV: 'v',
  Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
  Numpad1: '1', Numpad2: '2', Numpad3: '3', Numpad4: '4', Numpad5: '5',
  Space: 'space',
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

function movementVectorFromActionSet(actions) {
  const keys = new Set();
  if (actions.has('moveUp') || actions.has('w')) keys.add('w');
  if (actions.has('moveDown') || actions.has('s')) keys.add('s');
  if (actions.has('moveLeft') || actions.has('a')) keys.add('a');
  if (actions.has('moveRight') || actions.has('d')) keys.add('d');
  return movementVectorFromKeys(keys);
}

export function directionArrow(from, to) {
  if (!to) return '';
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const arrows = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
  const index = Math.round(angle / (Math.PI / 4));
  return arrows[(index + 8) % 8];
}

export class Game {
  constructor(documentRef = document, storage = globalThis.localStorage ?? null) {
    this.document = documentRef;
    this.storage = storage;
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
      spellResourceStatus: documentRef.querySelector('#spell-resource-status'),
      sphereLevels: documentRef.querySelector('#sphere-levels'),
      healthBar: documentRef.querySelector('#health-bar'),
      healthLabel: documentRef.querySelector('#health-label'),
      manaBar: documentRef.querySelector('#mana-bar'),
      manaLabel: documentRef.querySelector('#mana-label'),
      shieldLabel: documentRef.querySelector('#shield-label'),
      dashStatus: documentRef.querySelector('#dash-status'),
      objective: documentRef.querySelector('#objective-text'),
      quickSlots: documentRef.querySelector('#quick-slots'),
      beltSlots: documentRef.querySelector('#belt-slots'),
      killCount: documentRef.querySelector('#kill-count'),
      combatLog: documentRef.querySelector('#combat-log'),
      overlay: documentRef.querySelector('#overlay'),
      overlayKicker: documentRef.querySelector('#overlay-kicker'),
      overlayTitle: documentRef.querySelector('#overlay-title'),
      overlayContent: documentRef.querySelector('#overlay-content'),
      closeOverlay: documentRef.querySelector('#close-overlay'),
    };

    const world = createWorld();
    const progression = createCampaignProgression();
    this.state = {
      world,
      player: {
        id: 'player', name: 'Маг', team: 'player',
        x: 16, y: 14, visualX: 16, visualY: 14,
        hp: PLAYER_MAX_HEALTH, maxHealth: PLAYER_MAX_HEALTH, shield: 0,
        mana: PLAYER_MAX_MANA, maxMana: PLAYER_MAX_MANA, manaRegen: PLAYER_MANA_REGEN, cooldowns: {},
        burnUntil: 0, nextBurnTick: 0, slowedUntil: 0, stunnedUntil: 0,
        moveSpeed: PLAYER_MOVE_SPEED, collisionRadius: PLAYER_COLLISION_RADIUS,
        moving: false, walkFrame: 0, facingX: 0, facingY: 1,
        dashDirection: null, dashUntil: 0, dashReadyAt: 0,
        castStartedAt: 0, castUntil: 0, castDirectionX: 1, castDirectionY: 0,
      },
      enemies: [],
      effects: [],
      fields: [],
      projectiles: [],
      animations: [],
      combatNumbers: [],
      telegraphs: [],
      objectiveTarget: { x: 23, y: 20 },
      aimTarget: { x: 35, y: 26 },
      progression,
      elementLevels: progression.spheres,
      prologue: createPrologueState(),
      controls: createControlProfile('modern'),
      quickSpells: [null, null, null, null],
      belt: [
        { id: 'minor-healing', name: 'Малое зелье лечения', quantity: 2, heal: 35 },
        null,
        null,
        null
      ],
      equipment: createEmptyEquipment(),
      inventory: [],
      characterStats: null,
      debugStatOverrides: {},
      unlocked: false,
      input: [],
      preparedSpell: null,
      defeated: 0,
      logEntries: [],
      gameOver: false,
      returnToHubAt: 0,
      log: (message) => this.addLog(message),
    };
    this.state.damageActor = (source, target, amount, now, metadata) =>
      this.damageActor(source, target, amount, now, metadata);
    this.renderer = new AsciiRenderer(this.ui.viewport);
    this.spells = new SpellSystem();
    this.pressed = new Set();
    this.lastFrame = 0;
    this.overlayType = null;
    this.rebindingAction = null;
    this.refreshCharacterStats(false);
  }

  start() {
    const restored = this.restoreSave();
    this.syncPrologueWorld();
    this.spawnCurrentEncounter();
    this.bindEvents();
    this.addLog(restored
      ? 'Сохранение хаба восстановлено.'
      : PROLOGUE_DIALOGUE.arrival);
    this.updateHud();
    this.ui.viewport.focus();
    requestAnimationFrame((time) => this.frame(time));
  }

  bindEvents() {
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => {
      const action = actionForCode(this.state.controls, event.code);
      if (action) this.pressed.delete(action);
    });
    window.addEventListener('blur', () => {
      this.pressed.clear();
      this.state.player.moving = false;
    });
    this.ui.viewport.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      this.ui.viewport.focus();
      this.castAtPointer(event);
    });
    this.ui.viewport.addEventListener('pointermove', (event) => {
      const camera = { x: this.state.player.visualX, y: this.state.player.visualY };
      this.state.aimTarget = this.renderer.pointerToWorld(event, camera);
    });
    this.ui.closeOverlay.addEventListener('click', () => this.closeOverlay());
    this.ui.overlay.addEventListener('click', (event) => {
      if (event.target === this.ui.overlay) this.closeOverlay();
      const layoutButton = event.target.closest?.('[data-control-layout]');
      if (layoutButton) {
        setControlLayout(this.state.controls, layoutButton.dataset.controlLayout);
        this.pressed.clear();
        this.renderControls();
        this.updateHud();
      }
      const equipButton = event.target.closest?.('[data-equip-item]');
      if (equipButton) this.equipInventoryItem(equipButton.dataset.equipItem);
      const rebindButton = event.target.closest?.('[data-rebind-action]');
      if (rebindButton) {
        this.rebindingAction = rebindButton.dataset.rebindAction;
        this.renderControls();
      }
      const phaseButton = event.target.closest?.('[data-dev-phase]');
      if (phaseButton) this.jumpToProloguePhase(phaseButton.dataset.devPhase);
      const itemButton = event.target.closest?.('[data-dev-item-action]');
      if (itemButton) {
        this.createDeveloperItem(
          itemButton.dataset.slot,
          this.document.querySelector('#dev-rarity')?.value || 'rare',
          itemButton.dataset.devItemAction
        );
      }
      const clearButton = event.target.closest?.('[data-dev-clear]');
      if (clearButton) this.clearDeveloperSection(clearButton.dataset.devClear);
    });
    this.ui.overlay.addEventListener('change', (event) => {
      if (event.target.matches?.('[data-dev-stat]')) {
        const value = Number(event.target.value);
        if (Number.isFinite(value)) this.state.debugStatOverrides[event.target.dataset.devStat] = value;
        this.refreshCharacterStats();
        this.updateHud();
      }
      if (event.target.matches?.('[data-dev-sphere]')) {
        const elementId = event.target.dataset.devSphere;
        this.state.elementLevels[elementId] = Math.max(0, Math.min(5, Number(event.target.value) || 0));
        this.state.unlocked = Object.values(this.state.elementLevels).some((level) => level > 0);
        this.refreshCharacterStats();
        this.syncPrologueWorld();
        this.updateHud();
      }
      if (event.target.matches?.('[data-dev-runtime]')) {
        const property = event.target.dataset.devRuntime;
        const value = Number(event.target.value);
        if (Number.isFinite(value)) {
          this.state.player[property] = value;
          if (property === 'x' || property === 'y') {
            this.state.player.visualX = this.state.player.x;
            this.state.player.visualY = this.state.player.y;
          }
        }
        this.updateHud();
      }
    });
  }

  onKeyDown(event) {
    if (this.rebindingAction) {
      event.preventDefault();
      event.stopPropagation();
      if (event.code === 'Escape') {
        this.rebindingAction = null;
      } else if (runeIndexForCode(event.code)) {
        this.setStatus('Клавиши 1–5 зарезервированы за формулой.');
      } else {
        rebindAction(this.state.controls, this.rebindingAction, event.code);
        this.rebindingAction = null;
        this.pressed.clear();
      }
      this.renderControls();
      this.updateHud();
      return;
    }
    if (event.code === 'Escape') {
      this.closeOverlay();
      return;
    }
    const rune = runeIndexForCode(event.code);
    if (rune && !this.overlayType) {
      event.preventDefault();
      this.enterRune(rune);
      return;
    }
    const action = actionForCode(this.state.controls, event.code);
    if (!action) return;
    event.preventDefault();
    if (action === 'journal') return this.toggleOverlay('journal');
    if (action === 'inventory') return this.toggleOverlay('inventory');
    if (action === 'character') return this.toggleOverlay('character');
    if (action === 'controls') return this.toggleOverlay('controls');
    if (action === 'devConsole') return this.toggleOverlay('developer');
    if (this.overlayType) return;
    if (MOVEMENT_ACTIONS.has(action)) {
      this.pressed.add(action);
      return;
    }
    if (action === 'dash') {
      if (!event.repeat) this.startDash(performance.now());
      return;
    }
    if (action === 'resetFormula') {
      this.state.input = [];
      this.state.preparedSpell = null;
      this.setStatus('Формула рассеяна.');
      this.updateHud();
      return;
    }
    if (action === 'interact') return this.interact(performance.now());
    if (action.startsWith('quickSpell')) return this.selectQuickSpell(Number(action.at(-1)) - 1, event.shiftKey);
    if (action.startsWith('belt')) return this.useBeltSlot(Number(action.at(-1)) - 1);
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
        if (!this.state.quickSpells.some((entry) => entry?.key === spell.key)) {
          const emptySlot = this.state.quickSpells.findIndex((entry) => !entry);
          if (emptySlot >= 0) this.state.quickSpells[emptySlot] = spell;
        }
        this.addLog(`Формула ${spell.code}: ${spell.name}.`);
        this.setStatus(`${spell.name} готово. Выберите цель ЛКМ.`);
      }
    }
    this.updateHud();
  }

  startDash(now = performance.now()) {
    const player = this.state.player;
    if (this.overlayType || this.state.gameOver || now < player.stunnedUntil || now < player.dashReadyAt || now < player.dashUntil) return false;

    const intent = movementVectorFromActionSet(this.pressed);
    const fallback = {
      x: player.facingY + player.facingX,
      y: player.facingY - player.facingX,
    };
    player.dashDirection = normalizeVector(intent ?? fallback);
    if (!player.dashDirection) return false;
    player.dashUntil = now + DASH_DURATION_MS;
    player.dashReadyAt = now + DASH_COOLDOWN_MS / (1 + Math.max(0, player.dashCooldownRecovery ?? 0));
    this.setStatus('Рывок!');
    this.updateMovementHud(now);
    return true;
  }

  updatePlayerMovement(now, deltaMs) {
    const player = this.state.player;
    if (this.overlayType || this.state.gameOver || now < player.stunnedUntil) {
      player.moving = false;
      return;
    }

    const dashing = now < player.dashUntil;
    const intent = movementVectorFromActionSet(this.pressed);
    const direction = dashing ? player.dashDirection : normalizeVector(intent);
    if (!direction) {
      player.moving = false;
      return;
    }

    if (intent) {
      player.facingX = intent.screenX;
      player.facingY = intent.screenY;
    }
    const slowMultiplier = now < player.slowedUntil ? 1 / 1.8 : 1;
    const speed = player.moveSpeed * slowMultiplier * (dashing ? DASH_SPEED_MULTIPLIER : 1);
    const seconds = deltaMs / 1000;
    const moved = moveActor(player, {
      x: direction.x * speed * seconds,
      y: direction.y * speed * seconds,
    }, this.state.world, this.state.enemies);
    player.visualX = player.x;
    player.visualY = player.y;
    player.moving = moved > 0.0001;
    player.walkFrame += moved * (dashing ? 1.7 : 1);
    if (dashing && !player.moving) player.dashUntil = now;

    for (const sphere of this.state.world.spheres.filter((item) => item.active && distance(player, item) <= 1.15)) {
      this.collectSphere(sphere, now);
    }
    this.updatePrologueLocation();
  }

  updatePrologueLocation() {
    const player = this.state.player;
    const prologue = this.state.prologue;
    let result = null;
    if (prologue.phase === 'reach-port' && distance(player, PROLOGUE_VILLAGES.portVillage.center) <= 4) {
      result = recordPrologueLocation(prologue, 'port-village');
      this.state.progression.currentHubId = 'port-village';
      markStoryFlag(this.state.progression, 'portVillageReached');
      this.addLog(PROLOGUE_DIALOGUE.port);
    } else if (prologue.phase === 'travel-undead'
      && distance(player, PROLOGUE_VILLAGES.undeadVillage.zones.outskirts) <= 5) {
      result = recordPrologueLocation(prologue, 'undead-village');
      markStoryFlag(this.state.progression, 'undeadVillageReached');
      this.addLog(PROLOGUE_DIALOGUE.undead);
    } else if (prologue.phase === 'return-port'
      && distance(player, PROLOGUE_VILLAGES.portVillage.center) <= 4) {
      result = recordPrologueHubReturn(prologue);
      this.addLog('Отряд вернулся в Тихую Пристань. Подготовьте найденную экипировку.');
    }
    if (result === 'clear-undead') this.spawnCurrentEncounter();
    if (result) {
      this.syncPrologueWorld();
      this.updateHud();
    }
  }

  syncPrologueWorld() {
    const phase = this.state.prologue.phase;
    const air = this.state.world.spheres.find((sphere) => sphere.elementId === 'air');
    const fire = this.state.world.spheres.find((sphere) => sphere.elementId === 'fire');
    air.active = this.state.elementLevels.air < 1 && phase === 'find-air';
    fire.active = this.state.elementLevels.fire < 1 && phase === 'find-fire';
    for (const chest of this.state.world.chests) {
      chest.opened = this.state.prologue.housesInspected.includes(chest.houseId);
      chest.active = phase === 'inspect-port' && !chest.opened;
    }
    this.state.objectiveTarget = prologueTarget(this.state.prologue);
  }

  spawnCurrentEncounter() {
    const phase = this.state.prologue.phase;
    const encounter = phase === 'wolves'
      ? PROLOGUE_ENCOUNTERS.wolves
      : phase === 'clear-undead'
        ? PROLOGUE_ENCOUNTERS.undead
        : phase === 'lich'
          ? PROLOGUE_ENCOUNTERS.lich
          : null;
    if (!encounter) {
      if (phase === 'complete' && this.state.enemies.length === 0) {
        for (let i = 0; i < INITIAL_ENEMY_COUNT; i += 1) this.spawnEnemy();
      }
      return;
    }
    if (this.state.enemies.some((enemy) => enemy.questTag === encounter.tag)) return;
    for (const definition of encounter.enemies) {
      const enemy = createEnemy({ x: definition.x, y: definition.y }, this.state.defeated + 1, definition.type);
      enemy.questTag = encounter.tag;
      if (definition.name) enemy.name = definition.name;
      if (definition.boss) {
        enemy.boss = true;
        enemy.maxHealth *= 3;
        enemy.hp = enemy.maxHealth;
        enemy.damage *= 2;
        enemy.collisionRadius = 0.55;
      }
      enemy.nextAbilityAt = performance.now() + 1400;
      this.state.enemies.push(enemy);
    }
  }

  restoreSave() {
    const snapshot = loadGame(this.storage);
    if (!snapshot) return false;
    this.state.progression = normalizeCampaignProgression(snapshot.progression);
    this.state.elementLevels = this.state.progression.spheres;
    this.state.prologue = normalizePrologueState(snapshot.prologue);
    this.state.equipment = { ...createEmptyEquipment(), ...(snapshot.equipment || {}) };
    this.state.inventory = Array.isArray(snapshot.inventory) ? snapshot.inventory : [];
    this.state.belt = Array.isArray(snapshot.belt) ? snapshot.belt : this.state.belt;
    if (snapshot.controls?.bindings) {
      const restoredControls = createControlProfile(snapshot.controls.layoutId);
      restoredControls.layoutId = snapshot.controls.layoutId || restoredControls.layoutId;
      restoredControls.bindings = { ...restoredControls.bindings, ...snapshot.controls.bindings };
      this.state.controls = restoredControls;
    }
    this.state.quickSpells = (snapshot.quickSpellKeys || []).map((key) =>
      BASE_SPELLS.find((spell) => spell.key === key) || null);
    while (this.state.quickSpells.length < 4) this.state.quickSpells.push(null);
    this.state.quickSpells = this.state.quickSpells.slice(0, 4);
    this.state.unlocked = Object.values(this.state.elementLevels).some((level) => level > 0);
    const checkpoint = PROLOGUE_CHECKPOINTS.portVillage;
    Object.assign(this.state.player, {
      x: checkpoint.x,
      y: checkpoint.y,
      visualX: checkpoint.x,
      visualY: checkpoint.y
    });
    this.refreshCharacterStats(false);
    return true;
  }

  saveAtHub() {
    const saved = saveGame(this.storage, this.state);
    if (saved) this.addLog('Прогресс сохранён у сигнального костра.');
    return saved;
  }

  collectSphere(sphere, now = performance.now()) {
    const firstUnlock = !this.state.unlocked;
    if (this.state.progression) grantSphere(this.state.progression, sphere.elementId);
    else this.state.elementLevels[sphere.elementId] = Math.min(5, this.state.elementLevels[sphere.elementId] + 1);
    const newLevel = this.state.elementLevels[sphere.elementId];
    this.state.unlocked = true;
    if (firstUnlock) {
      this.state.enemies.forEach((enemy, index) => {
        enemy.nextAbilityAt = now + 1800 + index * 650;
      });
    }
    this.state.player.shield = Math.min(40, this.state.player.shield + 6);
    healEntity(this.state, this.state.player, 8, now);
    this.addLog(`${sphere.name}: уровень ${newLevel} / 5.`);
    this.setStatus(`${ELEMENTS[sphere.key].name} усилен до уровня ${newLevel}.`);
    this.ui.worldStatus.textContent = 'СФЕРЫ РЕЗОНИРУЮТ';
    const prologueAdvance = this.state.prologue
      ? recordPrologueSphere(this.state.prologue, sphere.elementId)
      : null;
    if (prologueAdvance === 'wolves') {
      this.addLog(PROLOGUE_DIALOGUE.air);
      this.addLog('Обучение бою: соберите формулу 1 + 1 + 1 и примените её ЛКМ.');
      this.spawnCurrentEncounter();
    } else if (prologueAdvance === 'return-port') {
      this.addLog(PROLOGUE_DIALOGUE.fire);
      this.addLog('Воздух и Огонь доступны. Вернитесь в Тихую Пристань.');
    }
    const keepAvailable = !sphere.story;
    if (newLevel < 5 && keepAvailable) {
      this.state.world.respawnSphere(sphere, [this.state.player, ...this.state.enemies]);
    } else {
      sphere.active = false;
    }
    if (this.refreshCharacterStats) this.refreshCharacterStats();
    this.updateHud();
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
    const camera = { x: this.state.player.visualX, y: this.state.player.visualY };
    const target = this.renderer.pointerToWorld(event, camera);
    const spell = this.state.preparedSpell;
    const availability = abilityAvailability(this.state.player, spell, now);
    if (!availability.ready) {
      if (availability.reason === 'mana') this.setStatus(`Недостаточно маны: нужно ${spell.manaCost}.`);
      else this.setStatus(`${spell.name}: восстановление ${(availability.remainingMs / 1000).toFixed(1)}с.`);
      return;
    }
    commitAbilityCost(this.state.player, spell, now);
    const castDx = target.x - this.state.player.x;
    const castDy = target.y - this.state.player.y;
    this.state.player.castStartedAt = now;
    this.state.player.castUntil = now + 520 / (1 + Math.max(0, this.state.characterStats.castSpeed));
    this.state.player.castDirectionX = Math.sign(castDx - castDy);
    this.state.player.castDirectionY = Math.sign(castDx + castDy);
    if (!this.state.player.castDirectionX && !this.state.player.castDirectionY) this.state.player.castDirectionY = -1;
    if (this.state.player.castDirectionX) this.state.player.facingX = this.state.player.castDirectionX;
    if (this.state.player.castDirectionY) this.state.player.facingY = this.state.player.castDirectionY;
    const elementalPower = spell.elements.reduce((sum, element) =>
      sum + (this.state.characterStats[element.id + 'Damage'] || 0), 0) / spell.elements.length;
    const averageCriticalPower = 1 + Math.max(0, this.state.characterStats.critChance) *
      Math.max(0, this.state.characterStats.critDamage);
    const gearPower = (1 + this.state.characterStats.damage * 0.03 + elementalPower) * averageCriticalPower;
    const context = createActorAbilityContext(
      this.state,
      spell,
      this.state.player,
      target,
      now,
      { power: gearPower }
    );
    const castResult = this.spells.cast(context);
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
    if (this.state.returnToHubAt && now >= this.state.returnToHubAt) {
      this.returnToHub();
    }
    this.updateResources(deltaMs);
    this.updatePlayerMovement(now, deltaMs);
    this.state.effects = this.state.effects.filter((effect) => effect.expiresAt > now);
    this.state.fields = this.state.fields.filter((field) => field.expiresAt > now);
    this.state.combatNumbers = this.state.combatNumbers.filter((number) => number.expiresAt > now);
    this.state.animations = this.state.animations.filter((animation) => animation.expiresAt > now);
    this.state.telegraphs = this.state.telegraphs.filter((telegraph) => telegraph.expiresAt > now && telegraph.owner.hp > 0);
    this.tickStatuses(now);
    updateProjectiles(this.state, now, deltaMs);
    this.tickFields(now);
    this.tickEnemyAbilities(now);
    this.tickEnemies(now, deltaMs);
    this.resolveDefeated();
    this.updateMovementHud(now);
    this.updateResourceHud(now);
  }

  updateResources(deltaMs) {
    const player = this.state.player;
    player.mana = Math.min(player.maxMana, player.mana + player.manaRegen * deltaMs / 1000);
    if (player.hp > 0) {
      player.hp = Math.min(player.maxHealth, player.hp + (player.healthRegen || 0) * deltaMs / 1000);
    }
  }

  tickStatuses(now) {
    for (const actor of allActors(this.state)) {
      if (actor.burnUntil > now && actor.nextBurnTick <= now) {
        this.damageActor(null, actor, 3, now);
        actor.nextBurnTick = now + 450;
      }
    }
  }

  tickFields(now) {
    for (const field of this.state.fields) {
      if (field.followOwner || field.followPlayer) {
        const owner = field.owner ?? this.state.player;
        field.x = owner.visualX ?? owner.x;
        field.y = owner.visualY ?? owner.y;
      }
      if (now < field.nextTick) continue;
      field.nextTick = now + 550;
      for (const actor of hostileActors(this.state, field.team ?? 'player')) {
        if (distance(field, actor) <= field.radius + 0.5) {
          this.damageActor(field.owner ?? null, actor, field.damage, now);
        }
      }
      if (Number.isFinite(field.remainingTicks)) {
        field.remainingTicks -= 1;
        if (field.remainingTicks <= 0) field.expiresAt = now;
      }
    }
  }

  tickEnemyAbilities(now) {
    if (this.state.gameOver || !this.state.unlocked) return;
    for (const enemy of this.state.enemies) {
      const spec = enemy.ability;
      if (!spec || enemy.hp <= 0) continue;

      if (enemy.pendingAbility && now >= enemy.pendingAbility.resolvesAt) {
        const spell = getSpell(...spec.code);
        const context = createActorAbilityContext(
          this.state,
          spell,
          enemy,
          enemy.pendingAbility.target,
          now,
          { power: spec.power, manaCost: 0, cooldownMs: spec.interval, log: false },
        );
        enemy.castStartedAt = now;
        enemy.castUntil = now + 420;
        this.spells.cast(context);
        enemy.pendingAbility = null;
        enemy.nextAbilityAt = now + spec.interval;
        continue;
      }
      if (enemy.pendingAbility || now < enemy.nextAbilityAt || enemy.stunnedUntil > now) continue;
      if (distance(enemy, this.state.player) > spec.range) continue;

      const spell = getSpell(...spec.code);
      const target = clampTarget(enemy, this.state.player, Math.min(spec.range, abilityRange(spell, enemy)));
      const telegraph = {
        id: `telegraph-${enemy.id}-${now}`,
        owner: enemy,
        spell,
        shape: spellTargeting(spell),
        origin: { x: enemy.x, y: enemy.y },
        target,
        radius: spell.radius,
        color: 'danger',
        glyph: '!',
        createdAt: now,
        resolvesAt: now + spec.telegraphMs,
        expiresAt: now + spec.telegraphMs,
      };
      enemy.pendingAbility = { target, resolvesAt: telegraph.resolvesAt, telegraphId: telegraph.id };
      this.state.telegraphs.push(telegraph);
      this.addLog(`${enemy.name} готовит «${spell.name}».`);
    }
  }

  tickEnemies(now, deltaMs) {
    if (this.state.gameOver || !this.state.unlocked) return;

    for (const enemy of this.state.enemies) {
      if (enemy.stunnedUntil > now || enemy.pendingAbility) continue;
      const gap = distance(enemy, this.state.player);
      if (gap <= 1.2 && enemy.nextAttackAt <= now) {
        this.damagePlayer(enemy.damage, enemy);
        enemy.nextAttackAt = now + enemy.attackInterval;
        continue;
      }
      if (gap > enemy.visionRange) continue;
      const direction = normalizeVector({
        x: this.state.player.x - enemy.x,
        y: this.state.player.y - enemy.y,
      });
      if (!direction) continue;
      const slowMultiplier = enemy.slowedUntil > now ? 1 / 1.8 : 1;
      const distanceThisFrame = enemy.moveSpeed * slowMultiplier * deltaMs / 1000;
      moveActor(enemy, {
        x: direction.x * distanceThisFrame,
        y: direction.y * distanceThisFrame,
      }, this.state.world, [this.state.player, ...this.state.enemies]);
    }
  }

  damageActor(source, target, amount, now = performance.now(), metadata = {}) {
    const armor = Math.max(0, target.armor || 0);
    const elementIds = metadata.elements || [];
    const resistance = elementIds.length
      ? elementIds.reduce((sum, elementId) => sum + Math.max(0, target[elementId + 'Resist'] || 0), 0) / elementIds.length
      : 0;
    const avoidance = Math.min(0.6, Math.max(0, target.evasion || 0) * 0.25 + Math.max(0, target.blockChance || 0) * 0.4);
    const mitigation = (100 / (100 + armor * 8)) * (1 - Math.min(0.75, resistance)) * (1 - avoidance);
    const incomingDamage = Math.max(0, Math.round(amount * mitigation));
    let remaining = incomingDamage;
    if ((target.shield ?? 0) > 0) {
      const absorbed = Math.min(target.shield, remaining);
      target.shield -= absorbed;
      remaining -= absorbed;
    }
    const dealt = damageEntity(this.state, target, remaining, now);
    if (source && source !== target && (target.reflectUntil ?? 0) > now && incomingDamage > 0) {
      damageEntity(this.state, source, Math.max(1, Math.round(incomingDamage * 1.5)), now);
    }
    if (target === this.state.player && dealt) this.addLog(`${source?.name ?? 'Опасная зона'} наносит ${dealt} урона.`);
    if (target === this.state.player && target.hp <= 0) {
      this.state.gameOver = true;
      this.state.returnToHubAt = now + 1600;
      this.setStatus('СИГНАЛ ПОТЕРЯН. Возвращение к костру...');
      this.ui.worldStatus.textContent = 'СИГНАЛ ПОТЕРЯН';
    }
    this.updateHud();
    return dealt;
  }

  damagePlayer(amount, source = null) {
    return this.damageActor(source, this.state.player, amount, performance.now());
  }

  resolveDefeated() {
    const defeated = this.state.enemies.filter((enemy) => enemy.hp <= 0);
    if (!defeated.length) return;
    this.state.enemies = this.state.enemies.filter((enemy) => enemy.hp > 0);
    let transition = null;
    for (const enemy of defeated) {
      this.state.defeated += 1;
      transition = recordPrologueEnemyDefeat(this.state.prologue, enemy.questTag) || transition;
      this.addLog(`${enemy.name} уничтожен. Новая цель обнаружена.`);
      if (this.state.prologue.phase === 'complete') this.spawnEnemy();
    }
    if (transition === 'lich') {
      this.addLog('Путь к башне открыт. Лич ожидает на вершине.');
      this.spawnCurrentEncounter();
    } else if (transition === 'find-fire') {
      this.addLog('Лич повержен. В башне появилась сфера Огня.');
    }
    this.syncPrologueWorld();
    this.updateHud();
  }

  spawnEnemy() {
    const excluded = [this.state.player, ...this.state.world.spheres.filter((sphere) => sphere.active), ...this.state.enemies];
    const isInitialWave = this.state.defeated === 0 && this.state.enemies.length < INITIAL_ENEMY_COUNT;
    const position = this.state.world.findSpawn(excluded, 7, isInitialWave ? 11 : null);
    this.state.enemies.push(createEnemy(position, this.state.defeated + 1));
  }

  selectQuickSpell(index, forceAssign = false) {
    const spell = this.state.quickSpells[index];
    if (!spell || forceAssign) {
      if (this.state.preparedSpell) {
        this.state.quickSpells[index] = this.state.preparedSpell;
        this.setStatus('Текущая формула назначена в быстрый слот ' + (index + 1) + '.');
      } else {
        this.setStatus('Быстрый слот ' + (index + 1) + ' пуст.');
      }
      this.updateHud();
      return;
    }
    this.state.preparedSpell = spell;
    this.setStatus(spell.name + ' выбрано из быстрого слота.');
    this.updateHud();
  }

  useBeltSlot(index, now = performance.now()) {
    const consumable = this.state.belt[index];
    if (!consumable || consumable.quantity <= 0) {
      this.setStatus('Ячейка пояса пуста.');
      return false;
    }
    if (consumable.heal && this.state.player.hp >= this.state.player.maxHealth) {
      this.setStatus('Здоровье уже восстановлено.');
      return false;
    }
    if (consumable.heal) {
      const healing = Math.round(consumable.heal * (1 + Math.max(0, this.state.player.healingPower ?? 0)));
      healEntity(this.state, this.state.player, healing, now);
    }
    consumable.quantity -= 1;
    if (consumable.quantity <= 0) this.state.belt[index] = null;
    this.setStatus('Использовано: ' + consumable.name + '.');
    this.updateHud();
    return true;
  }

  interact() {
    const player = this.state.player;
    const chest = this.state.world.chests.find((item) =>
      item.active && !item.opened && distance(player, item) <= 2);
    if (chest) {
      chest.opened = true;
      chest.active = false;
      const rarity = this.state.prologue.lootClaims >= 2 ? 'rare' : 'magic';
      const reward = generateItem({ rarity, power: 1 + this.state.prologue.lootClaims * 0.25 });
      this.state.inventory.push(reward);
      recordPrologueChest(this.state.prologue);
      recordPrologueHouse(this.state.prologue, chest.houseId);
      this.addLog('Награда получена: ' + reward.name + '.');
      this.setStatus('Дом осмотрен. Предмет добавлен в инвентарь.');
      this.syncPrologueWorld();
      this.updateHud();
      return true;
    }
    if (distance(player, this.state.world.hub) <= 2 && this.state.prologue.phase === 'save-at-hub') {
      recordPrologueHubSave(this.state.prologue);
      completeMission(this.state.progression, 'prologue');
      markStoryFlag(this.state.progression, 'prologueComplete');
      this.saveAtHub();
      this.addLog('Пролог завершён. Прогресс записан у сигнального костра.');
      this.setStatus('Пролог завершён. Открыт путь к Главе I.');
      this.ui.worldStatus.textContent = 'ХАБ СТАБИЛЕН';
      this.spawnCurrentEncounter();
      this.updateHud();
      return true;
    }
    this.setStatus('Рядом нет объекта для взаимодействия.');
    return false;
  }

  equipInventoryItem(itemId) {
    const index = this.state.inventory.findIndex((item) => item.id === itemId);
    if (index < 0) return false;
    const item = this.state.inventory[index];
    const result = equipItem(this.state.equipment, item);
    if (!result.equipped) return false;
    this.state.inventory.splice(index, 1);
    if (result.replaced) this.state.inventory.push(result.replaced);
    recordPrologueEquipment(this.state.prologue);
    this.refreshCharacterStats();
    this.addLog('Экипировано: ' + item.name + '.');
    if (this.overlayType === 'inventory') this.renderInventory();
    this.updateHud();
    return true;
  }

  refreshCharacterStats(preserveResources = true) {
    const player = this.state.player;
    const hp = player.hp;
    const mana = player.mana;
    const bonuses = equipmentBonuses(this.state.equipment);
    const stats = calculateCharacterStats(bonuses, this.state.elementLevels, this.state.debugStatOverrides);
    applyCharacterStats(player, stats);
    if (!preserveResources) {
      player.hp = player.maxHealth;
      player.mana = player.maxMana;
    } else {
      player.hp = Math.min(player.maxHealth, hp);
      player.mana = Math.min(player.maxMana, mana);
    }
    this.state.characterStats = stats;
    this.state.progression.gearScore = Object.values(this.state.equipment)
      .filter(Boolean)
      .reduce((sum, item) => sum + item.power, 0);
  }

  returnToHub() {
    const player = this.state.player;
    recordPrologueDefeat(this.state.prologue);
    const checkpoint = Object.values(PROLOGUE_CHECKPOINTS)
      .find((entry) => entry.id === this.state.prologue.checkpoint) || PROLOGUE_CHECKPOINTS.expeditionBeach;
    player.x = checkpoint.x;
    player.y = checkpoint.y;
    player.visualX = player.x;
    player.visualY = player.y;
    player.hp = player.maxHealth;
    player.mana = player.maxMana;
    player.shield = 0;
    player.stunnedUntil = 0;
    player.slowedUntil = 0;
    this.state.effects = [];
    this.state.fields = [];
    this.state.projectiles = [];
    this.state.telegraphs = [];
    this.state.gameOver = false;
    this.state.returnToHubAt = 0;
    this.state.enemies = [];
    this.syncPrologueWorld();
    this.spawnCurrentEncounter();
    this.ui.worldStatus.textContent = 'КОНТРОЛЬНАЯ ТОЧКА';
    this.setStatus('Вы вернулись к последней контрольной точке. Прогресс миссии сохранён в памяти.');
    this.updateHud();
  }

  updateHud() {
    const player = this.state.player;
    const now = performance.now();
    this.updateMovementHud(now);
    this.updateResourceHud(now);
    if (this.ui.objective) {
      const target = prologueTarget(this.state.prologue);
      const navigation = target
        ? ' · ' + directionArrow(player, target) + ' ' + Math.round(distance(player, target)) + 'м'
        : '';
      this.ui.objective.textContent = prologueObjective(this.state.prologue) + navigation;
    }
    if (this.ui.quickSlots) {
      this.ui.quickSlots.innerHTML = this.state.quickSpells.map((spell, index) => {
        const action = 'quickSpell' + (index + 1);
        const key = displayCode(this.state.controls.bindings[action][0]);
        const cooldown = spell ? cooldownRemaining(player, spell, now) : 0;
        const stateLabel = cooldown > 0 ? (cooldown / 1000).toFixed(1) + 'с' : spell ? 'ГОТОВО' : 'ПУСТО';
        return '<span><kbd>' + key + '</kbd><b>' + (spell?.name || '—') + '</b><small>' + stateLabel + '</small></span>';
      }).join('');
    }
    if (this.ui.beltSlots) {
      this.ui.beltSlots.innerHTML = this.state.belt.map((item, index) => {
        const key = displayCode(this.state.controls.bindings['belt' + (index + 1)][0]);
        return '<span><kbd>' + key + '</kbd><b>' + (item?.name || '—') + '</b><small>' + (item ? '×' + item.quantity : 'ПУСТО') + '</small></span>';
      }).join('');
    }
    this.ui.healthLabel.textContent = `${player.hp} / ${player.maxHealth}`;
    this.ui.healthBar.style.width = `${(player.hp / player.maxHealth) * 100}%`;
    this.ui.shieldLabel.textContent = String(player.shield);
    this.ui.killCount.textContent = `ЦЕЛЕЙ: ${this.state.defeated}`;
    if (this.ui.unlockLabel) {
      this.ui.unlockLabel.textContent = this.state.unlocked ? 'АКТИВНО' : 'ЗАБЛОКИРОВАНО';
      this.ui.unlockLabel.classList.toggle('active', this.state.unlocked);
    }
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
    if (this.ui.spellDescription) {
      this.ui.spellDescription.textContent = spell?.description ?? (this.state.unlocked
        ? 'Введите две сферы и уровень.'
        : 'Соберите формулу после получения сферы.');
    }
    this.ui.spellCode.textContent = spell?.code ?? '---';
    if (this.ui.spellTags) this.ui.spellTags.innerHTML = spell
      ? `<span>УРОВЕНЬ ${spell.level}</span><span>МАНА ${spell.manaCost}</span><span>КД ${(spell.cooldownMs / 1000).toFixed(1)}с</span>${spell.elements.map((element) => `<span>${element.name.toUpperCase()}</span>`).join('')}`
      : '';
  }

  updateResourceHud(now) {
    const player = this.state.player;
    this.ui.manaLabel.textContent = `${Math.floor(player.mana)} / ${player.maxMana}`;
    this.ui.manaBar.style.width = `${(player.mana / player.maxMana) * 100}%`;
    const spell = this.state.preparedSpell;
    if (!spell) {
      this.ui.spellResourceStatus.textContent = 'МАНА И КУЛДАУН —';
      return;
    }
    const remaining = cooldownRemaining(player, spell, now);
    const manaReady = player.mana >= spell.manaCost;
    const range = abilityRange(spell, player).toFixed(1);
    this.ui.spellResourceStatus.textContent = remaining > 0
      ? `${spell.manaCost} MP · ДАЛЬН. ${range} · ГОТОВО ЧЕРЕЗ ${(remaining / 1000).toFixed(1)}с`
      : `${spell.manaCost} MP · ДАЛЬН. ${range} · ${manaReady ? 'ГОТОВО' : 'НЕДОСТАТОЧНО МАНЫ'}`;
  }

  updateMovementHud(now) {
    const player = this.state.player;
    this.ui.coordinates.textContent = `X:${player.x.toFixed(1).padStart(4, '0')} Y:${player.y.toFixed(1).padStart(4, '0')}`;
    if (!this.ui.dashStatus) return;
    const remaining = Math.max(0, player.dashReadyAt - now);
    this.ui.dashStatus.textContent = remaining > 0 ? `РЫВОК ${(remaining / 1000).toFixed(1)}с` : 'РЫВОК ГОТОВ';
    this.ui.dashStatus.classList.toggle('ready', remaining === 0);
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
    this.state.player.moving = false;
    this.ui.overlay.hidden = false;
    if (type === 'journal') this.renderJournal();
    else if (type === 'inventory') this.renderInventory();
    else if (type === 'character') this.renderCharacter();
    else if (type === 'controls') this.renderControls();
    else this.renderDeveloperConsole();
  }

  closeOverlay() {
    this.overlayType = null;
    this.ui.overlay.hidden = true;
    this.ui.viewport.focus();
  }

  renderJournal() {
    this.ui.overlayKicker.textContent = 'ПОЛЕВОЙ ЖУРНАЛ';
    this.ui.overlayTitle.textContent = 'Задания';
    const current = PROLOGUE_PHASES.findIndex((entry) => entry.id === this.state.prologue.phase);
    this.ui.overlayContent.innerHTML = PROLOGUE_PHASES.map((phase, index) => {
      const done = index < current || this.state.prologue.phase === 'complete';
      const active = index === current && !done;
      const description = active
        ? prologueObjective(this.state.prologue)
        : index < 5
          ? PROLOGUE_VILLAGES.portVillage.description
          : PROLOGUE_VILLAGES.undeadVillage.description;
      return '<article class="quest ' + (done ? 'done' : '') + '"><span class="quest-index">' +
        String(index + 1).padStart(2, '0') + '</span><div><h3>[' +
        (done ? 'ВЫПОЛНЕНО' : active ? 'АКТИВНО' : 'ОЖИДАЕТ') + '] ' + phase.name +
        '</h3><p>' + description + '</p></div></article>';
    }).join('');
  }

  renderCharacter() {
    this.ui.overlayKicker.textContent = 'ЛИСТ ПЕРСОНАЖА';
    this.ui.overlayTitle.textContent = 'Характеристики';
    const groups = {
      resources: 'Ресурсы',
      defense: 'Защита',
      offense: 'Атака',
      elements: 'Стихии',
      utility: 'Прочее'
    };
    this.ui.overlayContent.innerHTML = Object.entries(groups).map(([groupId, groupName]) => {
      const rows = STAT_DEFINITIONS
        .filter((definition) => definition.group === groupId)
        .map((definition) => '<div class=\"stat-line\"><span>' + definition.name + '</span><strong>' +
          formatStatValue(definition, this.state.characterStats[definition.id]) + '</strong></div>')
        .join('');
      return '<section class=\"stat-group\"><h3>' + groupName + '</h3>' + rows + '</section>';
    }).join('');
  }

  renderControls() {
    this.ui.overlayKicker.textContent = 'ПРОФИЛЬ ВВОДА';
    this.ui.overlayTitle.textContent = 'Управление';
    const layouts = Object.entries(CONTROL_LAYOUTS).map(([id, layout]) =>
      '<button class=\"layout-button ' + (this.state.controls.layoutId === id ? 'active' : '') +
      '\" type=\"button\" data-control-layout=\"' + id + '\">' + layout.label + '</button>'
    ).join('');
    const rows = Object.entries(ACTIONS).map(([id, action]) => {
      const awaiting = this.rebindingAction === id;
      return '<div class=\"binding-row\"><span>' + action.label + '</span><button type=\"button\" data-rebind-action=\"' +
        id + '\"><kbd>' + (awaiting ? 'НАЖМИТЕ КЛАВИШУ' : this.state.controls.bindings[id].map(displayCode).join(' / ')) +
        '</kbd></button></div>';
    }).join('');
    this.ui.overlayContent.innerHTML =
      '<p class=\"overlay-note\">Цифры 1–5 всегда закреплены за сборкой формулы. Профиль поддерживает программное переназначение отдельных действий.</p>' +
      '<div class=\"layout-picker\">' + layouts + '</div><div class=\"binding-list\">' + rows + '</div>';
  }

  renderDeveloperConsole() {
    this.ui.overlayKicker.textContent = 'DEV CONSOLE';
    this.ui.overlayTitle.textContent = 'Консоль разработчика';
    const runtimeProperties = [
      ['hp', 'Текущее здоровье'],
      ['mana', 'Текущая мана'],
      ['shield', 'Текущий щит'],
      ['x', 'Координата X'],
      ['y', 'Координата Y']
    ].map(([id, name]) => '<label class=\"dev-field\"><span>' + name + '</span><input type=\"number\" step=\"any\" data-dev-runtime=\"' +
      id + '\" value=\"' + Number(this.state.player[id]).toFixed(2) + '\"></label>').join('');
    const stats = STAT_DEFINITIONS.map((definition) =>
      '<label class=\"dev-field\"><span>' + definition.name + '</span><input type=\"number\" step=\"any\" data-dev-stat=\"' +
      definition.id + '\" value=\"' + this.state.characterStats[definition.id] + '\"></label>'
    ).join('');
    const spheres = Object.values(ELEMENTS).map((element) =>
      '<label class=\"dev-field\"><span>' + element.name + '</span><input type=\"number\" min=\"0\" max=\"5\" data-dev-sphere=\"' +
      element.id + '\" value=\"' + this.state.elementLevels[element.id] + '\"></label>'
    ).join('');
    const rarityOptions = Object.entries(RARITIES).map(([id, rarity]) =>
      '<option value=\"' + id + '\">' + rarity.name + '</option>').join('');
    const itemRows = EQUIPMENT_SLOTS.map((slot) =>
      '<div class=\"dev-item-row\"><span>' + slot.name + '</span><button type=\"button\" data-dev-item-action=\"bag\" data-slot=\"' +
      slot.id + '\">+ В СУМКУ</button><button type=\"button\" data-dev-item-action=\"equip\" data-slot=\"' +
      slot.id + '\">ЭКИПИРОВАТЬ</button></div>'
    ).join('');
    const phases = PROLOGUE_PHASES.map((phase) =>
      '<button type=\"button\" class=\"dev-phase ' + (this.state.prologue.phase === phase.id ? 'active' : '') +
      '\" data-dev-phase=\"' + phase.id + '\">' + phase.name + '</button>'
    ).join('');
    this.ui.overlayContent.innerHTML =
      '<section class=\"dev-section\"><h3>Состояние персонажа</h3><div class=\"dev-grid\">' + runtimeProperties + '</div></section>' +
      '<section class=\"dev-section\"><h3>Все вычисляемые характеристики</h3><div class=\"dev-grid\">' + stats + '</div>' +
      '<button type=\"button\" data-dev-clear=\"stats\">СБРОСИТЬ ПЕРЕОПРЕДЕЛЕНИЯ</button></section>' +
      '<section class=\"dev-section\"><h3>Сюжетные сферы</h3><div class=\"dev-grid compact\">' + spheres + '</div></section>' +
      '<section class=\"dev-section\"><h3>Генератор предметов</h3><label class=\"dev-rarity\">Редкость <select id=\"dev-rarity\">' +
      rarityOptions + '</select></label><div class=\"dev-item-list\">' + itemRows + '</div>' +
      '<div class=\"dev-actions\"><button type=\"button\" data-dev-clear=\"inventory\">ОЧИСТИТЬ СУМКУ</button>' +
      '<button type=\"button\" data-dev-clear=\"equipment\">СНЯТЬ ВСЁ</button></div></section>' +
      '<section class=\"dev-section\"><h3>Квесты пролога</h3><p class=\"overlay-note\">Переход восстанавливает состояние мира; предыдущие развилки выбираются по первому варианту.</p>' +
      '<div class=\"dev-phase-list\">' + phases + '</div></section>';
  }

  jumpToProloguePhase(phase) {
    const phaseIndex = PROLOGUE_PHASES.findIndex((entry) => entry.id === phase);
    if (phaseIndex < 0) return false;
    this.state.prologue = createPrologueStateAtPhase(phase);
    for (const elementId of ['air', 'fire', 'water', 'earth']) this.state.elementLevels[elementId] = 0;
    this.state.elementLevels.air = phaseIndex >= 1 ? 1 : 0;
    this.state.elementLevels.fire = phaseIndex >= 8 ? 1 : 0;
    this.state.unlocked = phaseIndex >= 1;
    const position = phaseIndex >= 9
      ? PROLOGUE_CHECKPOINTS.portVillage
      : phaseIndex >= 5
        ? PROLOGUE_VILLAGES.undeadVillage.zones.outskirts
        : phaseIndex >= 3
          ? PROLOGUE_CHECKPOINTS.portVillage
          : PROLOGUE_CHECKPOINTS.expeditionBeach;
    Object.assign(this.state.player, {
      x: position.x,
      y: position.y,
      visualX: position.x,
      visualY: position.y,
      hp: this.state.player.maxHealth,
      mana: this.state.player.maxMana
    });
    if (phaseIndex >= 4 && this.state.inventory.length === 0
      && Object.values(this.state.equipment).every((item) => !item)) {
      this.state.inventory.push(
        generateItem({ slot: 'staff', rarity: 'rare', power: 1.5 }),
        generateItem({ slot: 'body', rarity: 'magic', power: 1.25 }),
        generateItem({ slot: 'ring', rarity: 'magic', power: 1.25 })
      );
    }
    this.state.enemies = [];
    this.state.effects = [];
    this.state.fields = [];
    this.state.projectiles = [];
    this.state.telegraphs = [];
    this.syncPrologueWorld();
    this.spawnCurrentEncounter();
    this.renderDeveloperConsole();
    this.updateHud();
    return true;
  }

  createDeveloperItem(slot, rarity, action) {
    const item = generateItem({ slot, rarity, power: Math.max(1, this.state.progression.gearScore + 1) });
    if (action === 'equip') {
      const result = equipItem(this.state.equipment, item);
      if (result.replaced) this.state.inventory.push(result.replaced);
    } else {
      this.state.inventory.push(item);
    }
    this.refreshCharacterStats();
    this.renderDeveloperConsole();
    this.updateHud();
  }

  clearDeveloperSection(section) {
    if (section === 'inventory') this.state.inventory = [];
    if (section === 'equipment') this.state.equipment = createEmptyEquipment();
    if (section === 'stats') this.state.debugStatOverrides = {};
    this.refreshCharacterStats();
    this.renderDeveloperConsole();
    this.updateHud();
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
    this.ui.overlayContent.innerHTML += this.equipmentMarkup();
  }

  equipmentMarkup() {
    const equipped = EQUIPMENT_SLOTS.map((slot) => {
      const item = this.state.equipment[slot.id];
      return '<article class=\"equipment-slot\"><span>' + slot.name + '</span><strong style=\"color:' +
        (item ? RARITIES[item.rarity].color : 'inherit') + '\">' + (item?.name || 'Пусто') + '</strong></article>';
    }).join('');
    const bag = this.state.inventory.map((item) => {
      const current = this.state.equipment[item.slot];
      const comparison = compareItems(item, current);
      const modifiers = Object.entries(item.modifiers).map(([stat, value]) => {
        const definition = STAT_DEFINITIONS.find((entry) => entry.id === stat);
        const delta = comparison[stat];
        return '<li>' + (definition?.name || stat) + ': +' + value +
          ' <em class=\"' + (delta >= 0 ? 'positive' : 'negative') + '\">(' + (delta >= 0 ? '+' : '') + delta + ')</em></li>';
      }).join('') || '<li>Базовый предмет без свойств</li>';
      return '<article class=\"loot-item\" style=\"border-color:' + RARITIES[item.rarity].color + '\"><h3 style=\"color:' +
        RARITIES[item.rarity].color + '\">' + item.name + '</h3><p>' + RARITIES[item.rarity].name +
        ' · ' + EQUIPMENT_SLOTS.find((slot) => slot.id === item.slot).name + '</p><ul>' + modifiers +
        '</ul><button type=\"button\" data-equip-item=\"' + item.id + '\">[ ЭКИПИРОВАТЬ ]</button></article>';
    }).join('');
    return '<section class=\"equipment-section\"><h3>Экипировка — 8 слотов</h3><div class=\"equipment-grid\">' +
      equipped + '</div><h3>Найденные предметы</h3><div class=\"loot-grid\">' +
      (bag || '<p class=\"overlay-note\">Сундук пролога содержит первую награду.</p>') + '</div></section>';
  }

  spellIndexMarkup() {
    return `<div class="spell-index"><h3>Открытые базовые чары</h3>${[1, 2, 3, 4, 5].map((level) => `
      <section><h4>УРОВЕНЬ ${level}</h4><p>${BASE_SPELLS.filter((spell) => spell.level === level && spell.key.split('-').every((id) => this.state.elementLevels[id] >= level)).map((spell) => spell.name).join(' / ') || 'пока закрыт'}</p></section>`).join('')}</div>`;
  }
}
