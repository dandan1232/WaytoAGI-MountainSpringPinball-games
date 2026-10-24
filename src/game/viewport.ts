import { HEIGHT, WIDTH } from './physics';

/** One scale for both axes: resizing a window must never flatten the table. */
export function fitViewport(width: number, height: number, pixelRatio = 1) {
  const cssWidth = Math.max(1, width), cssHeight = Math.max(1, height);
  const dpr = Math.min(2, Math.max(1, pixelRatio));
  const scale = Math.min(cssWidth / WIDTH, cssHeight / HEIGHT);
  return {
    pixelWidth: Math.round(cssWidth * dpr),
    pixelHeight: Math.round(cssHeight * dpr),
    scale: scale * dpr,
    offsetX: (cssWidth - WIDTH * scale) * dpr / 2,
    offsetY: (cssHeight - HEIGHT * scale) * dpr / 2,
  };
}
