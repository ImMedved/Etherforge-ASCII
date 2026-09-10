import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraRasterOffset } from '../src/game/renderer.js';
import { terrainSample } from '../src/game/terrain-pattern.js';

test('raster camera offset keeps terrain and obstacles aligned during diagonal motion', () => {
  const visual = { x: 10.35, y: 20 };
  const raster = { x: 10, y: 20 };
  const offset = cameraRasterOffset(visual, raster);
  const point = { x: 14, y: 23 };
  const anchoredX = (point.x - raster.x - point.y + raster.y) * 2 + offset.x;
  const anchoredY = point.x - raster.x + point.y - raster.y + offset.y;
  const visualX = (point.x - visual.x - point.y + visual.y) * 2;
  const visualY = point.x - visual.x + point.y - visual.y;
  assert.ok(Math.abs(anchoredX - visualX) < 1e-9);
  assert.ok(Math.abs(anchoredY - visualY) < 1e-9);
});

test('grass pattern is deterministic noise rather than a repeating line formula', () => {
  const firstRow = Array.from({ length: 80 }, (_, x) => terrainSample('grass', x, 0).char).join('');
  const secondRow = Array.from({ length: 80 }, (_, x) => terrainSample('grass', x, 1).char).join('');
  assert.notEqual(firstRow, secondRow);
  assert.ok(new Set(firstRow).size >= 3);
  assert.equal(firstRow, Array.from({ length: 80 }, (_, x) => terrainSample('grass', x, 0).char).join(''));
});
