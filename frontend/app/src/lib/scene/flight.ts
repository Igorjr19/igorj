import { ease } from './camera.ts';
import { roomDistance, TRIP_SECONDS } from './view.ts';

export type Vec = readonly [number, number, number];

/** Where the camera stands and what it looks at. */
export interface Pose {
  readonly position: Vec;
  readonly target: Vec;
}

/** Where the camera can be: at the screen of the monitor, back at the room, or close to one of the objects. */
export type Place = 'monitor' | 'room' | 'plant' | 'music' | 'books' | 'posters';
export type Focus = Exclude<Place, 'monitor' | 'room'>;

/** The close view of each object: where to stand and what to look at. */
const CLOSE: Readonly<Record<Focus, Pose>> = {
  music: { position: [-2.2, 1.55, 3], target: [-2.2, 0.85, 0.5] },
  books: { position: [1.95, 1.6, 2.5], target: [1.95, 0.6, 0.5] },
  posters: { position: [1.8, 2.7, 2.6], target: [1.8, 2.7, -1.2] },
  plant: { position: [3.8, 0.9, 4], target: [4, 0.2, 0.7] },
};

export interface Stage {
  /** How far in front of the screen the camera stands at rest. */
  readonly rest: number;
  readonly fov: number;
  readonly aspect: number;
  /** Where the screen is. */
  readonly screen: Vec;
}

export function poseOf(place: Place, stage: Stage): Pose {
  if (place === 'monitor') {
    return { position: [stage.screen[0], stage.screen[1], stage.rest], target: stage.screen };
  }
  if (place === 'room') {
    return { position: [0, 2.3, roomDistance(stage.fov, stage.aspect)], target: [0, 1.7, -0.2] };
  }
  return CLOSE[place];
}

export interface Flight {
  readonly from: Pose;
  readonly to: Pose;
  /** From 0 (where it started) to 1 (arrived). */
  readonly progress: number;
}

export function advanceFlight(flight: Flight, seconds: number): Flight {
  return { ...flight, progress: Math.min(1, flight.progress + seconds / TRIP_SECONDS) };
}

const between = (from: Vec, to: Vec, amount: number): Vec => [
  from[0] + (to[0] - from[0]) * amount,
  from[1] + (to[1] - from[1]) * amount,
  from[2] + (to[2] - from[2]) * amount,
];

/** The pose of the camera part way through a flight, easing in and out. */
export function poseAt(flight: Flight): Pose {
  const amount = ease(flight.progress);
  return {
    position: between(flight.from.position, flight.to.position, amount),
    target: between(flight.from.target, flight.to.target, amount),
  };
}

export function isFocus(place: Place): place is Focus {
  return place !== 'monitor' && place !== 'room';
}
