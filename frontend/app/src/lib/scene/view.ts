/**
 * Where the visitor is looking: at the screen of the monitor with the site on it, at the room, close to an object,
 * or on the way between.
 */
export type View = 'monitor' | 'moving' | 'room' | 'focus';

/** A trip between two places takes this many seconds. */
export const TRIP_SECONDS = 1.1;

/** How far back the camera stands to see the whole room: wide enough for the desk and the board, whatever the shape of the window. */
export function roomDistance(fovDegrees: number, aspect: number): number {
  const tangent = Math.tan((fovDegrees * Math.PI) / 360);
  return Math.max(9.2, 8.4 / (2 * tangent * aspect) + 1.5);
}

/** The view for a place the camera is going to, once it has `arrived` there or while it is still on the way. */
export function viewOf(place: 'monitor' | 'room' | 'focus', arrived: boolean): View {
  return arrived ? place : 'moving';
}
