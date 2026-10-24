// Execute in a browser on a completed round. No model mutation or new game.
(async () => {
  const wait = () => new Promise(resolve => setTimeout(resolve, 130));
  const initial = window.__spring;
  if (initial.status !== 'won') throw new Error('Finish a round before checking cup selection.');
  const results = [];
  for (const route of ['desk', 'sport', 'tea']) {
    document.querySelector(`[data-route="${route}"]`).click(); await wait();
    const state = window.__spring;
    const passed = state.status === 'won' && state.route === route && state.score === initial.score && state.elapsed === initial.elapsed && state.record.deliveries === initial.record.deliveries;
    results.push({ route, passed, score: state.score, elapsed: state.elapsed, deliveries: state.record.deliveries, title: document.querySelector('#overlay-content h2').textContent });
    if (!passed) throw new Error('Cup selection changed or postponed this round: ' + JSON.stringify(results));
  }
  if (/THE JOURNEY|每一滴，都有来处|选一条小路，把山泉送进杯子|下一杯送往/.test(document.body.textContent)) throw new Error('Removed copy is still visible.');
  return results;
})()
