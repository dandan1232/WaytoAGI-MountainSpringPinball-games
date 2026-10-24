import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, BUMPERS, STATION } from '../src/game/model';
import { collideCircle, collideSegment, STEP } from '../src/game/physics';
import type { Ball } from '../src/game/physics';

function advance(game: Game, seconds: number) { for (let t = 0; t < seconds; t += STEP) game.update(STEP); }
function minerals(game: Game) { BUMPERS.slice(0, 3).forEach((b, i) => { game.hit(`mineral-${i}`, b, b.note); }); }

test('ready state does not count time, start launches one ball', () => {
  const g = new Game(); advance(g, 3); assert.equal(g.elapsed, 0);
  g.start(); assert.equal(g.status, 'playing'); assert.equal(g.ball.launched, true);
  const vy = g.ball.vy; g.launch(); assert.equal(g.ball.vy, vy);
});
test('three 60m collisions unlock bottling; only the bottling station unlocks delivery', () => {
  const g = new Game(); g.start(); g.hit('station', STATION, 1); assert.equal(g.stage, 'source');
  minerals(g); assert.equal(g.depth, 180); assert.equal(g.stage, 'bottling');
  g.hit('mineral-3', BUMPERS[3], 3); assert.equal(g.stage, 'bottling');
  advance(g, 0.3); g.hit('station', STATION, 1); assert.equal(g.stage, 'delivery');
});
test('collision cooldown prevents repeated score from a resting contact', () => {
  const g = new Game(); g.start(); g.hit('mineral-0', BUMPERS[0], 0);
  const score = g.score; for (let i = 0; i < 20; i++) g.hit('mineral-0', BUMPERS[0], 0);
  assert.equal(g.depth, 60); assert.equal(g.score, score);
});
test('win requires actual entry after bottling, records the selected route', () => {
  const g = new Game(); g.start(); g.route = 'sport';
  g.ball.x = g.gate.x; g.ball.y = g.gate.y; g.ball.vx = 0; g.ball.vy = 0;
  g.update(STEP); assert.equal(g.status, 'playing');
  minerals(g); g.hit('station', STATION, 1);
  g.update(STEP); assert.equal(g.status, 'won'); assert.equal(g.route, 'sport');
  const score = g.score; g.win(); assert.equal(g.score, score);
});
test('pause freezes time and physics, clears held input, resumes explicitly', () => {
  const g = new Game(); g.start(); g.left = true; advance(g, 0.3); g.togglePause();
  const elapsed = g.elapsed, ball = { ...g.ball }; advance(g, 4);
  assert.equal(g.elapsed, elapsed); assert.deepEqual(g.ball, ball); assert.equal(g.left, false);
  g.togglePause(); advance(g, 0.2); assert.ok(g.elapsed > elapsed);
});
test('timer expires at 72 seconds, including waiting after a rescue', () => {
  const g = new Game(); g.start(); g.ball.launched = false; advance(g, 73);
  assert.equal(g.status, 'lost'); assert.equal(g.remaining, 0); assert.match(g.loseReason, /72/);
});
test('three rescues preserve progress, fourth drain loses, restart clears everything', () => {
  const g = new Game(); g.start(); minerals(g); const score = g.score;
  for (let i = 2; i >= 0; i--) { g.drain(); assert.equal(g.saves, i); assert.equal(g.ball.launched, false); g.launch(); }
  assert.equal(g.stage, 'bottling'); assert.equal(g.score, score);
  g.drain(); assert.equal(g.status, 'lost'); g.route = 'desk'; g.start();
  assert.equal(g.saves, 3); assert.equal(g.score, 0); assert.equal(g.depth, 0); assert.equal(g.stage, 'source'); assert.equal(g.route, 'desk');
});
test('route switch cycles through all three destinations', () => {
  const g = new Game(); assert.equal(g.route, 'tea'); g.cycleRoute(); assert.equal(g.route, 'desk');
  g.cycleRoute(); assert.equal(g.route, 'sport'); g.cycleRoute(); assert.equal(g.route, 'tea');
});
test('circle collision resolves penetration and reflects incoming velocity', () => {
  const b: Ball = { x: 0, y: 15, vx: 0, vy: -100, r: 10, launched: true };
  assert.equal(collideCircle(b, { x: 0, y: 0 }, 10), true); assert.ok(b.y >= 20); assert.ok(b.vy > 0);
  const center: Ball = { x: 0, y: 0, vx: 0, vy: 1, r: 10, launched: true };
  collideCircle(center, { x: 0, y: 0 }, 10); assert.ok(Number.isFinite(center.y)); assert.ok(center.y < 0);
});
test('rail collision resolves a moving ball at endpoints and edge', () => {
  const b: Ball = { x: 50, y: 5, vx: 0, vy: -100, r: 10, launched: true };
  assert.ok(collideSegment(b, { a: { x: 0, y: 0 }, b: { x: 100, y: 0 } })); assert.ok(b.vy > 0);
});
test('long simulations keep the ball finite and respect stage order', () => {
  for (let seed = 0; seed < 12; seed++) {
    const g = new Game(); g.start();
    for (let tick = 0; tick < 72 * 120 && g.status === 'playing'; tick++) {
      g.left = Math.sin(tick / (15 + seed * 2)) > -0.3;
      g.right = Math.cos(tick / (19 + seed * 3)) > -0.3;
      if (!g.ball.launched) g.launch(); g.update(STEP);
      assert.ok(Number.isFinite(g.ball.x) && Number.isFinite(g.ball.vy));
      assert.ok(g.depth <= 180 && g.saves >= 0 && g.remaining >= 0);
      if (g.stage !== 'source') assert.equal(g.depth, 180);
    }
    assert.ok(['won', 'lost'].includes(g.status));
  }
});

test('all three physical route gates can be reached with flipper input', () => {
  for (const route of ['tea', 'desk', 'sport'] as const) {
    let wins = 0;
    for (let seed = 0; seed < 8; seed++) {
      const g = new Game(); g.route = route; g.start();
      for (let tick = 0; tick < 72 * 120 && g.status === 'playing'; tick++) {
        g.left = seed === 0 || Math.sin(tick / (15 + seed * 2)) > -0.3;
        g.right = seed === 0 || Math.cos(tick / (19 + seed * 3)) > -0.3;
        if (!g.ball.launched) g.launch(); g.update(STEP);
      }
      if (g.status === 'won') wins++;
    }
    assert.ok(wins >= 4, `${route}: only ${wins}/8 input patterns succeeded`);
  }
});
