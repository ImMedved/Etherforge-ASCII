import test from 'node:test';
import assert from 'node:assert/strict';
import { VIEWPORT_ROWS, WORLD_SIZE } from '../src/config.js';
import { createWorld } from '../src/game/world.js';

test('world is larger than the visible field and has a passable sphere tile', () => {
  const world = createWorld();
  assert.ok(WORLD_SIZE > VIEWPORT_ROWS);
  for (const sphere of world.spheres) {
    assert.equal(world.isPassable(sphere.x, sphere.y), true);
  }
});

test('enemy spawns are passable and avoid excluded positions', () => {
  const world = createWorld(12);
  const player = { x: 29, y: 32 };
  for (let i = 0; i < 30; i += 1) {
    const spawn = world.findSpawn([player], 7);
    assert.equal(world.isPassable(spawn.x, spawn.y), true);
    assert.ok(Math.hypot(spawn.x - player.x, spawn.y - player.y) >= 7);
    assert.notDeepEqual(spawn, player);
  }
});

test('initial test enemies can be constrained to a nearby ring', () => {
  const world = createWorld(44);
  const player = { x: 29, y: 32 };
  const spawn = world.findSpawn([player], 7, 11);
  const gap = Math.hypot(spawn.x - player.x, spawn.y - player.y);
  assert.ok(gap >= 7 && gap <= 11);
  assert.equal(world.isPassable(spawn.x, spawn.y), true);
});

test('a collected sphere respawns on another passable unoccupied tile', () => {
  const world = createWorld(42);
  const sphere = world.spheres[0];
  const before = { x: sphere.x, y: sphere.y };
  world.respawnSphere(sphere, [{ x: 29, y: 32 }]);
  assert.equal(world.isPassable(sphere.x, sphere.y), true);
  assert.ok(Math.hypot(sphere.x - 29, sphere.y - 32) >= 5);
  assert.notDeepEqual({ x: sphere.x, y: sphere.y }, before);
});

test('large village houses have solid walls, a door and a detectable interior', () => {
  const world = createWorld();
  const house = world.houses[0];
  assert.ok(house.halfWidth >= 4 && house.halfHeight >= 3);
  assert.equal(world.isPassable(house.x + house.halfWidth, house.y), false);
  assert.equal(world.isPassable(house.door.x, house.door.y), true);
  assert.equal(world.houseAt({ x: house.x, y: house.y })?.id, house.id);
  assert.equal(world.houseAt({ x: house.x + house.halfWidth + 1, y: house.y }), null);
});
