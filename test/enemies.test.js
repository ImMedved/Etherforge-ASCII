import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnemy, ENEMY_ARCHETYPES } from '../src/game/entities.js';
import { ENEMY_SPRITES, playerSpriteFor } from '../src/game/renderer.js';

test('wolf, goblin and orc have distinct combat roles', () => {
  const wolf = createEnemy({ x: 1, y: 1 }, 1, 'wolf');
  const goblin = createEnemy({ x: 2, y: 2 }, 1, 'goblin');
  const orc = createEnemy({ x: 3, y: 3 }, 1, 'orc');
  assert.ok(wolf.moveInterval < goblin.moveInterval && goblin.moveInterval < orc.moveInterval);
  assert.ok(wolf.maxHealth < goblin.maxHealth && goblin.maxHealth < orc.maxHealth);
  assert.ok(wolf.damage < goblin.damage && goblin.damage < orc.damage);
  assert.ok(Object.values(ENEMY_ARCHETYPES).every((enemy) => enemy.visionRange >= 22));
  const ghost = createEnemy({ x: 4, y: 4 }, 1, 'ghost');
  assert.equal(ghost.flying, true);
  assert.equal(ghost.type, 'ghost');
});

test('enemy and player sprites use their intended sizes', () => {
  assert.equal(ENEMY_SPRITES.wolf.length, 3);
  assert.equal(ENEMY_SPRITES.goblin.length, 5);
  assert.equal(ENEMY_SPRITES.orc.length, 6);
  assert.equal(ENEMY_SPRITES.ghost.length, 5);
  assert.equal(playerSpriteFor({ facingX: 0 }).length, 6);
  const idle = playerSpriteFor({ facingX: 1 }, { mode: 'idle', frame: 0 });
  const walking = playerSpriteFor({ facingX: 1 }, { mode: 'walk', frame: 1 });
  const casting = playerSpriteFor({ facingX: -1 }, { mode: 'cast', frame: 1 });
  assert.notDeepEqual(idle, walking);
  assert.notDeepEqual(idle, casting);
  assert.ok(idle.join('').includes('*'));
  assert.ok(casting.join('').includes('|'));
});
