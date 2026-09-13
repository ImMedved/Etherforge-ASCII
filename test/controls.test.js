import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTROL_LAYOUTS,
  actionForCode,
  createControlProfile,
  rebindAction,
  runeIndexForCode,
  setControlLayout
} from '../src/game/controls.js';

test('temporary control layouts cover movement, four quick spells and four belt slots', () => {
  assert.ok(Object.keys(CONTROL_LAYOUTS).length >= 3);
  for (const layoutId of Object.keys(CONTROL_LAYOUTS)) {
    const profile = createControlProfile(layoutId);
    for (let index = 1; index <= 4; index += 1) {
      assert.ok(profile.bindings['quickSpell' + index].length);
      assert.ok(profile.bindings['belt' + index].length);
    }
  }
});

test('formula digits stay fixed while action bindings can be remapped', () => {
  const profile = createControlProfile('modern');
  assert.equal(runeIndexForCode('Digit1'), 1);
  assert.equal(runeIndexForCode('Numpad5'), 5);
  assert.equal(rebindAction(profile, 'interact', 'KeyG'), true);
  assert.equal(actionForCode(profile, 'KeyG'), 'interact');
  assert.equal(profile.layoutId, 'custom');
  setControlLayout(profile, 'legacy');
  assert.equal(actionForCode(profile, 'KeyF'), 'interact');
});
