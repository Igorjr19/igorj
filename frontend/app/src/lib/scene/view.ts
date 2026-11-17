/**
 * Where the visitor is looking: at the screen of the monitor with the site on it, at the room, or on the way
 * between. `mix` is 1 at the monitor and 0 at the room, and it moves toward `goal` at a steady pace.
 */
export type View = 'monitor' | 'moving' | 'room';

/** A trip between the room and the monitor takes this many seconds. */
export const TRIP_SECONDS = 1.1;

export function step(mix: number, goal: number, seconds: number): number {
  const move = seconds / TRIP_SECONDS;
  return goal > mix ? Math.min(goal, mix + move) : Math.max(goal, mix - move);
}

export function viewOf(mix: number, goal: number): View {
  if (mix === goal) {
    return goal === 1 ? 'monitor' : 'room';
  }
  return 'moving';
}

/** How far back the camera stands to see the whole room: wide enough for the desk and the board, whatever the shape of the window. */
export function roomDistance(fovDegrees: number, aspect: number): number {
  const tangent = Math.tan((fovDegrees * Math.PI) / 360);
  return Math.max(9.2, 8.4 / (2 * tangent * aspect) + 1.5);
}
