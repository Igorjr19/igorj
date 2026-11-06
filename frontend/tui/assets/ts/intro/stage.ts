/** Where the time of the last visit is kept, in milliseconds. */
export const INTRO_STORAGE_KEY = 'intro';

/** A visit after this long away counts as a new session and gets the short opening. */
export const SESSION_GAP = 30 * 60 * 1000;

export type IntroStage = 'full' | 'short';

/** The full opening on the first visit, the short one after a long absence, none otherwise or with motion reduced. */
export function introStage(lastVisit: string | null, now: number, reduced: boolean): IntroStage | null {
  if (reduced) {
    return null;
  }
  const last = Number(lastVisit);
  if (lastVisit === null || !Number.isFinite(last)) {
    return 'full';
  }
  return now - last > SESSION_GAP ? 'short' : null;
}

/** How far ahead of the settled characters the noise runs, as a share of the width. */
const NOISE_BAND = 0.2;

/**
 * The name partway through forming: from left to right, characters settle into place, a band of noise runs
 * ahead of them and the rest is still blank. Spaces and line breaks stay where they are.
 */
export function forming(final: string, progress: number, noise: () => string): string {
  const lines = final.split('\n');
  const width = Math.max(1, ...lines.map((line) => line.length));
  const front = progress * (1 + NOISE_BAND);
  return lines
    .map((line) =>
      [...line]
        .map((char, column) => {
          const place = column / width;
          if (char === ' ' || place < front - NOISE_BAND) {
            return char;
          }
          return place < front ? noise() : ' ';
        })
        .join('')
        .trimEnd(),
    )
    .join('\n');
}
