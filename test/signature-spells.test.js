import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_SPELLS } from '../src/data/spells.js';
import {
  SIGNATURE_MOTIFS,
  SIGNATURE_SPELL_NAMES,
  sampleSignatureSpell,
  spawnProjectileSignature,
  spawnSignatureSpell,
} from '../src/game/animations/signature-spells.js';

function sample(spellName, now = 500, player = { x: 2, y: 3 }) {
  const state = { animations: [] };
  assert.equal(spawnSignatureSpell(state, spellName, { x: 2, y: 3 }, { x: 9, y: 7 }, 0), true);
  return sampleSignatureSpell(state.animations[0], now, player);
}

test('every level three through five spell has its own signature motif', () => {
  const catalog = BASE_SPELLS.filter((spell) => spell.level >= 3).map((spell) => spell.name).sort();
  assert.deepEqual([...SIGNATURE_SPELL_NAMES].sort(), catalog);
  assert.equal(new Set(Object.values(SIGNATURE_MOTIFS)).size, catalog.length);

  for (const spellName of catalog) {
    const particles = sample(spellName);
    assert.ok(particles.length > 0, spellName);
    assert.ok(particles.every((particle) => particle.glyph && particle.color), spellName);
  }
});

test('signature geometry reflects beam, falling sun and a vertical tornado', () => {
  const beam = sample('Плазменный луч', 300);
  assert.ok(Math.max(...beam.map((particle) => particle.x)) > 8);

  const sunfall = sample('Солнцепад', 300);
  assert.ok(sunfall.some((particle) => particle.screenDy < -8));

  const tornado = sample('Торнадо', 700);
  assert.ok(tornado.some((particle) => particle.screenDy < -6));
});

test('protective orbit follows the player and large volleys are throttled', () => {
  const state = { animations: [] };
  spawnSignatureSpell(state, 'Водяная сфера', { x: 0, y: 0 }, { x: 0, y: 0 }, 0);
  const first = sampleSignatureSpell(state.animations[0], 500, { x: 1, y: 1 });
  const moved = sampleSignatureSpell(state.animations[0], 500, { x: 7, y: 4 });
  assert.ok(moved[0].x - first[0].x > 5);

  assert.equal(spawnProjectileSignature(state, 'Огненный дождь', { x: 1, y: 1 }, { x: 1, y: 1 }, 100), true);
  assert.equal(spawnProjectileSignature(state, 'Огненный дождь', { x: 2, y: 2 }, { x: 2, y: 2 }, 200), false);
  assert.equal(spawnProjectileSignature(state, 'Огненный дождь', { x: 3, y: 3 }, { x: 3, y: 3 }, 900), true);
});
