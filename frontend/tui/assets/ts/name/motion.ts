/// <reference lib="dom" />
import { type Grid, type Lens, lensed, nameLines, render, scrambled, sweepLens } from './ascii.ts';
import { measure } from './measure.ts';

// Loaded once the home is drawn. Now and then a lens crosses the name on its own; under a mouse or a pen the
// letters swell and stir where the pointer is, and a light follows it over the photo.

/** A pointer that moved this recently still scrambles the characters near it. */
const MOVING_MS = 120;
/** How long a lens takes to cross the name, and how long the name rests between crossings. */
const SWEEP_MS = 1600;
const REST_MS = 7000;

const reduced = (): boolean => document.documentElement.dataset['motion'] === 'reduced';

interface NameState {
  grid: Grid;
  /** Where a mouse or a pen is over the name, if one is. */
  pointer: Lens | null;
  moved: number;
  /** When the running crossing started, or 0 when none runs. */
  swept: number;
}

/** The lens in use: the pointer's, or the crossing's while one runs; none when the name rests. */
function currentLens(state: NameState, now: number): Lens | null {
  if (state.pointer) {
    return state.pointer;
  }
  const progress = state.swept ? (now - state.swept) / SWEEP_MS : 1;
  if (progress >= 1) {
    state.swept = 0;
    return null;
  }
  return sweepLens(state.grid, progress);
}

function isStirring(state: NameState, now: number): boolean {
  return state.swept !== 0 || (state.pointer !== null && now - state.moved < MOVING_MS);
}

/** Starts a crossing every so often, unless the tab is hidden, the name is out of view or motion is reduced. */
function scheduleSweeps(pre: HTMLElement, state: NameState, repaint: () => void): void {
  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
  }).observe(pre);
  setInterval(() => {
    if (visible && !(state.pointer || state.swept || reduced() || document.hidden)) {
      state.swept = performance.now();
      repaint();
    }
  }, SWEEP_MS + REST_MS);
}

/** A finger only scrolls; a mouse or a pen moves the lens. */
function followPointer(pre: HTMLElement, state: NameState, repaint: () => void): void {
  const area = pre.parentElement ?? pre;
  area.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || reduced()) {
      return;
    }
    const box = pre.getBoundingClientRect();
    const rowHeight = box.height / Math.max(1, state.grid.rows);
    state.pointer = {
      col: (event.clientX - box.left) / (rowHeight / state.grid.aspect),
      row: (event.clientY - box.top) / rowHeight,
    };
    state.moved = performance.now();
    state.swept = 0;
    repaint();
  });
  area.addEventListener('pointerleave', () => {
    state.pointer = null;
    repaint();
  });
}

function animateName(pre: HTMLElement, name: string): void {
  const lines = nameLines(name);
  const state: NameState = { grid: measure(pre, lines), pointer: null, moved: 0, swept: 0 };
  let frame = 0;
  const paint = (): void => {
    frame = 0;
    const now = performance.now();
    const lens = currentLens(state, now);
    const { grid } = state;
    const text = render(lens ? lensed(grid, lens) : grid.cells, grid.cols, grid.rows);
    const stirring = lens !== null && isStirring(state, now);
    pre.textContent = lens && stirring ? scrambled(text, grid, lens, Math.random) : text;
    if (stirring) {
      frame = requestAnimationFrame(paint);
    }
  };
  const repaint = (): void => {
    if (frame === 0) {
      frame = requestAnimationFrame(paint);
    }
  };
  scheduleSweeps(pre, state, repaint);
  followPointer(pre, state, repaint);
  new ResizeObserver(() => {
    state.grid = measure(pre, lines);
  }).observe(pre);
}

/** The light on the photo sits where the pointer is, as a share of the picture, and fades out when it leaves. */
function lightPhoto(photo: HTMLElement): void {
  photo.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || reduced()) {
      return;
    }
    const box = photo.getBoundingClientRect();
    photo.style.setProperty('--light-x', `${((event.clientX - box.left) / box.width) * 100}%`);
    photo.style.setProperty('--light-y', `${((event.clientY - box.top) / box.height) * 100}%`);
    photo.classList.add('is-lit');
  });
  photo.addEventListener('pointerleave', () => photo.classList.remove('is-lit'));
}

const pre = document.querySelector<HTMLElement>('.hero__ascii');
const heading = document.querySelector<HTMLElement>('[data-ascii-name]');
if (pre && heading) {
  animateName(pre, heading.textContent ?? '');
}
const photo = document.querySelector<HTMLElement>('.hero__photo');
if (photo) {
  lightPhoto(photo);
}
