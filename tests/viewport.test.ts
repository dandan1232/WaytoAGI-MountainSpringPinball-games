import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitViewport } from '../src/game/viewport';
import { HEIGHT, WIDTH } from '../src/game/physics';

test('a wide window fits the portrait table without stretching circles into ovals', () => {
  const view = fitViewport(800, 600);
  assert.equal(view.scale, 600 / HEIGHT);
  assert.ok(view.offsetX > 0); assert.equal(view.offsetY, 0);
  assert.ok(Math.abs(view.scale * WIDTH + view.offsetX * 2 - 800) < 1e-8);
});
test('Windows display scaling fits the full table inside centered pixel bounds', () => {
  for (const dpr of [1, 1.25, 1.5, 2, 3]) {
    for (const [width, height] of [[540, 820], [477, 725], [585, 889], [357, 542], [1200, 700]]) {
      const view = fitViewport(width, height, dpr);
      assert.ok(view.offsetX >= -1e-8 && view.offsetY >= -1e-8);
      assert.ok(Math.min(Math.abs(view.offsetX), Math.abs(view.offsetY)) < 1e-8);
      assert.ok(WIDTH * view.scale <= view.pixelWidth + 1);
      assert.ok(HEIGHT * view.scale <= view.pixelHeight + 1);
      assert.ok(Math.abs(WIDTH * view.scale + 2 * view.offsetX - view.pixelWidth) <= 0.5);
      assert.ok(Math.abs(HEIGHT * view.scale + 2 * view.offsetY - view.pixelHeight) <= 0.5);
    }
  }
});
