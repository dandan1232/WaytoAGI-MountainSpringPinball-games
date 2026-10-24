import { BUMPERS, GATES, ROUTES, ROUTE_INFO, STATION } from './model';
import type { Game, GameEvent, Route } from './model';
import { flipper, HEIGHT, RAILS, WIDTH } from './physics';

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; r: number };
const INK = '#174c40';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private scenery = document.createElement('canvas');
  private particles: Particle[] = [];
  private trail: { x: number; y: number }[] = [];
  private flashes = new Map<string, number>();
  private product = new Image();
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.scenery.width = WIDTH * 2; this.scenery.height = HEIGHT * 2;
    this.product.src = '/brand/spring-water.webp';
    this.product.onload = () => this.drawScenery();
    this.drawScenery(); this.resize();
  }
  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = WIDTH * dpr; this.canvas.height = HEIGHT * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  reset(): void { this.trail = []; this.particles = []; this.flashes.clear(); }
  private shape(c: CanvasRenderingContext2D, path: string, color: string, stroke?: string, width = 1): void {
    const p = new Path2D(path); c.fillStyle = color; c.fill(p);
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(p); }
  }
  private circle(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke?: string, width = 1): void {
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  private text(c: CanvasRenderingContext2D, text: string, x: number, y: number, size = 12, color = INK, font = 'sans-serif'): void {
    c.font = `600 ${size}px ${font}`; c.fillStyle = color; c.textAlign = 'center'; c.fillText(text, x, y);
  }
  private tree(c: CanvasRenderingContext2D, x: number, y: number, scale = 1, tone = 0): void {
    c.save(); c.translate(x, y); c.scale(scale, scale);
    c.fillStyle = '#526b43'; c.fillRect(-2, -3, 4, 23);
    this.circle(c, 3, 1, 20, '#46694820');
    this.circle(c, 0, -15, 17, ['#719d62', '#4f8c64', '#94b97e'][tone % 3]);
    this.circle(c, -7, -23, 12, ['#8ab57a', '#6da57e', '#b0ca8e'][tone % 3]);
    this.circle(c, 5, -27, 12, ['#9bbf85', '#81b68a', '#b9d39d'][tone % 3]);
    c.restore();
  }
  private house(c: CanvasRenderingContext2D, x: number, y: number, scale = 1, gold = false): void {
    c.save(); c.translate(x, y); c.scale(scale, scale);
    this.shape(c, 'M-29 12L7 1 35 17 0 29Z', '#365c4430');
    this.shape(c, 'M-25-10L5-18 5 18-25 27Z', '#fdf8df');
    this.shape(c, 'M5-18L28-6 28 29 5 18Z', '#d5d9ba');
    this.shape(c, 'M-33-13L-2-34 35-15 4-4Z', gold ? '#b9954a' : '#48675b');
    this.shape(c, 'M-33-13L4-4 4 2-33-8Z', gold ? '#8e783f' : '#284f48');
    this.shape(c, 'M4-4L35-15 35-9 4 2Z', '#6b8271');
    c.fillStyle = '#71877a'; c.fillRect(-15, 6, 8, 15); c.fillStyle = '#b9c8b7'; c.fillRect(-22, -3, 5, 6);
    this.shape(c, 'M12 0L20 4 20 12 12 8Z', '#7c9d8c');
    c.restore();
  }
  private drawScenery(): void {
    const c = this.scenery.getContext('2d')!; c.setTransform(2, 0, 0, 2, 0, 0);
    c.clearRect(0, 0, WIDTH, HEIGHT);
    c.save(); c.beginPath(); c.roundRect(9, 9, 522, 802, 82); c.fillStyle = '#164d41'; c.fill();
    const metal = c.createLinearGradient(10, 0, 530, 0);
    metal.addColorStop(0, '#7f9f7c'); metal.addColorStop(0.14, '#e7efd7'); metal.addColorStop(0.5, '#bad1af'); metal.addColorStop(1, '#779c7b');
    c.beginPath(); c.roundRect(17, 11, 506, 790, 76); c.fillStyle = metal; c.fill();
    const ground = c.createLinearGradient(0, 0, 200, 820);
    ground.addColorStop(0, '#e5f1d7'); ground.addColorStop(0.45, '#e2ecd1'); ground.addColorStop(1, '#c4d9b8');
    c.beginPath(); c.roundRect(32, 27, 476, 752, 62); c.fillStyle = ground; c.fill(); c.strokeStyle = '#f8fff2'; c.lineWidth = 3; c.stroke(); c.clip();
    // Engraved topography is deliberately quiet behind the moving ball.
    for (let i = 0; i < 15; i++) {
      c.beginPath(); c.ellipse(265, 415, 95 + i * 21, 120 + i * 26, -0.25, 0, Math.PI * 2);
      c.strokeStyle = '#6a9c6510'; c.lineWidth = 1; c.stroke();
    }
    this.shape(c, 'M20 213 Q65 161 100 170 Q145 60 185 102 Q226 37 267 119 Q300 83 328 130 Q369 57 410 137 Q470 102 520 211L520 260 20 260Z', '#b3cc9f');
    this.shape(c, 'M18 238Q58 188 108 211Q161 114 204 162Q235 107 279 189Q329 124 365 194Q408 127 461 207Q495 188 524 224L524 270 18 270Z', '#88b18a');
    this.shape(c, 'M122 226Q166 144 185 169L159 235Z', '#a5c593');
    this.shape(c, 'M306 223Q355 143 369 171L351 230Z', '#a5c593');
    this.shape(c, 'M20 267Q92 210 155 238Q222 184 291 232Q365 184 441 240Q485 221 523 246L523 305 20 305Z', '#659d7d');
    for (let i = 0; i < 12; i++) this.tree(c, 75 + i * 34, 231 + Math.sin(i * 2) * 15, 0.45 + (i % 3) * 0.13, i);
    this.house(c, 218, 220, 0.66); this.house(c, 260, 206, 0.86); this.house(c, 302, 225, 0.67);
    // A spring becomes a river, and the river becomes a pinball rail.
    this.shape(c, 'M237 237C185 263 324 281 282 320C238 356 309 388 275 438C242 485 298 521 251 571C224 598 273 632 258 662L305 662C320 615 268 598 300 575C358 525 297 489 322 445C366 371 288 358 327 319C368 271 267 259 277 237Z', '#8fcbb785');
    c.strokeStyle = '#e8fff2'; c.lineWidth = 2;
    c.stroke(new Path2D('M264 246C221 266 343 288 304 322C260 362 337 386 300 442C266 491 326 521 281 573'));
    this.shape(c, 'M85 348L121 321 153 341 145 394 101 407 76 385Z', '#a7bc9130');
    this.house(c, 102, 347, 0.87); this.house(c, 412, 385, 0.83); this.house(c, 111, 413, 0.56);
    this.tree(c, 85, 314, 0.55); this.tree(c, 427, 334, 0.69, 1); this.tree(c, 97, 502, 0.5, 1);
    this.tree(c, 426, 510, 0.6, 2); this.tree(c, 87, 609, 0.7, 2); this.tree(c, 431, 612, 0.7, 1);
    // Mineral strata under the village.
    for (let i = 0; i < 4; i++) {
      this.shape(c, `M75 ${718 + i * 14}Q153 ${697 + i * 14} 243 ${731 + i * 14}T460 ${715 + i * 14}L460 ${741 + i * 14}Q342 ${773 + i * 14} 235 ${755 + i * 14}T75 ${746 + i * 14}Z`, ['#a1b78b', '#91aa80', '#7f9a76', '#6d8b6b'][i]);
    }
    this.text(c, '地 下 1 8 0 米 · 天 然 泉 源', 269, 755, 11, '#f0f5de');
    // Sculpted rail shadows and white glass highlights.
    for (const rail of RAILS) {
      c.beginPath(); c.moveTo(rail.a.x + 3, rail.a.y + 6); c.lineTo(rail.b.x + 3, rail.b.y + 6);
      c.lineWidth = 13; c.strokeStyle = '#315e3b28'; c.lineCap = 'round'; c.stroke();
      c.beginPath(); c.moveTo(rail.a.x, rail.a.y); c.lineTo(rail.b.x, rail.b.y);
      c.lineWidth = 9; c.strokeStyle = '#80ac8d'; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#eef7d9'; c.stroke();
    }
    // Plunger lane.
    c.beginPath(); c.roundRect(468, 196, 30, 563, 15); c.fillStyle = '#699d8040'; c.fill();
    c.strokeStyle = '#eff7dd'; c.lineWidth = 2; c.stroke();
    for (let y = 747; y > 719; y -= 5) { c.beginPath(); c.moveTo(475, y); c.lineTo(492, y - 3); c.strokeStyle = '#5e8f72'; c.stroke(); }
    this.text(c, '↑', 483, 652, 21, '#527d65');
    this.text(c, '山 泉 弹 珠 台', 271, 69, 22, INK, 'serif');
    this.text(c, 'M O U N T A I N   S P R I N G', 271, 91, 8, '#63866b', 'monospace');
    c.restore();
    for (const [x, y] of [[40, 112], [501, 112], [40, 704], [501, 704]]) {
      this.circle(c, x, y, 5, '#56795d', '#dae7c3', 1.5);
      c.beginPath(); c.moveTo(x - 2, y + 2); c.lineTo(x + 2, y - 2); c.strokeStyle = '#d3e4be'; c.stroke();
    }
    this.text(c, 'D O N G T I N G   S P R I N G', 270, 793, 8, '#e0edcd', 'monospace');
  }
  event(event: GameEvent): void {
    if (event.type === 'hit' || event.type === 'stage') {
      this.flashes.set(`${Math.round(event.x)},${Math.round(event.y)}`, 1);
      if (!this.reducedMotion) for (let i = 0; i < (event.type === 'stage' ? 24 : 8); i++) {
        const angle = Math.PI * 2 * i / 8 + Math.random() * 0.4;
        this.particles.push({ x: event.x, y: event.y, vx: Math.cos(angle) * (35 + Math.random() * 75), vy: Math.sin(angle) * 100 - 40, life: 0.7, max: 0.7, color: event.type === 'stage' ? '#eac26e' : '#f5fff5', r: 2 + Math.random() * 3 });
      }
    }
    if (event.type === 'rescue' || event.type === 'launch') this.trail = [];
  }
  render(game: Game, dt: number, time: number): void {
    const c = this.ctx; c.clearRect(0, 0, WIDTH, HEIGHT); c.drawImage(this.scenery, 0, 0, WIDTH, HEIGHT);
    for (const [key, value] of this.flashes) { const next = value - dt * 3; if (next <= 0) this.flashes.delete(key); else this.flashes.set(key, next); }
    for (const [i, b] of BUMPERS.entries()) {
      const flash = this.flashes.get(`${b.x},${b.y}`) ?? 0;
      this.circle(c, b.x + 3, b.y + 10, b.r + 3, '#295b4430');
      this.circle(c, b.x, b.y + 5, b.r, '#a28c44');
      const g = c.createRadialGradient(b.x - 10, b.y - 15, 2, b.x, b.y, b.r);
      g.addColorStop(0, '#fff3b9'); g.addColorStop(1, '#dfba65');
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.fillStyle = g; c.fill(); c.strokeStyle = '#fff7d2'; c.lineWidth = 2; c.stroke();
      this.circle(c, b.x, b.y, b.r - 8, '#f4db8b', '#cba55b', 1);
      this.text(c, ['岩', '泉', '润', '石'][i], b.x, b.y + 7, 22, '#8b773e', 'serif');
      if (flash > 0) { c.globalAlpha = flash; this.circle(c, b.x, b.y, b.r + 12 * (1 - flash), '#fffbe520', '#fffbe5', 3); c.globalAlpha = 1; }
      this.text(c, '+60 m', b.x, b.y + b.r + 21, 9, '#4a7459', 'monospace');
    }
    // Bottling station with the actual product image supplied by the user.
    const active = game.stage === 'bottling';
    const glow = active && !this.reducedMotion ? 0.55 + Math.sin(time * 4) * 0.2 : 0.6;
    this.circle(c, STATION.x + 2, STATION.y + 10, STATION.r + 5, '#245c4430');
    this.circle(c, STATION.x, STATION.y + 5, STATION.r + 3, '#5a9e86');
    this.circle(c, STATION.x, STATION.y, STATION.r + 3, active ? '#b6e4c2' : '#cbe3ca', '#f5ffe5', 3);
    this.circle(c, STATION.x, STATION.y, STATION.r - 4, '#e2efd3', active ? '#439a73' : '#adc7a0', 1.5);
    if (active) { c.globalAlpha = glow; this.circle(c, STATION.x, STATION.y, 53, '#e9f9c012', '#fff7b7', 3); c.globalAlpha = 1; }
    if (this.product.complete && this.product.naturalWidth) c.drawImage(this.product, STATION.x - 14, STATION.y - 32, 28, 55);
    else { this.circle(c, STATION.x, STATION.y, 16, '#69b8c5'); this.text(c, '泉', STATION.x, STATION.y + 6, 17, '#fff'); }
    this.text(c, '源 头 灌 装 站', STATION.x, STATION.y + 63, 11, '#3a7056');
    this.gate(c, game, time);
    // Mechanical, three-dimensional flippers.
    for (const side of ['left', 'right'] as const) {
      const s = flipper(side, side === 'left' ? game.leftAmount : game.rightAmount);
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(s.a.x + 2, s.a.y + 8); c.lineTo(s.b.x + 2, s.b.y + 8); c.strokeStyle = '#335c3c45'; c.lineWidth = 26; c.stroke();
      c.beginPath(); c.moveTo(s.a.x, s.a.y + 4); c.lineTo(s.b.x, s.b.y + 4); c.strokeStyle = '#ad873c'; c.lineWidth = 23; c.stroke();
      c.beginPath(); c.moveTo(s.a.x, s.a.y); c.lineTo(s.b.x, s.b.y); c.strokeStyle = game[side] ? '#ffed9c' : '#e8c56a'; c.lineWidth = 21; c.stroke();
      c.beginPath(); c.moveTo(s.a.x, s.a.y - 5); c.lineTo(s.b.x, s.b.y - 5); c.strokeStyle = '#fff6c2'; c.lineWidth = 3; c.stroke();
      this.circle(c, s.a.x, s.a.y, 5, '#9b8245', '#ffedb2');
    }
    this.text(c, '接 住 每 一 滴 清 甜', 269, 620, 10, '#527b5c');
    if (game.status !== 'won' && game.status !== 'lost') {
      if (!this.reducedMotion && game.ball.launched && game.status === 'playing') {
        this.trail.push({ x: game.ball.x, y: game.ball.y }); if (this.trail.length > 14) this.trail.shift();
        this.trail.forEach((p, i) => { c.globalAlpha = i / this.trail.length * 0.28; this.circle(c, p.x, p.y, 3 + i / 4, '#f4fffa'); }); c.globalAlpha = 1;
      }
      const idle = game.status === 'ready' && !this.reducedMotion ? Math.sin(time * 2) * 3 : 0;
      this.drop(c, game.ball.x, game.ball.y + idle, game.ball.r);
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const p of this.particles) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 100 * dt;
      c.globalAlpha = Math.max(0, p.life / p.max); this.circle(c, p.x, p.y, p.r, p.color); c.globalAlpha = 1;
    }
  }
  private gate(c: CanvasRenderingContext2D, game: Game, time: number): void {
    const active = game.stage === 'delivery';
    for (const route of ROUTES) {
      const gate = GATES[route];
      c.beginPath(); c.moveTo(STATION.x, STATION.y + 78); c.quadraticCurveTo(STATION.x, gate.y - 48, gate.x, gate.y - 23);
      c.strokeStyle = active && game.route === route ? '#f3f9bc' : '#9eb89770'; c.lineWidth = active && game.route === route ? 5 : 3; c.stroke();
      if (game.route !== route) {
        this.circle(c, gate.x, gate.y, 14, '#c5d6b780', '#edf3dd', 1.5);
        this.text(c, route === 'tea' ? '茶' : route === 'desk' ? '家' : '动', gate.x, gate.y + 4, 10, '#6d8c64');
      }
    }
    const gate = game.gate;
    c.save(); c.translate(gate.x, gate.y);
    this.circle(c, 2, 6, 28, '#245c4420');
    this.circle(c, 0, 0, 27, active ? '#80c5a2' : '#c3d2b2', '#eff8db', 3);
    if (active) { c.save(); if (!this.reducedMotion) c.rotate(time * 0.6); c.setLineDash([5, 7]); this.circle(c, 0, 0, 34, '#ffffff00', '#eefaaf', 3); c.restore(); }
    c.strokeStyle = active ? '#faffdf' : '#819e77'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-12, -8); c.lineTo(-9, 12); c.quadraticCurveTo(0, 18, 9, 12); c.lineTo(12, -8); c.stroke();
    c.beginPath(); c.ellipse(0, -8, 12, 4, 0, 0, Math.PI * 2); c.stroke();
    this.text(c, active ? '送往 · ' + ROUTE_INFO[game.route].short : '配 送 入 口', 0, 46, 9, '#4e795e');
    c.restore();
  }
  private drop(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    c.save(); c.translate(x, y);
    c.beginPath(); c.ellipse(2, r + 5, r + 1, 4, 0, 0, Math.PI * 2); c.fillStyle = '#285c4530'; c.fill();
    const g = c.createRadialGradient(-4, -4, 1, 0, 0, r * 1.5); g.addColorStop(0, '#e0fffa'); g.addColorStop(0.45, '#82e0d1'); g.addColorStop(1, '#2a9c9a');
    c.beginPath(); c.moveTo(0, -r * 1.6); c.bezierCurveTo(-r * 0.3, -r * 0.6, -r, -r * 0.4, -r, r * 0.2);
    c.bezierCurveTo(-r, r * 1.4, r, r * 1.4, r, r * 0.2); c.bezierCurveTo(r, -r * 0.4, r * 0.3, -r * 0.6, 0, -r * 1.6);
    c.fillStyle = g; c.fill(); c.strokeStyle = '#f3ffef'; c.lineWidth = 1.5; c.stroke();
    this.circle(c, -3.5, 0, 1.5, '#215c54'); this.circle(c, 3.5, 0, 1.5, '#215c54');
    c.beginPath(); c.arc(0, 2, 3, 0.2, Math.PI - 0.2); c.strokeStyle = '#2c746a'; c.lineWidth = 1; c.stroke();
    c.restore();
  }
}

export function sceneSVG(route: Route): string {
  const base = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100" fill="none" aria-hidden="true">';
  if (route === 'tea') return base + '<path fill="#e5edd9" d="M0 0h150v100H0z"/><circle cx="119" cy="22" r="12" fill="#f2d887"/><path d="M0 64 36 22l35 38 28-27 51 40v27H0" fill="#a1b98b"/><path d="m0 88 43-36 40 22 35-22 32 33v15H0" fill="#739e79"/><path d="M0 92q65-38 150-3v11H0" fill="#4b8267"/><ellipse cx="85" cy="85" rx="37" ry="7" fill="#2b614749"/><path d="m62 58 5 24q15 13 31 0l6-24" fill="#faf5db" stroke="#567a5e" stroke-width="1.5"/><ellipse cx="83" cy="58" rx="21" ry="6" fill="#e5e6c4" stroke="#567a5e" stroke-width="1.5"/><ellipse cx="83" cy="59" rx="15" ry="3" fill="#a9b765"/><path d="M105 61q21-5 13 11-3 5-16 3M79 45q-7-6 0-12m9 12q-7-6 0-12" stroke="#f8f9e6" stroke-width="2" stroke-linecap="round"/></svg>';
  if (route === 'desk') return base + '<path fill="#f0e7ce" d="M0 0h150v100H0z"/><path fill="#cbd2b7" d="M14 13h42v47H14z"/><path d="M35 13v47M14 37h42" stroke="#f7f1df" stroke-width="3"/><path fill="#d0af72" d="M0 75h150v25H0z"/><path d="m64 39 49-6 6 35-49 6z" fill="#5e7c70"/><path d="m68 43 41-5 4 26-40 5z" fill="#b6d1b8"/><path d="m70 74 49-6 15 7-51 6z" fill="#e5dfca"/><path d="m30 56 3 25q9 6 18-1l3-24" fill="#e0f1e780" stroke="#73988a" stroke-width="1.5"/><ellipse cx="42" cy="57" rx="12" ry="4" fill="#b2d6c6"/><path d="m34 70 1 9q7 4 14 0l1-9" fill="#79b4a3"/><path d="m127 60 2 15h12l2-15" fill="#b1946c"/><path d="M135 62V38m0 11q-16 0-13-12 14-1 13 12m0 8q14-1 12-14-11-1-12 14" fill="#6d9671" stroke="#6d9671" stroke-width="2"/></svg>';
  return base + '<path fill="#dce8df" d="M0 0h150v100H0z"/><path fill="#88b4a5" d="M0 45h150v55H0z"/><path d="m0 61 150 0M37 45v55m76-55v55M0 82h150" stroke="#e7efd7" stroke-width="1.5"/><circle cx="75" cy="72" r="17" stroke="#e7efd7" stroke-width="1.5"/><path d="M119 9v40m-18-37h36v23h-36z" stroke="#728c79" stroke-width="3"/><path d="M112 29h18m-16 2 3 13h8l3-13" stroke="#bb9664" stroke-width="2"/><path d="M30 51q0-4 4-4h13q4 0 4 4v34q0 6-10 6t-11-6z" fill="#edf6dd" stroke="#588c7c" stroke-width="1.5"/><path fill="#4d927f" d="M33 40h16v10H33zM31 60h20v18H31z"/><path d="m35 68 3 4 7-7" stroke="#e7f2d1" stroke-width="2"/><circle cx="85" cy="84" r="12" fill="#dbad65"/><path d="M73 84h24m-12-12v24m-8-21q14 9 16 17" stroke="#ac804b" stroke-width="1"/></svg>';
}
