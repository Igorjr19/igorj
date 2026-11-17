/** How much the room draws: all of it, the same without the soft shadows and the outlines, or nothing (the simple site). */
export type Level = 'full' | 'reduced' | 'simple';

/** Below this many frames per second the room is too heavy for the machine. */
export const MIN_FPS = 24;
/** The frames the judgement waits for, so a stall while the textures load is not taken for a slow machine. */
export const SAMPLE_SIZE = 45;

const NEXT: Readonly<Record<Level, Level>> = { full: 'reduced', reduced: 'simple', simple: 'simple' };

/** The level after looking at the time each frame took, in milliseconds: one step down when slow, and never back up. */
export function judge(level: Level, frameMilliseconds: readonly number[]): Level {
  if (level === 'simple' || frameMilliseconds.length < SAMPLE_SIZE) {
    return level;
  }
  const recent = frameMilliseconds.slice(-SAMPLE_SIZE);
  const mean = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  return 1000 / mean < MIN_FPS ? NEXT[level] : level;
}
