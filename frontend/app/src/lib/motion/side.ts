import { flushSync } from 'svelte';

const SLIDE = { duration: 240, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' } as const;

/**
 * Runs a change that hides or shows the side column and makes it a slide. The page takes its final shape at once, and
 * the page and the column then travel from where they were: moving costs the browser no layout, where growing and
 * shrinking a track lays the whole page out again on every frame.
 */
export function slideSide(change: () => void): void {
  const side = document.querySelector<HTMLElement>('.side');
  const pane = document.querySelector<HTMLElement>('.pane');
  if (!(side && pane && 'animate' in pane)) {
    change();
    return;
  }
  const before = pane.getBoundingClientRect().left;
  change();
  flushSync();
  const shift = before - pane.getBoundingClientRect().left;
  if (shift === 0) {
    return;
  }
  pane.animate([{ transform: `translateX(${shift}px)` }, { transform: 'none' }], SLIDE);
  // A column that is going away is hidden at once by the page, so it is kept visible while it leaves.
  side.animate(
    shift > 0
      ? [
          { visibility: 'visible', opacity: 1, transform: 'none' },
          { visibility: 'visible', opacity: 0, transform: `translateX(${-shift}px)` },
        ]
      : [
          { opacity: 0, transform: `translateX(${shift}px)` },
          { opacity: 1, transform: 'none' },
        ],
    SLIDE,
  );
}
