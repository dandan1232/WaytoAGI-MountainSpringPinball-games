// Execute after resizing the actual browser: checks both CSS and Canvas transforms.
(() => {
  const canvas = document.getElementById('board');
  const rect = canvas.getBoundingClientRect();
  const transform = canvas.getContext('2d').getTransform();
  const controls = document.querySelector('.controls').getBoundingClientRect();
  const result = {
    viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
    board: [rect.width, rect.height], circleAspect: transform.a / transform.d,
    uniformScale: Math.abs(transform.a - transform.d) < 1e-8,
    naturalAspect: Math.abs(rect.width / rect.height - 540 / 820) < 0.001,
    noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth,
    controlsVisible: controls.top >= 0 && controls.bottom <= innerHeight,
    wholeBoardVisible: rect.top >= 0 && rect.bottom <= innerHeight,
  };
  if (!result.uniformScale || !result.naturalAspect || !result.noHorizontalOverflow) throw new Error(JSON.stringify(result));
  if (document.body.classList.contains('is-focused') && (!result.controlsVisible || !result.wholeBoardVisible)) throw new Error(JSON.stringify(result));
  return result;
})()
