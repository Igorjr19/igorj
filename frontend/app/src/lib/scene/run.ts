import type * as T from 'three';
import { fitDistance } from './camera.ts';
import type { Mode } from './cycle.ts';
import type { Flight, Place, Pose, Stage } from './flight.ts';
import type { SceneInput } from './input.ts';
import type { SpotName } from './kit.ts';
import type { Overlay } from './overlay.ts';
import { type Palette, readPalette } from './palette.ts';
import type { Track } from './parts/ipod.ts';
import type { Room } from './room.ts';
import { SCREEN } from './room.ts';
import type { Three } from './three.ts';
import type { View } from './view.ts';

export const FOV = 35;
/** The share of the view the screen takes at rest; scene.css gives the window the same share. */
export const REST_FILL = 0.8;

export interface Boot {
  readonly lines: readonly string[];
  readonly skip: string;
}

/** What the room is started with: what it shows, and how to learn what is playing now (null for nothing). */
export interface SceneOptions {
  readonly input: SceneInput;
  readonly nowPlaying: () => Promise<Track | null>;
}

export interface SceneControl {
  /** Takes the camera to its resting place at once, as if the boot had run to its end. */
  readonly land: () => void;
  readonly stop: () => void;
}

/** Everything the room knows about itself while it runs. */
export interface Run {
  readonly three: Three;
  readonly host: HTMLElement;
  readonly boot: Boot | null;
  readonly drawing: { surface: HTMLCanvasElement; context: CanvasRenderingContext2D } | null;
  readonly room: Room;
  readonly overlay: Overlay;
  palette: Palette;
  texture: T.CanvasTexture | null;
  rest: number;
  landed: boolean;
  frames: number;
  /** The hours of the window: where they are, and where the theme says they should stop. */
  phase: number;
  target: number;
  dirty: boolean;
  /** Where the camera is, or is going; and the trip it is on, if any. */
  place: Place;
  flight: Flight | null;
  /** The object pointed at, and the one chosen by keyboard. */
  hovered: SpotName | null;
  selected: SpotName | null;
}

/** Light or dark, as the theme of the page says it. */
export function colorMode(): Mode {
  const scheme = getComputedStyle(document.documentElement).colorScheme;
  return scheme.includes('dark') && !scheme.includes('light') ? 'dark' : 'light';
}

function surfaceOf(): Run['drawing'] {
  const surface = document.createElement('canvas');
  surface.width = 1024;
  surface.height = 640;
  const context = surface.getContext('2d');
  return context ? { surface, context } : null;
}

export function newRun(three: Three, host: HTMLElement, boot: Boot | null, room: Room, overlay: Overlay): Run {
  const phase = colorMode() === 'dark' ? 0.5 : 0;
  return {
    three,
    host,
    boot,
    room,
    overlay,
    drawing: boot ? surfaceOf() : null,
    palette: readPalette(),
    texture: null,
    rest: 3,
    landed: boot === null,
    frames: 0,
    phase,
    target: phase,
    dirty: true,
    place: 'monitor',
    flight: null,
    hovered: null,
    selected: null,
  };
}

export function draw(run: Run): void {
  run.room.render();
  run.frames += 1;
  run.host.dataset['frames'] = String(run.frames);
  run.host.dataset['phase'] = run.phase.toFixed(2);
}

export function stageOf(run: Run): Stage {
  return { rest: run.rest, fov: FOV, aspect: run.room.camera.aspect, screen: [SCREEN.x, SCREEN.y, SCREEN.z] };
}

/** Puts the camera at a pose. */
export function lay(run: Run, pose: Pose): void {
  run.room.camera.position.set(...pose.position);
  run.room.camera.lookAt(...pose.target);
}

/** The window changed shape: the room is fitted to it, and the camera stays where it was going. */
export function fit(run: Run, pose: () => Pose): void {
  const { clientWidth: width, clientHeight: height } = run.host;
  run.room.resize(width, height);
  run.rest = fitDistance(FOV, width / height, SCREEN.width, SCREEN.height, REST_FILL);
  if (run.landed) {
    lay(run, pose());
    draw(run);
  }
}

/** What the visitor sees now: the monitor, the room, one object close up, or the camera on its way. */
export function viewNow(run: Run): View {
  if (!run.landed) {
    return 'monitor';
  }
  if (run.flight) {
    return 'moving';
  }
  if (run.place === 'monitor' || run.place === 'room') {
    return run.place;
  }
  return 'focus';
}
