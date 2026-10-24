import { collideCircle, collideSegment, flipper, integrate, RAILS, STEP } from './physics';
import type { Ball, Vec } from './physics';

export type Status = 'ready' | 'playing' | 'paused' | 'won' | 'lost';
export type Stage = 'source' | 'bottling' | 'delivery';
export type Route = 'tea' | 'desk' | 'sport';
export type GameEvent = { type: 'hit' | 'stage' | 'launch' | 'rescue' | 'win' | 'lose'; x: number; y: number; note?: number };
export const ROUTES: Route[] = ['tea', 'desk', 'sport'];
export const ROUTE_INFO = {
  tea: { title: '茶山的一盏清茶', short: '茶山茶杯', subtitle: '山间慢一点，清甜多一点。', color: '#759f57', label: '山野 · 茶歇' },
  desk: { title: '加班桌上的陪伴', short: '加班水杯', subtitle: '再忙，也记得好好喝水。', color: '#bb9452', label: '城市 · 日常' },
  sport: { title: '球场边的一口畅快', short: '球场运动杯', subtitle: '奔跑之后，让清爽接棒。', color: '#548f9c', label: '球场 · 活力' },
};
export const BUMPERS = [
  { x: 166, y: 279, r: 34, note: 0 },
  { x: 354, y: 292, r: 34, note: 2 },
  { x: 157, y: 463, r: 30, note: 4 },
  { x: 373, y: 469, r: 30, note: 3 },
];
export const STATION = { x: 266, y: 377, r: 42 };
export const GATES = {
  tea: { x: 216, y: 533, r: 25 },
  desk: { x: 267, y: 558, r: 25 },
  sport: { x: 321, y: 533, r: 25 },
};
export const GATE = GATES.tea;

export class Game {
  status: Status = 'ready';
  stage: Stage = 'source';
  route: Route = 'tea';
  ball: Ball = this.newBall();
  score = 0;
  elapsed = 0;
  depth = 0;
  saves = 3;
  combo = 0;
  hits = 0;
  left = false;
  right = false;
  leftAmount = 0;
  rightAmount = 0;
  events: GameEvent[] = [];
  notes: number[] = [];
  lastHit = new Map<string, number>();
  lastAction = 0;
  loseReason = '';
  private accumulator = 0;
  private stuckTime = 0;
  private lastPosition: Vec = { x: 483, y: 718 };

  get remaining(): number { return Math.max(0, 72 - this.elapsed); }
  get gate() { return GATES[this.route]; }
  newBall(): Ball { return { x: 483, y: 718, vx: 0, vy: 0, r: 11, launched: false }; }

  start(): void {
    const route = this.route;
    Object.assign(this, new Game());
    this.route = route;
    this.status = 'playing';
    this.launch();
  }

  launch(): void {
    if (this.status !== 'playing' || this.ball.launched) return;
    this.ball.launched = true; this.ball.vx = -8; this.ball.vy = -1120;
    this.emit('launch', this.ball);
  }

  togglePause(): void {
    if (this.status === 'playing') this.status = 'paused';
    else if (this.status === 'paused') this.status = 'playing';
    this.left = false; this.right = false;
    this.accumulator = 0;
  }

  cycleRoute(): void { this.route = ROUTES[(ROUTES.indexOf(this.route) + 1) % 3]; }

  update(delta: number): void {
    if (this.status !== 'playing') return;
    this.accumulator += Math.min(Math.max(0, delta), 0.1);
    while (this.accumulator >= STEP && this.status === 'playing') {
      this.tick(STEP);
      this.accumulator -= STEP;
    }
  }

  private tick(dt: number): void {
    this.elapsed = Math.min(72, this.elapsed + dt);
    if (this.elapsed >= 72) { this.lose('72 秒到了，山泉还在路上。再来一次，把清甜送达。'); return; }
    this.leftAmount += ((this.left ? 1 : 0) - this.leftAmount) * Math.min(1, dt * 24);
    this.rightAmount += ((this.right ? 1 : 0) - this.rightAmount) * Math.min(1, dt * 24);
    if (!this.ball.launched) return;
    const ball = this.ball;
    integrate(ball, dt);
    if (ball.x > 463 && ball.y < 163) {
      ball.x = 435; ball.y = 157; ball.vx = -345; ball.vy = 90;
    }
    if (ball.x > 499) { ball.x = 499; ball.vx = -Math.abs(ball.vx) * 0.8; }
    if (ball.y < 96) { ball.y = 96; ball.vy = Math.abs(ball.vy); }
    for (const rail of RAILS) collideSegment(ball, rail);

    for (const [i, bumper] of BUMPERS.entries()) {
      if (collideCircle(ball, bumper, bumper.r, 1.12)) this.hit(`mineral-${i}`, bumper, bumper.note);
    }
    if (collideCircle(ball, STATION, STATION.r, 0.95)) this.hit('station', STATION, 1);

    for (const side of ['left', 'right'] as const) {
      const active = this[side];
      const segment = flipper(side, side === 'left' ? this.leftAmount : this.rightAmount);
      const contact = collideSegment(ball, segment, 10, 0.65);
      if (contact && active && this.readyHit(`flipper-${side}`, 0.12)) {
        ball.vy = -740 - Math.min(90, Math.abs(ball.vy) * 0.1);
        ball.vx = side === 'left' ? 145 + (ball.x - 150) * 1.4 : -145 - (388 - ball.x) * 1.4;
        this.lastAction = this.elapsed;
        this.emit('hit', ball, side === 'left' ? 0 : 2);
      }
    }

    if (this.stage === 'delivery' && Math.hypot(ball.x - this.gate.x, ball.y - this.gate.y) < this.gate.r + ball.r) this.win();
    if (ball.y > 793 || ball.x < 15 || ball.x > 532) this.drain();

    // Quiet anti-stall current nudges a resting ball, never completes a stage.
    if (Math.hypot(ball.x - this.lastPosition.x, ball.y - this.lastPosition.y) < 0.35) this.stuckTime += dt;
    else this.stuckTime = 0;
    if (this.stuckTime > 2) { ball.vx += ball.x < 270 ? 110 : -110; ball.vy -= 170; this.stuckTime = 0; }
    this.lastPosition = { x: ball.x, y: ball.y };
  }

  hit(id: string, position: Vec, note: number): void {
    if (this.status !== 'playing' || !this.readyHit(id, 0.22)) return;
    this.hits++; this.combo = Math.min(5, this.combo + 1);
    this.score += 100 + this.combo * 20;
    this.notes.push(note); if (this.notes.length > 20) this.notes.shift();
    this.emit('hit', position, note);
    if (this.stage === 'source' && id.startsWith('mineral')) {
      this.depth = Math.min(180, this.depth + 60);
      if (this.depth === 180) { this.stage = 'bottling'; this.score += 300; this.emit('stage', STATION); }
    } else if (this.stage === 'bottling' && id === 'station') {
      this.stage = 'delivery'; this.score += 500; this.emit('stage', this.gate);
    }
  }

  private readyHit(id: string, cooldown: number): boolean {
    if (this.elapsed - (this.lastHit.get(id) ?? -10) < cooldown) return false;
    this.lastHit.set(id, this.elapsed); return true;
  }

  drain(): void {
    if (this.status !== 'playing') return;
    if (this.saves > 0) {
      this.saves--; this.combo = 0; this.ball = this.newBall(); this.stuckTime = 0;
      this.emit('rescue', this.ball);
    } else this.lose('水滴的 3 次救援用完了。试着在水滴靠近时按下左右挡板。');
  }

  win(): void {
    if (this.status !== 'playing' || this.stage !== 'delivery') return;
    this.score += 1000 + Math.ceil(this.remaining) * 10 + this.saves * 100;
    this.status = 'won'; this.left = false; this.right = false;
    this.emit('win', this.gate);
  }

  private lose(reason: string): void {
    this.loseReason = reason; this.status = 'lost'; this.left = false; this.right = false;
    this.emit('lose', this.ball);
  }

  private emit(type: GameEvent['type'], position: Vec, note?: number): void {
    this.events.push({ type, x: position.x, y: position.y, note });
  }
}
