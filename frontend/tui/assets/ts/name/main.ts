/// <reference lib="dom" />
import { nameLines, render } from './ascii.ts';
import { measure } from './measure.ts';

/** The movement of the name and the photo loads once the page is drawn, so it never holds the page back. */
function loadMotion(): void {
  const { script: src = '', integrity = '' } =
    document.querySelector<HTMLTemplateElement>('template[data-lazy="motion"]')?.dataset ?? {};
  if (src) {
    document.body.append(Object.assign(document.createElement('script'), { src, integrity }));
  }
}

/** Replaces the visible heading with the name drawn in characters; the heading stays for screen readers. */
function start(heading: HTMLElement): void {
  const pre = document.createElement('pre');
  pre.className = 'hero__ascii';
  pre.setAttribute('aria-hidden', 'true');
  heading.before(pre);
  heading.classList.add('sr-only');
  const lines = nameLines(heading.textContent ?? '');
  const draw = (): void => {
    const grid = measure(pre, lines);
    pre.textContent = render(grid.cells, grid.cols, grid.rows);
  };
  draw();
  new ResizeObserver(draw).observe(pre);
  (window.requestIdleCallback ?? setTimeout)(loadMotion);
}

const heading = document.querySelector<HTMLElement>('[data-ascii-name]');
if (heading) {
  document.fonts.ready.then(() => start(heading));
}
