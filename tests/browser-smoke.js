// Run in agent-browser eval --stdin. Only uses public UI and keyboard events.
(async () => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const results = [];
  const assert = (name, condition, detail = '') => { results.push({ name, pass: !!condition, detail }); window.__springQaProgress = results; if (!condition) throw new Error(name + ': ' + detail); };
  const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
  const read = () => window.__spring;
  assert('no horizontal overflow', document.documentElement.scrollWidth <= innerWidth);
  for (const route of ['tea', 'desk', 'sport']) {
    const start = read().status === 'ready' ? document.querySelector('#start') : document.querySelector('#restart');
    start.click();
    document.querySelector(`[data-route="${route}"]`).click();
    await wait(100);
    key('keydown', 'ArrowLeft'); key('keydown', 'ArrowRight');
    const began = performance.now();
    const stages = new Set([read().stage]);
    while (read().status === 'playing' && performance.now() - began < 45000) {
      stages.add(read().stage);
      if (!read().ball.launched) document.querySelector('#launch').click();
      await wait(60);
    }
    key('keyup', 'ArrowLeft'); key('keyup', 'ArrowRight');
    const state = read();
    assert('route ' + route + ' wins through UI', state.status === 'won' && state.route === route, JSON.stringify({ status: state.status, time: state.elapsed, score: state.score, stages: [...stages] }));
    await wait(180);
    assert(route + ' recorded', read().record.routes.includes(route));
  }
  assert('three cup collection complete', document.querySelector('#collection-count').textContent === '3 / 3');
  document.querySelector('#play-again').click(); await wait(250);
  document.querySelector('#pause').click(); await wait(120);
  const elapsed = read().elapsed; await wait(500);
  assert('pause freezes simulation', read().status === 'paused' && read().elapsed === elapsed);
  document.querySelector('#resume').click(); await wait(200);
  assert('resume advances simulation', read().status === 'playing' && read().elapsed > elapsed);
  document.querySelector('#rules').click(); await wait(120);
  assert('rules pause the game', document.querySelector('#rules-dialog').open && read().status === 'paused');
  document.querySelector('#rules-done').click(); await wait(120);
  assert('closing rules resumes previous play', read().status === 'playing');
  const beforeMute = read().muted; document.querySelector('#sound').click();
  assert('mute toggles', read().muted !== beforeMute);
  document.querySelector('#sound').click(); document.querySelector('#pause').click();
  return results;
})()
