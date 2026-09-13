import test from 'node:test';
import assert from 'node:assert/strict';
import { PROLOGUE_HOUSES, PROLOGUE_VILLAGES } from '../src/data/prologue.js';
import {
  createPrologueState,
  createPrologueStateAtPhase,
  prologueObjective,
  recordPrologueEnemyDefeat,
  recordPrologueEquipment,
  recordPrologueHouse,
  recordPrologueHubSave,
  recordPrologueLocation,
  recordPrologueSphere
} from '../src/game/prologue.js';

test('the prologue completes the full two-village gameplay loop', () => {
  const prologue = createPrologueState();
  assert.match(prologueObjective(prologue), /Воздуха/);
  assert.equal(recordPrologueSphere(prologue, 'air'), 'wolves');
  assert.equal(recordPrologueEnemyDefeat(prologue, 'port-wolves'), false);
  assert.equal(recordPrologueEnemyDefeat(prologue, 'port-wolves'), false);
  assert.equal(recordPrologueEnemyDefeat(prologue, 'port-wolves'), 'reach-port');
  assert.equal(recordPrologueLocation(prologue, 'port-village'), 'inspect-port');
  for (const house of PROLOGUE_HOUSES) recordPrologueHouse(prologue, house.id);
  assert.equal(prologue.phase, 'travel-undead');
  assert.equal(recordPrologueLocation(prologue, 'undead-village'), 'clear-undead');
  for (let index = 0; index < 3; index += 1) {
    assert.equal(recordPrologueEnemyDefeat(prologue, 'undead-outskirts'), false);
  }
  assert.equal(recordPrologueEnemyDefeat(prologue, 'undead-outskirts'), 'lich');
  assert.equal(recordPrologueEnemyDefeat(prologue, 'tower-lich'), 'find-fire');
  assert.equal(recordPrologueSphere(prologue, 'fire'), 'return-port');
  assert.equal(recordPrologueLocation(prologue, 'port-village'), 'equip-reward');
  assert.equal(recordPrologueEquipment(prologue), true);
  assert.equal(recordPrologueHubSave(prologue), true);
  assert.equal(prologue.phase, 'complete');
  assert.deepEqual(prologue.visitedVillages, ['port-village', 'undead-village']);
});

test('developer quest jumps restore prior progress and the first dialogue choice', () => {
  const prologue = createPrologueStateAtPhase('find-fire');
  assert.deepEqual(prologue.housesInspected, PROLOGUE_HOUSES.map((house) => house.id));
  assert.deepEqual(prologue.visitedVillages, ['port-village', 'undead-village']);
  assert.equal(prologue.dialogueChoices.arrival, 'take-guards');
  assert.equal(Object.keys(PROLOGUE_VILLAGES).length, 2);
});
