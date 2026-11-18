/** How far the page travels as it comes in, in pixels: a nudge from the side its pane lies on, not a slide across the screen. */
const NUDGE = 28;

/**
 * The entrance of the page after a change of pane on a phone, where the browser's own page transition is left out:
 * the page fades in from the side the pane lies on. It is drawn by the compositor alone, so it never waits for a layout.
 */
export function enterPane(way: 'forward' | 'backward' | null): void {
  const pane = document.querySelector<HTMLElement>('.pane');
  if (!(pane && 'animate' in pane)) {
    return;
  }
  const shift = way === 'forward' ? NUDGE : way === 'backward' ? -NUDGE : 0;
  pane.animate(
    [
      { opacity: 0, transform: `translateX(${shift}px)` },
      { opacity: 1, transform: 'none' },
    ],
    { duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  );
}
