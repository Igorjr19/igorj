import { flushSync } from 'svelte';

const SLIDE = { duration: 240, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' } as const;

/**
 * Notes where the page is now and returns the function that, once the side column has been hidden or shown, plays
 * the slide: the page and the column travel from where they were to where they are. Moving costs the browser no
 * layout, where growing and shrinking a track lays the whole page out again on every frame. With `fade`, the page
 * also comes in from transparent, for a change of page that goes with the change of column.
 */
export function sideSlide(options: { fade?: boolean } = {}): () => void {
  const side = document.querySelector<HTMLElement>('.side');
  const pane = document.querySelector<HTMLElement>('.pane');
  if (!(side && pane && 'animate' in pane)) {
    return () => undefined;
  }
  const before = pane.getBoundingClientRect().left;
  return () => {
    const shift = before - pane.getBoundingClientRect().left;
    if (shift === 0 && !options.fade) {
      return;
    }
    const opacity = options.fade ? { opacity: 0 } : {};
    pane.animate(
      [
        { transform: `translateX(${shift}px)`, ...opacity },
        { transform: 'none', opacity: 1 },
      ],
      SLIDE,
    );
    if (shift === 0) {
      return;
    }
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
  };
}

/** Runs a change that hides or shows the side column and makes it a slide. */
export function slideSide(change: () => void): void {
  const play = sideSlide();
  change();
  flushSync();
  play();
}
