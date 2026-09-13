import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, inputKeyFromEvent, movementVectorFromKeys } from '../src/game/game.js';
import { DASH_COOLDOWN_MS, DASH_DURATION_MS } from '../src/config.js';

test('movement uses the physical key on a Russian keyboard layout', () => {
  assert.equal(inputKeyFromEvent({ code: 'KeyW', key: 'ц' }), 'w');
  assert.equal(inputKeyFromEvent({ code: 'KeyA', key: 'ф' }), 'a');
  assert.equal(inputKeyFromEvent({ code: 'KeyE', key: 'у' }), 'e');
});

test('number row and numpad share spell digits', () => {
  assert.equal(inputKeyFromEvent({ code: 'Digit3', key: '3' }), '3');
  assert.equal(inputKeyFromEvent({ code: 'Numpad5', key: '5' }), '5');
});

test('space uses a physical binding and starts a timed dash', () => {
  assert.equal(inputKeyFromEvent({ code: 'Space', key: ' ' }), 'space');
  const game = {
    overlayType: null,
    pressed: new Set(['d']),
    state: {
      gameOver: false,
      player: {
        facingX: 0, facingY: 1,
        dashDirection: null, dashUntil: 0, dashReadyAt: 0,
      },
    },
    setStatus() {},
    updateMovementHud() {},
  };
  assert.equal(Game.prototype.startDash.call(game, 100), true);
  assert.equal(game.state.player.dashUntil, 100 + DASH_DURATION_MS);
  assert.equal(game.state.player.dashReadyAt, 100 + DASH_COOLDOWN_MS);
  assert.ok(game.state.player.dashDirection.x > 0);
  assert.ok(game.state.player.dashDirection.y < 0);
  assert.equal(Game.prototype.startDash.call(game, 200), false);
});

test('single WASD keys follow screen axes and adjacent pairs follow diagonals', () => {
  assert.deepEqual(movementVectorFromKeys(new Set(['w'])), { x: -1, y: -1, screenX: 0, screenY: -1 });
  assert.deepEqual(movementVectorFromKeys(new Set(['a'])), { x: -1, y: 1, screenX: -1, screenY: 0 });
  assert.deepEqual(movementVectorFromKeys(new Set(['w', 'a'])), { x: -1, y: 0, screenX: -1, screenY: -1 });
  assert.deepEqual(movementVectorFromKeys(new Set(['w', 'd'])), { x: 0, y: -1, screenX: 1, screenY: -1 });
});

test('real-time sphere pickup immediately synchronizes progression HUD', () => {
  let hudUpdates = 0;
  const sphere = { key: 4, elementId: 'earth', name: 'Зелёная сфера', active: true };
  const game = {
    state: {
      elementLevels: { air: 0, fire: 0, water: 0, earth: 0 },
      unlocked: false,
      player: { hp: 90, maxHealth: 100, shield: 0 },
      enemies: [{ nextAbilityAt: 0 }, { nextAbilityAt: 0 }],
      combatNumbers: [],
      world: { respawnSphere() {} },
    },
    ui: { worldStatus: { textContent: '' } },
    addLog() {},
    setStatus() {},
    updateHud() { hudUpdates += 1; },
  };
  Game.prototype.collectSphere.call(game, sphere, 1000);
  assert.equal(game.state.elementLevels.earth, 1);
  assert.equal(game.state.unlocked, true);
  assert.equal(game.state.enemies[0].nextAbilityAt, 2800);
  assert.equal(hudUpdates, 1);
});
