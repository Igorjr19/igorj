/// <reference lib="dom" />
import { direction, MOTION_STORAGE_KEY, motionReduced } from './direction.ts';

// Runs inline in <head>: the motion choice applies before the first paint, and the page that arrives
// tells its transition which way the visitor went.
let saved: string | null = null;
try {
  saved = localStorage.getItem(MOTION_STORAGE_KEY);
} catch {
  // Storage blocked: the system preference decides.
}
if (saved === 'reduced') {
  document.documentElement.dataset['motion'] = 'reduced';
}

interface RevealEvent extends Event {
  readonly viewTransition: {
    readonly types: Set<string>;
    readonly ready: Promise<void>;
    skipTransition(): void;
  } | null;
}

addEventListener('pagereveal', (event) => {
  const transition = (event as RevealEvent).viewTransition;
  if (!transition) {
    return;
  }
  if (motionReduced(saved, matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    // A skipped transition rejects its ready promise; that is the point here, not an error.
    transition.ready.catch(() => undefined);
    transition.skipTransition();
    return;
  }
  const activation = (globalThis as { navigation?: { activation?: { from?: { url?: string } } } }).navigation
    ?.activation;
  const way = direction(new URL(activation?.from?.url ?? location.href).pathname, location.pathname);
  if (way) {
    transition.types.add(way);
  }
});
