import { type Grid, type Lens, lensed, render, scrambled, sweepLens } from './ascii.ts';

// Now and then a lens crosses the name on its own; under a mouse or a pen the letters swell and stir where the
// pointer is. Nothing here asks whether motion is wanted: the movement is light and always on.

/** A pointer that moved this recently still scrambles the characters near it. */
const MOVING_MS = 120;
/** How long a lens takes to cross the name, and how long the name rests between crossings. */
const SWEEP_MS = 1600;
const REST_MS = 7000;

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

/** Starts a crossing every so often, unless the tab is hidden or the name is out of view. */
function scheduleSweeps(pre: HTMLElement, state: NameState, repaint: () => void): () => void {
  let visible = true;
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
  });
  observer.observe(pre);
  const timer = setInterval(() => {
    if (visible && !(state.pointer || state.swept || document.hidden)) {
      state.swept = performance.now();
      repaint();
    }
  }, SWEEP_MS + REST_MS);
  return () => {
    observer.disconnect();
    clearInterval(timer);
  };
}

/** A finger only scrolls; a mouse or a pen moves the lens. */
function followPointer(pre: HTMLElement, state: NameState, repaint: () => void): void {
  const area = pre.parentElement ?? pre;
  area.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') {
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

/** Animates the drawn name: `grid()` gives the current grid, `show` receives each frame's text. Returns how to stop. */
export function animateName(pre: HTMLElement, grid: () => Grid, show: (text: string) => void): () => void {
  const state: NameState = { grid: grid(), pointer: null, moved: 0, swept: 0 };
  let frame = 0;
  const paint = (): void => {
    frame = 0;
    state.grid = grid();
    const now = performance.now();
    const lens = currentLens(state, now);
    const current = state.grid;
    const text = render(lens ? lensed(current, lens) : current.cells, current.cols, current.rows);
    const stirring = lens !== null && isStirring(state, now);
    show(lens && stirring ? scrambled(text, current, lens, Math.random) : text);
    if (stirring) {
      frame = requestAnimationFrame(paint);
    }
  };
  const repaint = (): void => {
    if (frame === 0) {
      frame = requestAnimationFrame(paint);
    }
  };
  const stop = scheduleSweeps(pre, state, repaint);
  followPointer(pre, state, repaint);
  return () => {
    stop();
    cancelAnimationFrame(frame);
  };
}

/** The light on the photo sits where the pointer is, as a share of the picture, and fades out when it leaves. */
export function lightPhoto(photo: HTMLElement): () => void {
  const move = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      return;
    }
    const box = photo.getBoundingClientRect();
    photo.style.setProperty('--light-x', `${((event.clientX - box.left) / box.width) * 100}%`);
    photo.style.setProperty('--light-y', `${((event.clientY - box.top) / box.height) * 100}%`);
    photo.classList.add('is-lit');
  };
  const leave = (): void => photo.classList.remove('is-lit');
  photo.addEventListener('pointermove', move);
  photo.addEventListener('pointerleave', leave);
  return () => {
    photo.removeEventListener('pointermove', move);
    photo.removeEventListener('pointerleave', leave);
  };
}
