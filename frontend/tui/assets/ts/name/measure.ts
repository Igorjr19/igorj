/// <reference lib="dom" />
import { coverage, type Grid } from './ascii.ts';

/** Draws the name with the page's mono font into a canvas sized to the character grid of the element. */
export function measure(pre: HTMLElement, lines: readonly string[]): Grid {
  const probe = document.createElement('span');
  probe.textContent = 'M'.repeat(20);
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
  pre.append(probe);
  const box = probe.getBoundingClientRect();
  probe.remove();
  const charWidth = box.width / 20;
  const cols = Math.max(20, Math.floor(pre.clientWidth / charWidth));
  const cellWidth = 2;
  const cellHeight = Math.max(2, Math.round((cellWidth * box.height) / charWidth));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const font = getComputedStyle(pre).fontFamily;
  const width = cols * cellWidth;
  if (!context) {
    return { cols, rows: 0, cells: new Float32Array(), aspect: 2 };
  }
  context.font = `700 40px ${font}`;
  const widest = Math.max(...lines.map((line) => context.measureText(line).width));
  const size = (40 * width * 0.98) / widest;
  const lineHeight = Math.round(size * 1.05);
  const rows = Math.ceil((lineHeight * lines.length) / cellHeight);
  canvas.width = width;
  canvas.height = rows * cellHeight;
  context.font = `700 ${size}px ${font}`;
  context.fillStyle = '#000';
  for (const [index, line] of lines.entries()) {
    context.fillText(line, 0, lineHeight * index + size * 0.86);
  }
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const alpha = new Uint8ClampedArray(pixels.length / 4);
  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = pixels[i * 4 + 3] ?? 0;
  }
  const cells = coverage(alpha, canvas.width, cols, rows, cellWidth, cellHeight);
  return { cols, rows, cells, aspect: box.height / charWidth };
}
