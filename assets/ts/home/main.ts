/// <reference lib="dom" />
import { type HomeOrigin, saveOrigin, shouldRestoreFocus, takeOrigin } from './origin.ts';

function storage(): Storage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

function followedLink(event: MouseEvent): HomeOrigin | null {
  const plain = event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
  const link = event.target instanceof Element ? event.target.closest('a') : null;
  const panel = link?.closest('.grid > .panel');
  const href = link?.getAttribute('href');
  return plain && panel && href ? { panel: panel.id, href } : null;
}

/** The row the visitor left from, or its panel when that row is gone. */
function placeToRestore(origin: HomeOrigin): HTMLElement | null {
  const panel = document.getElementById(origin.panel);
  const link = [...(panel?.querySelectorAll('a') ?? [])].find(
    (candidate) => candidate.getAttribute('href') === origin.href,
  );
  return link ?? panel;
}

const saved = storage();

const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
const origin = saved ? takeOrigin(saved) : null;
const cameFromThisSite = document.referrer !== '' && new URL(document.referrer).origin === location.origin;
if (origin && shouldRestoreFocus(navigation?.type ?? 'navigate', cameFromThisSite)) {
  placeToRestore(origin)?.focus();
}

document.addEventListener('click', (event) => {
  const followed = followedLink(event);
  if (saved && followed) {
    try {
      saveOrigin(saved, followed);
    } catch {
      // Storage full or blocked: going back simply starts from the top.
    }
  }
});
