export interface Vec { x: number; y: number }
export interface Ball extends Vec { vx: number; vy: number; r: number; launched: boolean }
export interface Segment { a: Vec; b: Vec }

export const WIDTH = 540;
export const HEIGHT = 820;
export const STEP = 1 / 120;

export function collideCircle(ball: Ball, center: Vec, radius: number, kick = 1.1): boolean {
  const dx = ball.x - center.x, dy = ball.y - center.y;
  const distance = Math.hypot(dx, dy), reach = radius + ball.r;
  if (distance >= reach) return false;
  const nx = distance > 0.001 ? dx / distance : 0;
  const ny = distance > 0.001 ? dy / distance : -1;
  ball.x = center.x + nx * (reach + 0.3);
  ball.y = center.y + ny * (reach + 0.3);
  const toward = ball.vx * nx + ball.vy * ny;
  if (toward < 0) {
    ball.vx -= (1 + kick) * toward * nx;
    ball.vy -= (1 + kick) * toward * ny;
  }
  return true;
}

export function collideSegment(ball: Ball, segment: Segment, radius = 5, restitution = 0.82): boolean {
  const dx = segment.b.x - segment.a.x, dy = segment.b.y - segment.a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq ? Math.max(0, Math.min(1, ((ball.x - segment.a.x) * dx + (ball.y - segment.a.y) * dy) / lengthSq)) : 0;
  return collideCircle(ball, { x: segment.a.x + dx * t, y: segment.a.y + dy * t }, radius, restitution);
}

export const RAILS: Segment[] = [
  { a: { x: 66, y: 170 }, b: { x: 66, y: 570 } },
  { a: { x: 66, y: 170 }, b: { x: 120, y: 110 } },
  { a: { x: 120, y: 110 }, b: { x: 407, y: 110 } },
  { a: { x: 407, y: 110 }, b: { x: 449, y: 157 } },
  { a: { x: 454, y: 185 }, b: { x: 454, y: 750 } },
  { a: { x: 66, y: 570 }, b: { x: 139, y: 648 } },
  { a: { x: 454, y: 570 }, b: { x: 392, y: 648 } },
  { a: { x: 104, y: 548 }, b: { x: 185, y: 606 } },
  { a: { x: 416, y: 548 }, b: { x: 345, y: 606 } },
  { a: { x: 94, y: 675 }, b: { x: 192, y: 750 } },
  { a: { x: 428, y: 675 }, b: { x: 332, y: 750 } },
];

export function flipper(side: 'left' | 'right', amount: number): Segment {
  return side === 'left'
    ? { a: { x: 151, y: 671 }, b: { x: 247, y: 701 - amount * 87 } }
    : { a: { x: 387, y: 671 }, b: { x: 291, y: 701 - amount * 87 } };
}

export function integrate(ball: Ball, dt: number): void {
  ball.vy += 470 * dt;
  const drag = Math.pow(0.999, dt * 120);
  ball.vx *= drag; ball.vy *= drag;
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > 1180) { ball.vx *= 1180 / speed; ball.vy *= 1180 / speed; }
  ball.x += ball.vx * dt; ball.y += ball.vy * dt;
}
