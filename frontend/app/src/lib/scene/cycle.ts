/**
 * The hours of the room as a phase that only grows: a whole number is noon and a half is midnight, so the sun and the
 * moon always cross the window the same way and a turn never runs back.
 */
export type Mode = 'light' | 'dark';

/** Half a cycle, from noon to midnight, takes two and a half seconds. */
export const PHASE_PER_SECOND = 0.2;

/** The next noon for the light theme and the next midnight for the dark one, never behind the current phase. */
export function targetPhase(current: number, mode: Mode): number {
  const epsilon = 1e-9;
  return mode === 'dark' ? Math.ceil(current - 0.5 - epsilon) + 0.5 : Math.ceil(current - epsilon);
}

export function advance(phase: number, target: number, seconds: number): number {
  return Math.min(target, phase + seconds * PHASE_PER_SECOND);
}

/** The hours are turning: a new choice of theme must wait until they stop. */
export function isTurning(phase: number, target: number): boolean {
  return phase < target;
}

/** 1 at noon, 0 at dusk and dawn, -1 at midnight. */
export function sunlight(phase: number): number {
  return Math.cos(2 * Math.PI * phase);
}

/** 0 by day and 1 by night, the share the lights and the sky are blended by. */
export function nightness(phase: number): number {
  return (1 - sunlight(phase)) / 2;
}

export interface Body {
  /** Across the window and up it, from 0 to 1 of the sky picture. */
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

/** The sun, or the moon with an offset of half a cycle: up at its noon, going down to the left, out of sight below the hill. */
export function bodyAt(phase: number, offset = 0): Body {
  const angle = 2 * Math.PI * (phase + offset);
  const height = Math.cos(angle);
  return { x: 0.586 - 0.488 * Math.sin(angle), y: 0.95 - 0.675 * height, visible: height >= -0.12 };
}
