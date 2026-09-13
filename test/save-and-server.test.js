import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWindowsCleanupScript, devServerPidFile, SERVER_MARKER } from '../scripts/dev-server-processes.js';
import { createSaveSnapshot, loadGame, saveGame, SAVE_VERSION } from '../src/game/save-game.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

test('hub saves round-trip campaign, quest, equipment and bindings', () => {
  const state = {
    progression: { spheres: { air: 1, fire: 1 }, missionsCompleted: ['prologue'] },
    prologue: { phase: 'complete' },
    equipment: { staff: { id: 'staff-1' } },
    inventory: [{ id: 'loot-1' }],
    belt: [{ name: 'Зелье', quantity: 2 }],
    controls: { layoutId: 'modern', bindings: { interact: ['KeyF'] } },
    quickSpells: [{ key: '221' }, null, null, null]
  };
  const storage = memoryStorage();
  assert.equal(saveGame(storage, state, 1234), true);
  const loaded = loadGame(storage);
  assert.equal(loaded.version, SAVE_VERSION);
  assert.equal(loaded.savedAt, 1234);
  assert.equal(loaded.prologue.phase, 'complete');
  assert.equal(loaded.quickSpellKeys[0], '221');
});

test('invalid save data is ignored', () => {
  const storage = memoryStorage();
  storage.setItem('ascii-arcana.save.v1', '{broken');
  assert.equal(loadGame(storage), null);
  const state = { progression: {}, prologue: {}, equipment: {}, inventory: [], belt: [], controls: {}, quickSpells: [] };
  assert.equal(createSaveSnapshot(state).version, SAVE_VERSION);
});

test('Windows cleanup targets matching old dev servers and excludes itself', () => {
  const script = buildWindowsCleanupScript(40173, 9876);
  assert.match(script, /LocalPort 40173/);
  assert.ok(script.includes(SERVER_MARKER));
  assert.match(script, /ProcessId -ne 9876/);
  assert.match(script, /scripts\/dev-server\.js/);
  assert.match(script, /Stop-Process/);
  assert.match(devServerPidFile('C:\\game', 40174), /etherforge-ascii-[a-f0-9]{12}-40174\.pid$/);
});
