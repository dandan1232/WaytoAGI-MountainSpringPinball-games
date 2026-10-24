import { Game } from '../src/game/model';
import { STEP } from '../src/game/physics';

const results = [];
for (let seed = 0; seed < 24; seed++) {
  const g = new Game(); g.start();
  for (let tick = 0; tick < 72 * 120 && g.status === 'playing'; tick++) {
    g.left = seed === 0 || Math.sin(tick / (15 + seed * 2)) > -0.3;
    g.right = seed === 0 || Math.cos(tick / (19 + seed * 3)) > -0.3;
    if (!g.ball.launched) g.launch();
    g.update(STEP);
  }
  results.push({ seed, status: g.status, stage: g.stage, time: +g.elapsed.toFixed(2), score: g.score, hits: g.hits, depth: g.depth });
}
console.table(results);
const wins = results.filter(g => g.status === 'won').length;
console.log(`${wins}/${results.length} simulated input patterns delivered a cup.`);
