import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readRecord, writeRecord, finishRecord } from '../src/game/storage';
import { Game } from '../src/game/model';

let data = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) } });
test('corrupt records safely recover and do not block game', () => {
  data.clear(); data.set('mountain-spring-pinball:v1', '{broken'); assert.equal(readRecord().best, 0);
  data.set('mountain-spring-pinball:v1', JSON.stringify({ best: -10, fastest: 'bad', routes: ['tea', 'fake', 'tea'], deliveries: -1 }));
  const r = readRecord(); assert.equal(r.best, 0); assert.equal(r.fastest, null); assert.deepEqual(r.routes, ['tea']); assert.equal(r.deliveries, 0);
});
test('winning saves best score, fastest time, unique cup collection and mute preference', () => {
  data.clear(); let r = readRecord(); r.muted = true; const g = new Game(); g.status = 'won'; g.score = 3000; g.elapsed = 20; g.route = 'desk';
  r = finishRecord(r, g); assert.equal(r.best, 3000); assert.equal(r.fastest, 20); assert.equal(r.deliveries, 1); assert.deepEqual(r.routes, ['desk']);
  g.score = 2500; g.elapsed = 30; r = finishRecord(r, g); assert.equal(r.best, 3000); assert.equal(r.fastest, 20); assert.equal(r.deliveries, 2); assert.deepEqual(r.routes, ['desk']);
  writeRecord(r); assert.equal(readRecord().muted, true);
});
test('a lost round can set a score but does not add a cup', () => {
  data.clear(); const g = new Game(); g.status = 'lost'; g.score = 600; const r = finishRecord(readRecord(), g);
  assert.equal(r.best, 600); assert.equal(r.deliveries, 0); assert.equal(r.fastest, null); assert.equal(r.routes.length, 0);
});
