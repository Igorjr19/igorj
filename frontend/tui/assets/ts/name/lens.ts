/// <reference lib="dom" />
import { type Grid, type Lens, lensed, nameLines, render, scrambled } from './ascii.ts';
import { measure } from './measure.ts';

// Loaded the first time a mouse comes over the name: under it the letters swell and stir.

/** A pointer that moved this recently still scrambles the characters near it. */
const MOVING_MS = 120;

const reduced = (): boolean =>
  document.documentElement.dataset['motion'] === 'reduced' || matchMedia('(prefers-reduced-motion: reduce)').matches;

function follow(pre: HTMLElement, name: string): void {
  const lines = nameLines(name);
  let grid: Grid = measure(pre, lines);
  let lens: Lens | null = null;
  let moved = 0;
  let frame = 0;
  const paint = (): void => {
    frame = 0;
    const moving = lens !== null && performance.now() - moved < MOVING_MS;
    const text = render(lens ? lensed(grid, lens) : grid.cells, grid.cols, grid.rows);
    pre.textContent = lens && moving ? scrambled(text, grid, lens, Math.random) : text;
    if (moving) {
      frame = requestAnimationFrame(paint);
    }
  };
  const repaint = (): void => {
    if (frame === 0) {
      frame = requestAnimationFrame(paint);
    }
  };
  // A finger only scrolls; a mouse or a pen moves the lens.
  const area = pre.parentElement ?? pre;
  area.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || reduced()) {
      return;
    }
    const box = pre.getBoundingClientRect();
    const rowHeight = box.height / Math.max(1, grid.rows);
    lens = { col: (event.clientX - box.left) / (rowHeight / grid.aspect), row: (event.clientY - box.top) / rowHeight };
    moved = performance.now();
    repaint();
  });
  area.addEventListener('pointerleave', () => {
    lens = null;
    repaint();
  });
  new ResizeObserver(() => {
    grid = measure(pre, lines);
  }).observe(pre);
}

const pre = document.querySelector<HTMLElement>('.hero__ascii');
const heading = document.querySelector<HTMLElement>('[data-ascii-name]');
if (pre && heading) {
  follow(pre, heading.textContent ?? '');
}
