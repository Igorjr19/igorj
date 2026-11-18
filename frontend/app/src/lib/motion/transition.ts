import { flushSync } from 'svelte';

interface ViewTransitionLike {
  readonly types: Set<string>;
  readonly finished: Promise<void>;
}

type StartViewTransition = (update: () => void | Promise<void>) => ViewTransitionLike;

/** About a hundred characters of the page font: below it the window is a single column, as on a phone. */
const NARROW = '(max-width: 52rem)';

/** Whether the window is a single column, as on a phone. */
export function isNarrow(): boolean {
  return window.matchMedia(NARROW).matches;
}

function starter(): StartViewTransition | null {
  const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;
  return start ? start.bind(document) : null;
}

/** Runs a change of the page inside a view transition of the given kind, or plainly where the browser has none. */
export function transition(update: () => void, type: 'view' | 'forward' | 'backward'): void {
  const start = starter();
  if (!start) {
    update();
    return;
  }
  start(() => {
    update();
    flushSync();
  }).types.add(type);
}

/** For a navigation: the old page stays until the new one is ready, then the two cross. */
export function navigationTransition(
  way: 'forward' | 'backward' | null,
  complete: Promise<void>,
): Promise<void> | void {
  const start = starter();
  // A phone takes the next page at once: the old page waiting and two snapshots crossing cost more there than they say.
  if (!start || isNarrow()) {
    return;
  }
  return new Promise((resolve) => {
    const running = start(async () => {
      resolve();
      await complete;
    });
    if (way) {
      running.types.add(way);
    }
  });
}
