import './style.css';
import { Game, ROUTES, ROUTE_INFO } from './game/model';
import type { Route } from './game/model';
import { Renderer, sceneSVG } from './game/renderer';
import { WaterAudio } from './game/audio';
import { finishRecord, readRecord, writeRecord } from './game/storage';

const icons: Record<string, string> = {
  leaf: '<path d="M20 4C9 2 3 8 5 15s14 8 15-11Z"/><path d="M4 21 16 9M9 16v-5m4 1h4"/>',
  sound: '<path d="m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 5-6 4H2v6h3l6 4V5Zm5 4 5 6m0-6-5 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .5-1.5 1-1.5 2m0 3h.01"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  left: '<path d="m14 5-7 7 7 7"/>',
  right: '<path d="m10 5 7 7-7 7"/>',
  pause: '<path d="M8 5v14m8-14v14"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  reset: '<path d="M3 10a9 9 0 1 1 1 8M3 4v6h6"/>',
  fork: '<path d="M12 21V11m0 0 7-7m-7 7L5 4m10 0h4v4M5 8V4h4"/>',
  drop: '<path d="M12 2C10 7 4 11 4 16a8 8 0 0 0 16 0c0-5-6-9-8-14Z"/><path d="M8 16a4 4 0 0 0 4 4"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  trophy: '<path d="M7 3h10v7a5 5 0 0 1-10 0V3Zm0 2H3v4a4 4 0 0 0 4 4m10-8h4v4a4 4 0 0 1-4 4m-5 2v5m-5 1h10"/>',
};
const icon = (name: string, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

document.querySelector('#app')!.innerHTML = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="洞庭山泉 山泉弹珠台首页"><span class="brand-emblem">${icon('leaf')}</span><span class="brand-name">洞庭山泉<small>好 水 养 人</small></span></a>
    <div class="header-center"><span class="tiny-spark"></span> 山 泉 游 乐 场 <span class="header-divider"></span><span class="header-en">THE SPRING ARCADE</span></div>
    <nav class="header-actions" aria-label="游戏设置"><button class="subtle-button" id="sound" aria-label="关闭声音" aria-pressed="false">${icon('sound')}<span>声音开启</span></button><button class="subtle-button" id="rules">${icon('help')}<span>怎么玩</span></button></nav>
  </header>
  <main class="experience">
    <section class="intro" aria-labelledby="main-title">
      <div class="eyebrow"><span class="small-line"></span> 一滴山泉的奇妙旅行</div>
      <h1 id="main-title">把一滴山泉，<br>送进<span class="title-green">生活里。</span></h1>
      <p class="intro-copy">从地下深处，到你手中的杯子。<br>让一座江南山城，为清甜开路。</p>
      <div class="journey" aria-label="送水旅程">
        <div class="journey-step current" data-stage="source"><span class="step-marker">${icon('drop')}</span><div><span class="step-overline">THE SOURCE</span><h2>地下 <strong>180</strong> 米</h2><p>撞响岩层，唤醒一滴天然山泉</p></div><span class="step-complete">${icon('check')}</span></div>
        <div class="journey-step" data-stage="bottling"><span class="step-marker">${icon('leaf')}</span><div><span class="step-overline">THE PROMISE</span><h2>源头的第一份清甜</h2><p>击中灌装站，把新鲜好好封存</p></div><span class="step-complete">${icon('check')}</span></div>
      </div>
    </section>

    <section class="game-column" id="game-column" aria-label="山泉弹珠台游戏">
      <div class="game-topline"><span><i></i> 山泉弹珠台</span><span class="edition">VOL. 01 / JIANGNAN</span></div>
      <div class="game-shell">
        <div class="hud"><div class="hud-score"><span class="hud-label">本局清甜值</span><strong id="score">000000</strong></div><div class="hud-timer"><svg viewBox="0 0 44 44" aria-hidden="true"><circle class="timer-track" cx="22" cy="22" r="19"/><circle id="timer-ring" cx="22" cy="22" r="19"/></svg><div><strong id="timer">72</strong><span>秒</span></div></div><div class="hud-actions"><button id="pause" class="icon-button" aria-label="暂停游戏" disabled>${icon('pause')}</button><button id="restart" class="icon-button" aria-label="重新开始" disabled>${icon('reset')}</button></div></div>
        <div class="board-wrap" id="board-wrap"><canvas id="board" width="540" height="820" role="img" aria-label="江南山城弹珠台：岩层机关、中央源头灌装站、下方配送入口和左右挡板。请使用下方按钮或键盘操作。"></canvas>
          <div class="board-label" id="board-label"><span class="status-dot"></span><span id="stage-label">地下 180 米 · 等待一滴山泉出发</span></div>
          <div class="start-panel" id="start-panel"><div class="start-stamp">一局 72 秒 · 一杯好山泉</div><button id="start" class="primary-button">开始送水 ${icon('arrow')}</button><p>按 <kbd>空格</kbd> 出发，也可以点击开始</p></div>
          <div id="overlay" class="board-overlay" hidden><div class="overlay-content" id="overlay-content"></div></div>
          <div class="game-toast" id="game-toast" role="status" aria-live="polite"></div>
        </div>
        <div class="under-board"><div class="lives" aria-label="剩余救援"><span>水滴救援</span><span id="lives"></span></div><span id="depth-progress">0 / 180 m</span></div>
        <div class="controls"><button class="flipper-button" id="left" aria-label="左挡板，方向左或A键">${icon('left')}<span>左挡板</span><kbd>←</kbd></button><button id="launch" class="launch-button" aria-label="发射水滴，空格键" disabled>${icon('arrow')}<span>发射</span></button><button class="flipper-button" id="right" aria-label="右挡板，方向右或D键"><kbd>→</kbd><span>右挡板</span>${icon('right')}</button></div>
      </div>
      <div class="game-footnote"><span><kbd>←</kbd><kbd>→</kbd> 接住水滴</span><span><kbd>↓</kbd> 切换岔路</span><span><kbd>P</kbd> 暂停</span></div>
    </section>

    <aside class="destinations" aria-label="配送目的地与纪录"><div class="destination-heading"><span class="eyebrow">下一站，好好生活</span><h2>这次，送到哪里？</h2><p>选一只杯子，收集一种日常。</p></div>
      <div class="scene-list" role="group" aria-label="选择配送目的地">${ROUTES.map((route, i) => `<button class="scene-card ${i === 0 ? 'selected' : ''}" data-route="${route}" aria-pressed="${i === 0}"><span class="scene-art">${sceneSVG(route)}</span><span class="scene-details"><small>${ROUTE_INFO[route].label}</small><strong>${ROUTE_INFO[route].short}</strong></span><span class="scene-radio">${icon('check')}</span><span class="collected" data-collected="${route}" hidden>已送达</span></button>`).join('')}</div>
      <button class="route-switch" id="switch-route">${icon('fork')}<span>切换配送岔路</span><kbd>↓</kbd></button>
      <div class="personal-record"><div class="record-heading">${icon('trophy')}<h3>我的送水手记</h3><span>本机</span></div><div class="record-numbers"><div><strong id="best-score">—</strong><small>最高清甜值</small></div><div><strong id="deliveries">00</strong><small>已送达杯数</small></div></div><div class="collection-progress"><div><span>生活里的清甜</span><span id="collection-count">0 / 3</span></div><div class="collection-track"><span id="collection-bar"></span></div></div></div>
      <p class="side-note">弹起来的是水滴，<br>抵达的是每一种好日常。</p>
    </aside>
  </main>
  <footer class="site-footer"><span>洞庭山泉 <span class="footer-divider">/</span> 好水养人，清甜入常。</span><span>180 米的起点，最快 3 天的旅程 <span class="footer-dot">·</span> 一场 72 秒的游戏</span><span class="concept-label">品牌互动概念作品</span></footer>
  <dialog id="rules-dialog"><button id="close-rules" class="icon-button dialog-close" aria-label="关闭玩法说明">${icon('close')}</button><span class="eyebrow">一滴水的出发指南</span><h2>72 秒，把清甜送达。</h2><ol><li><strong>出发</strong><p>点击开始送水，或按空格发射。水滴从地下泉源弹进山城。</p></li><li><strong>撞响岩层</strong><p>碰撞四枚金色岩层机关，每次上升 60 米。累计 180 米后，源头灌装站亮起。</p></li><li><strong>源头灌装</strong><p>击中球台中央的桶装水灌装站，下方配送入口随即打开。</p></li><li><strong>送进杯子</strong><p>选择茶山、加班桌或球场，让水滴进入发光的配送入口，听见属于你的水声旋律。</p></li></ol><div class="rules-keys"><span><kbd>←</kbd> / <kbd>A</kbd> 左挡板</span><span><kbd>→</kbd> / <kbd>D</kbd> 右挡板</span><span><kbd>↓</kbd> / <kbd>S</kbd> 换路线</span><span><kbd>P</kbd> / <kbd>Esc</kbd> 暂停</span></div><p class="rules-bottom">手机可同时按住两侧挡板。掉落后有 3 次救援，按发射继续；切到后台会自动暂停。游戏内时间为创意压缩，具体配送以实际服务为准。</p><button id="rules-done" class="primary-button">知道了，出发 ${icon('arrow')}</button></dialog>
`;

const game = new Game();
const renderer = new Renderer($<HTMLCanvasElement>('board'));
const audio = new WaterAudio();
let record = readRecord();
audio.setMuted(record.muted);
let wasStatus = game.status, wasStage = game.stage, lastFrame = performance.now(), toastUntil = 0, overlayState = '', recordSaved = false;
let rulesPaused = false;
let roundBaseline = { ...record, routes: [...record.routes] };

function toast(message: string): void { $('game-toast').textContent = message; $('game-toast').classList.add('visible'); toastUntil = performance.now() + 2700; }
function updateRecord(): void {
  $('best-score').textContent = record.best ? record.best.toLocaleString() : '—';
  $('deliveries').textContent = String(record.deliveries).padStart(2, '0');
  $('collection-count').textContent = `${record.routes.length} / 3`;
  $('collection-bar').style.width = `${record.routes.length / 3 * 100}%`;
  document.querySelectorAll<HTMLElement>('[data-collected]').forEach(el => { el.hidden = !record.routes.includes(el.dataset.collected as Route); });
}
function updateSound(): void {
  $('sound').innerHTML = icon(audio.muted ? 'mute' : 'sound') + `<span>声音${audio.muted ? '关闭' : '开启'}</span>`;
  $('sound').setAttribute('aria-label', audio.muted ? '开启声音' : '关闭声音');
  $('sound').setAttribute('aria-pressed', String(audio.muted));
}
function selectRoute(route: Route): void {
  const changed = game.route !== route;
  game.route = route;
  document.querySelectorAll<HTMLElement>('[data-route]').forEach(el => { const selected = el.dataset.route === route; el.classList.toggle('selected', selected); el.setAttribute('aria-pressed', String(selected)); });
  if (game.status === 'won' && changed) {
    // Reassign this round's single delivery from its original baseline.
    // Selecting another cup must not mint an extra delivery or lose prior cups.
    record = finishRecord({ ...roundBaseline, muted: audio.muted }, game);
    recordSaved = true; updateRecord(); overlayState = ''; sync(false);
    audio.unlock(); audio.stop(); audio.melody(game.notes);
    toast(`本局已送达${ROUTE_INFO[route].short}`);
  }
}
function cycleRoute(): void { selectRoute(ROUTES[(ROUTES.indexOf(game.route) + 1) % 3]); }
function start(): void {
  roundBaseline = { ...record, routes: [...record.routes] };
  audio.unlock(); audio.stop(); renderer.reset(); game.start(); recordSaved = false; overlayState = ''; wasStage = 'source';
  $('start-panel').hidden = true; $('overlay').hidden = true;
  $('board-wrap').classList.add('started');
  if (window.innerWidth < 900) $('game-column')?.scrollIntoView?.({ block: 'start', behavior: renderer.reducedMotion ? 'instant' : 'smooth' });
}

function sync(moveFocus = true): void {
  const playing = game.status === 'playing', paused = game.status === 'paused', finished = game.status === 'won' || game.status === 'lost';
  $('score').textContent = String(game.score).padStart(6, '0');
  $('timer').textContent = String(Math.ceil(game.remaining)).padStart(2, '0');
  $('timer-ring').style.strokeDashoffset = `${119.38 * (1 - game.remaining / 72)}`;
  document.querySelector('.hud-timer')!.classList.toggle('urgent', game.remaining <= 12);
  $('depth-progress').textContent = game.stage === 'source' ? `${game.depth} / 180 m` : game.stage === 'bottling' ? '源头灌装中' : '配送入口已开启';
  $('left').classList.toggle('pressed', game.left); $('right').classList.toggle('pressed', game.right);
  const instructions = { source: '撞响岩层机关 · 唤醒地下 180 米的山泉', bottling: '击中中央灌装站 · 封存源头的清甜', delivery: `进入发光配送口 · 送往${ROUTE_INFO[game.route].short}` };
  $('stage-label').textContent = game.status === 'ready' ? '地下 180 米 · 等待一滴山泉出发' : instructions[game.stage];
  const livesHtml = Array.from({ length: 3 }, (_, i) => `<span class="life ${i < game.saves ? '' : 'used'}">${icon('drop')}</span>`).join('');
  if ($('lives').innerHTML !== livesHtml) $('lives').innerHTML = livesHtml;
  $('lives').setAttribute('aria-label', `剩余 ${game.saves} 次救援`);
  $<HTMLButtonElement>('pause').disabled = !(playing || paused);
  $('pause').setAttribute('aria-label', paused ? '继续游戏' : '暂停游戏');
  $('pause').innerHTML = icon(paused ? 'play' : 'pause');
  $<HTMLButtonElement>('restart').disabled = game.status === 'ready';
  $<HTMLButtonElement>('launch').disabled = !playing || game.ball.launched;
  const stages = ['source', 'bottling', 'delivery'];
  document.querySelectorAll<HTMLElement>('[data-stage]').forEach(el => {
    const i = stages.indexOf(el.dataset.stage!), current = stages.indexOf(game.stage);
    el.classList.toggle('current', i === current); el.classList.toggle('complete', i < current || game.status === 'won');
  });
  if (finished && !recordSaved) { record = finishRecord({ ...roundBaseline, muted: audio.muted }, game); recordSaved = true; updateRecord(); }
  if (paused || finished) {
    if (overlayState !== game.status) {
      overlayState = game.status; $('overlay').hidden = false;
      if (paused) $('overlay-content').innerHTML = `<span class="eyebrow">山泉，稍作停留</span><h2>好风景，不赶路。</h2><p>准备好后，继续这滴水的旅行。</p><button id="resume" class="primary-button">继续送水 ${icon('play')}</button><button id="overlay-restart" class="text-button">重新开始</button>`;
      else if (game.status === 'won') $('overlay-content').innerHTML = `<span class="result-scene">${sceneSVG(game.route)}</span><span class="eyebrow">清甜，准时抵达</span><h2>${ROUTE_INFO[game.route].title}</h2><p>${ROUTE_INFO[game.route].subtitle}</p><div class="result-stats"><div><strong>${game.score.toLocaleString()}</strong><span>本局清甜值</span></div><div><strong>${game.elapsed.toFixed(1)}<small> 秒</small></strong><span>从泉源到杯子</span></div></div><div class="result-music">${icon('sound')} 这段水声，是你弹出的旋律</div><button id="play-again" class="primary-button">再送一杯 ${icon('arrow')}</button><button id="replay-music" class="text-button">再听一次水声</button>`;
      else $('overlay-content').innerHTML = `<span class="result-drop">${icon('drop')}</span><span class="eyebrow">每一滴，值得再试一次</span><h2>再接住一点清甜。</h2><p>${game.loseReason}</p><div class="result-stats"><div><strong>${game.score.toLocaleString()}</strong><span>本局清甜值</span></div><div><strong>${game.depth}<small> 米</small></strong><span>已完成出泉</span></div></div><button id="play-again" class="primary-button">再试一次 ${icon('reset')}</button>`;
      $('resume')?.addEventListener('click', () => { audio.unlock(); game.togglePause(); });
      $('play-again')?.addEventListener('click', start); $('overlay-restart')?.addEventListener('click', start);
      $('replay-music')?.addEventListener('click', () => { audio.unlock(); audio.stop(); audio.melody(game.notes); });
      if (moveFocus && !document.querySelector('dialog[open]')) ($('resume') ?? $('play-again'))?.focus({ preventScroll: true });
    }
  } else { $('overlay').hidden = true; overlayState = ''; }
}

$('start').addEventListener('click', start);
$('launch').addEventListener('click', () => { audio.unlock(); game.launch(); });
$('pause').addEventListener('click', () => { audio.unlock(); audio.stop(); game.togglePause(); });
$('restart').addEventListener('click', start);
$('sound').addEventListener('click', () => { audio.unlock(); audio.setMuted(!audio.muted); record.muted = audio.muted; writeRecord(record); updateSound(); });
$('switch-route').addEventListener('click', cycleRoute);
document.querySelectorAll<HTMLElement>('[data-route]').forEach(el => el.addEventListener('click', () => selectRoute(el.dataset.route as Route)));

for (const side of ['left', 'right'] as const) {
  const button = $(side);
  const release = () => { game[side] = false; button.classList.remove('pressed'); };
  button.addEventListener('pointerdown', e => { if (game.status !== 'playing') return; e.preventDefault(); audio.unlock(); button.setPointerCapture(e.pointerId); game[side] = true; button.classList.add('pressed'); });
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
  button.addEventListener('keydown', e => { if ((e.code === 'Space' || e.code === 'Enter') && game.status === 'playing') { e.preventDefault(); game[side] = true; button.classList.add('pressed'); } });
  button.addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); release(); } });
  button.addEventListener('blur', release);
}
const rulesDialog = $<HTMLDialogElement>('rules-dialog');
rulesDialog.querySelector('ol')!.insertAdjacentHTML('beforebegin', '<figure class="rules-photo"><img src="/brand/source-forest.webp" alt="用户提供的洞庭山泉源头山林航拍照片" width="960" height="540" loading="lazy"><figcaption>水的起点，就在这片山林。</figcaption></figure>');
$('rules').addEventListener('click', () => { rulesPaused = game.status === 'playing'; if (rulesPaused) { game.togglePause(); audio.stop(); } rulesDialog.showModal(); });
function closeRules(): void { rulesDialog.close(); if (rulesPaused && game.status === 'paused') game.togglePause(); rulesPaused = false; }
$('close-rules').addEventListener('click', closeRules); $('rules-done').addEventListener('click', closeRules);
rulesDialog.addEventListener('cancel', e => { e.preventDefault(); closeRules(); });
rulesDialog.addEventListener('click', e => { if (e.target === rulesDialog) { const r = rulesDialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeRules(); } });

const keys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'KeyA', 'KeyD', 'KeyS', 'Space', 'KeyP', 'Escape']);
document.addEventListener('keydown', e => {
  if (rulesDialog.open || !keys.has(e.code) || e.target instanceof HTMLInputElement) return;
  // Focused buttons retain their native Space/Enter activation and remain usable from the keyboard.
  if (e.code === 'Space' && e.target instanceof HTMLButtonElement) return;
  e.preventDefault(); audio.unlock();
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') game.left = game.status === 'playing';
  if (e.code === 'ArrowRight' || e.code === 'KeyD') game.right = game.status === 'playing';
  if (e.repeat) return;
  if (e.code === 'Space') { if (game.status === 'ready' || game.status === 'won' || game.status === 'lost') start(); else if (game.status === 'paused') game.togglePause(); else game.launch(); }
  if (e.code === 'KeyP' || e.code === 'Escape') { audio.stop(); game.togglePause(); }
  if (e.code === 'ArrowDown' || e.code === 'KeyS') cycleRoute();
});
document.addEventListener('keyup', e => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') game.left = false; if (e.code === 'ArrowRight' || e.code === 'KeyD') game.right = false; });
function autoPause(): void { if (game.status === 'playing') { game.togglePause(); audio.stop(); } game.left = false; game.right = false; }
window.addEventListener('blur', autoPause);
document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
window.addEventListener('resize', () => renderer.resize());
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => { renderer.reducedMotion = e.matches; });
let uiClock = 0;
function frame(now: number): void {
  const dt = Math.min((now - lastFrame) / 1000, 0.1); lastFrame = now;
  game.update(dt);
  for (const event of game.events.splice(0)) {
    renderer.event(event);
    if (event.type === 'hit') audio.note(event.note ?? 0);
    if (event.type === 'launch') audio.note(4);
    if (event.type === 'stage') { audio.note(2); audio.note(4, 0.13); toast(game.stage === 'bottling' ? '180 米出泉完成！击中中央灌装站' : '源头灌装完成！进入下方发光配送口'); }
    if (event.type === 'rescue') toast('水滴已救回发射道 · 点击发射或按空格继续');
    if (event.type === 'win') audio.melody(game.notes);
  }
  if (game.stage !== wasStage) wasStage = game.stage;
  renderer.render(game, game.status === 'paused' ? 0 : dt, now / 1000);
  uiClock += dt;
  if (uiClock > 0.08 || wasStatus !== game.status) { sync(); uiClock = 0; wasStatus = game.status; }
  if (now > toastUntil) $('game-toast').classList.remove('visible');
  requestAnimationFrame(frame);
}
updateRecord(); updateSound(); sync(); requestAnimationFrame(frame);

// Read-only diagnostics allow browser QA without exposing a way to complete a round.
Object.defineProperty(window, '__spring', { get: () => ({ status: game.status, stage: game.stage, route: game.route, score: game.score, elapsed: game.elapsed, depth: game.depth, saves: game.saves, ball: { ...game.ball }, left: game.left, right: game.right, muted: audio.muted, record: { ...record } }) });
