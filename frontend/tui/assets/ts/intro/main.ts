/// <reference lib="dom" />
import { nameLines, RAMP, render } from '../name/ascii.ts';
import { measure } from '../name/measure.ts';
import { forming } from './stage.ts';

// The full opening, on the first visit: a cursor, the name forming in characters, the sentence typed under it,
// then the window drawing itself. The head script chose it; any key or click skips it.
const NAME_START = 300;
const NAME_TIME = 1100;
const TEXT_START = 1500;
const TEXT_TIME = 800;
const LEAVE_AT = 2500;
const END_AT = 2900;

const root = document.documentElement;
const source = document.querySelector<HTMLTemplateElement>('template[data-lazy="intro"]');

const share = (elapsed: number, start: number, time: number): number =>
  Math.min(1, Math.max(0, (elapsed - start) / time));

const noise = (): string => RAMP[4 + Math.floor(Math.random() * (RAMP.length - 4))] ?? '#';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
  return Object.assign(document.createElement(tag), { className });
}

async function play(name: string, text: string): Promise<void> {
  const overlay = element('div', 'intro');
  overlay.setAttribute('aria-hidden', 'true');
  const pre = element('pre', 'intro__name');
  const line = element('p', 'intro__text');
  const typed = element('span', '');
  line.append(typed, element('span', 'cursor'));
  overlay.append(pre, line);
  document.body.append(overlay);
  /** Any key or click ends the opening at once; while it covers the page, that key does nothing else. */
  const skip = (event: Event): void => {
    if (root.dataset['intro'] === 'full') {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    root.removeAttribute('data-intro');
    overlay.remove();
  };
  addEventListener('keydown', skip, { capture: true, once: true });
  addEventListener('pointerdown', skip, { capture: true, once: true });
  await document.fonts.ready;
  const grid = measure(pre, nameLines(name));
  const final = render(grid.cells, grid.cols, grid.rows);
  const begin = performance.now();
  const frame = (now: number): void => {
    const elapsed = now - begin;
    if (!(overlay.isConnected && root.dataset['intro'])) {
      overlay.remove();
      return;
    }
    pre.textContent = forming(final, share(elapsed, NAME_START, NAME_TIME), noise);
    typed.textContent = text.slice(0, Math.round(text.length * share(elapsed, TEXT_START, TEXT_TIME)));
    if (elapsed >= LEAVE_AT && root.dataset['intro'] === 'full') {
      overlay.classList.add('intro--leaving');
      root.dataset['intro'] = 'short';
    }
    if (elapsed >= END_AT) {
      overlay.remove();
      return;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

if (source && root.dataset['intro'] === 'full') {
  play(source.dataset['name'] ?? '', source.dataset['text'] ?? '').catch(() => {
    // Whatever failed, the page is there: the opening simply ends.
    root.removeAttribute('data-intro');
  });
}
