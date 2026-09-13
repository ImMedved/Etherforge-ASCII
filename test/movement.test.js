import test from 'node:test';
import assert from 'node:assert/strict';
import { isPositionPassable, moveActor, normalizeVector } from '../src/game/movement.js';

function testWorld(blocked = new Set()) {
  return {
    getTile(x, y) {
      return x < -4 || y < -4 || x > 4 || y > 4 ? 'void' : 'grass';
    },
    isPassable(x, y) {
      return Number.isInteger(x) && Number.isInteger(y)
        && this.getTile(x, y) !== 'void'
        && !blocked.has(`${x},${y}`);
    },
  };
}

test('movement vectors are normalized so every direction has the same speed', () => {
  const straight = normalizeVector({ x: 1, y: 0 });
  const diagonal = normalizeVector({ x: 1, y: 1 });
  assert.equal(Math.hypot(straight.x, straight.y), 1);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 1e-10);
});

test('actors retain fractional coordinates during continuous movement', () => {
  const actor = { x: 0, y: 0, hp: 10, collisionRadius: 0.32 };
  const moved = moveActor(actor, { x: 0.25, y: 0.1 }, testWorld());
  assert.ok(moved > 0);
  assert.ok(Math.abs(actor.x - 0.25) < 1e-10);
  assert.ok(Math.abs(actor.y - 0.1) < 1e-10);
});

test('continuous collision prevents tunneling and permits wall sliding', () => {
  const world = testWorld(new Set(['1,-1', '1,0', '1,1', '1,2']));
  const actor = { x: 0, y: 0, hp: 10, collisionRadius: 0.32 };
  moveActor(actor, { x: 2, y: 1 }, world);
  assert.ok(actor.x <= 0.2, `actor crossed the wall at x=${actor.x}`);
  assert.ok(actor.y > 0.5, `actor did not slide along the wall at y=${actor.y}`);
  assert.equal(isPositionPassable(world, actor.x, actor.y, actor.collisionRadius), true);
});

test('actors cannot overlap while moving in real time', () => {
  const actor = { x: 0, y: 0, hp: 10, collisionRadius: 0.32 };
  const obstacle = { x: 1, y: 0, hp: 10, collisionRadius: 0.32 };
  moveActor(actor, { x: 2, y: 0 }, testWorld(), [obstacle]);
  assert.ok(actor.x < obstacle.x);
  assert.ok(Math.hypot(actor.x - obstacle.x, actor.y - obstacle.y) >= 0.68);
});
