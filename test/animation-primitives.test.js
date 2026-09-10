import test from 'node:test';
import assert from 'node:assert/strict';
import {
  lightingFromAnimations, sampleAmbientSpherePulse, sampleAnimation, sampleStatusParticles,
  spawnLighting, spawnRift, spawnSpherePulse, spawnSphericalExplosion, spawnTornado,
} from '../src/game/animations/primitives.js';
import { applyReusableSpellAnimation, REUSABLE_ANIMATION_SPELLS } from '../src/game/animations/spell-presets.js';

test('reusable tornado, rift, explosion and pulse primitives generate animated particles', () => {
  const state = { animations: [] };
  spawnTornado(state, { x: 2, y: 2 }, 0);
  spawnRift(state, { x: 0, y: 0 }, { x: 7, y: 3 }, 0);
  spawnSphericalExplosion(state, { x: 3, y: 3 }, 0);
  spawnSpherePulse(state, { x: 4, y: 4 }, 0);
  assert.equal(state.animations.length, 4);
  for (const animation of state.animations) {
    const early = sampleAnimation(animation, 100, { x: 0, y: 0 });
    const late = sampleAnimation(animation, Math.min(animation.expiresAt - 1, 600), { x: 0, y: 0 });
    assert.ok(early.length > 0, animation.type);
    assert.notDeepEqual(early, late, animation.type);
  }
});

test('lighting and status particles expose their intended colors', () => {
  const state = { animations: [] };
  spawnLighting(state, 0, { color: '#ffffff', alpha: .2, duration: 1000 });
  const lighting = lightingFromAnimations(state.animations, 500);
  assert.equal(lighting.color, '#ffffff');
  assert.ok(lighting.alpha > .19);
  const entity = { id: 'target', x: 2, y: 2 };
  assert.ok(sampleStatusParticles(entity, 'burn', 200).some((point) => point.color === 'fire'));
  assert.ok(sampleStatusParticles(entity, 'frost', 200).some((point) => point.color === 'water'));
  assert.ok(sampleStatusParticles(entity, 'steam', 200).length > 5);
  assert.ok(sampleAmbientSpherePulse(entity, 200, 1, 'air').length >= 10);
});

test('spell presets reuse primitives across multiple suitable spells', () => {
  for (const spellName of ['Торнадо', 'Разлом', 'Солнцепад', 'Водяная сфера', 'Абсолютная тишина']) {
    assert.ok(REUSABLE_ANIMATION_SPELLS.includes(spellName));
    const state = { animations: [] };
    assert.equal(applyReusableSpellAnimation(state, spellName, { x: 0, y: 0 }, { x: 4, y: 4 }, 0), true);
    assert.ok(state.animations.length > 0, spellName);
  }
});
