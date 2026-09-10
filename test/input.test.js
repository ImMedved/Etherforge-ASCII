import test from 'node:test';
import assert from 'node:assert/strict';
import { inputKeyFromEvent, movementVectorFromKeys } from '../src/game/game.js';

test('movement uses the physical key on a Russian keyboard layout', () => {
  assert.equal(inputKeyFromEvent({ code: 'KeyW', key: 'ц' }), 'w');
  assert.equal(inputKeyFromEvent({ code: 'KeyA', key: 'ф' }), 'a');
  assert.equal(inputKeyFromEvent({ code: 'KeyE', key: 'у' }), 'e');
});

test('number row and numpad share spell digits', () => {
  assert.equal(inputKeyFromEvent({ code: 'Digit3', key: '3' }), '3');
  assert.equal(inputKeyFromEvent({ code: 'Numpad5', key: '5' }), '5');
});

test('single WASD keys follow screen axes and adjacent pairs follow diagonals', () => {
  assert.deepEqual(movementVectorFromKeys(new Set(['w'])), { x: -1, y: -1, screenX: 0, screenY: -1 });
  assert.deepEqual(movementVectorFromKeys(new Set(['a'])), { x: -1, y: 1, screenX: -1, screenY: 0 });
  assert.deepEqual(movementVectorFromKeys(new Set(['w', 'a'])), { x: -1, y: 0, screenX: -1, screenY: -1 });
  assert.deepEqual(movementVectorFromKeys(new Set(['w', 'd'])), { x: 0, y: -1, screenX: 1, screenY: -1 });
});
