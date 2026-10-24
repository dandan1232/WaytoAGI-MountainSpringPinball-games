import type { Game, Route } from './model';
export interface RecordData { best: number; fastest: number | null; deliveries: number; routes: Route[]; muted: boolean }
const KEY = 'mountain-spring-pinball:v1';
const defaults = (): RecordData => ({ best: 0, fastest: null, deliveries: 0, routes: [], muted: false });
export function readRecord(): RecordData {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!data || typeof data !== 'object') return defaults();
    return {
      best: Number.isFinite(data.best) && data.best >= 0 ? data.best : 0,
      fastest: Number.isFinite(data.fastest) && data.fastest > 0 && data.fastest <= 72 ? data.fastest : null,
      deliveries: Number.isInteger(data.deliveries) && data.deliveries >= 0 ? data.deliveries : 0,
      routes: Array.isArray(data.routes) ? [...new Set<Route>(data.routes.filter((x: string) => ['tea', 'desk', 'sport'].includes(x)))] : [],
      muted: data.muted === true,
    };
  } catch { return defaults(); }
}
export function writeRecord(data: RecordData): void { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* Game works without storage. */ } }
export function finishRecord(data: RecordData, game: Game): RecordData {
  const next = { ...data, best: Math.max(data.best, game.score), routes: [...data.routes] };
  if (game.status === 'won') {
    next.deliveries++;
    next.fastest = data.fastest === null ? game.elapsed : Math.min(data.fastest, game.elapsed);
    if (!next.routes.includes(game.route)) next.routes.push(game.route);
  }
  writeRecord(next); return next;
}
