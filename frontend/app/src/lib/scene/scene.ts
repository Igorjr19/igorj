import type * as T from 'three';
import { ease, fitDistance } from './camera.ts';
import { advance, isTurning, type Mode, targetPhase } from './cycle.ts';
import { animate } from './loop.ts';
import { type Palette, readPalette } from './palette.ts';
import { createRoom, type Room, SCREEN } from './room.ts';
import type { Three } from './three.ts';

const FOV = 35;
/** The share of the view the screen takes at rest; scene.css gives the window the same share. */
export const REST_FILL = 0.8;
/** Where the camera stands to see the whole room, and where it looks. The boot starts here and moves in to the screen. */
const ROOM_VIEW = { position: [0, 2.3, 9.2], target: [0, 1.7, -0.2] } as const;
const TYPING = { first: 0.8, perLine: 1.1, after: 1.4 };
const LINE = 52;

/** How many times slower the boot runs: a test sets `localStorage['boot-slowdown']` to hold it long enough to look at it. */
function slowdown(): number {
  try {
    return Math.max(1, Number(localStorage.getItem('boot-slowdown')) || 1);
  } catch {
    return 1;
  }
}

export interface Boot {
  readonly lines: readonly string[];
  readonly skip: string;
}

export interface SceneControl {
  /** Takes the camera to its resting place at once, as if the boot had run to its end. */
  readonly land: () => void;
  readonly stop: () => void;
}

interface Run {
  readonly three: Three;
  readonly host: HTMLElement;
  readonly boot: Boot | null;
  readonly drawing: { surface: HTMLCanvasElement; context: CanvasRenderingContext2D } | null;
  readonly room: Room;
  palette: Palette;
  texture: T.CanvasTexture | null;
  rest: number;
  landed: boolean;
  frames: number;
  /** The hours of the window: where they are, and where the theme says they should stop. */
  phase: number;
  target: number;
  dirty: boolean;
}

/** Light or dark, as the theme of the page says it. */
function colorMode(): Mode {
  const scheme = getComputedStyle(document.documentElement).colorScheme;
  return scheme.includes('dark') && !scheme.includes('light') ? 'dark' : 'light';
}

function paint(run: Run, shown: number, cursor: boolean): void {
  if (!(run.drawing && run.boot)) {
    return;
  }
  const { context } = run.drawing;
  const { width, height } = context.canvas;
  context.fillStyle = run.palette.background;
  context.fillRect(0, 0, width, height);
  context.fillStyle = run.palette.text;
  context.font = '34px "Fira Code", monospace';
  context.textBaseline = 'top';
  for (const [at, line] of run.boot.lines.slice(0, shown).entries()) {
    context.fillText(line, 48, 48 + at * LINE);
  }
  if (cursor) {
    context.fillStyle = run.palette.accent;
    context.fillRect(48, 48 + shown * LINE, 22, 36);
  }
  context.fillStyle = run.palette.accent;
  context.font = '26px "Fira Code", monospace';
  context.fillText(run.boot.skip, 48, height - 64);
}

function draw(run: Run): void {
  run.room.render();
  run.frames += 1;
  run.host.dataset['frames'] = String(run.frames);
  run.host.dataset['phase'] = run.phase.toFixed(2);
}

/** Puts the camera between the view of the room (0) and the front of the screen (1). */
function lay(run: Run, progress: number): void {
  const { Vector3 } = run.three;
  const room = new Vector3(...ROOM_VIEW.position);
  const rest = new Vector3(SCREEN.x, SCREEN.y, run.rest);
  const looking = new Vector3(...ROOM_VIEW.target).lerp(new Vector3(SCREEN.x, SCREEN.y, SCREEN.z), progress);
  run.room.camera.position.copy(room.lerp(rest, progress));
  run.room.camera.lookAt(looking);
}

function fit(run: Run): void {
  const { clientWidth: width, clientHeight: height } = run.host;
  run.room.resize(width, height);
  run.rest = fitDistance(FOV, width / height, SCREEN.width, SCREEN.height, REST_FILL);
  if (run.landed) {
    lay(run, 1);
    draw(run);
  }
}

/** The screen shows what is typed on the canvas of the boot, then the plain color of the theme. */
function showScreen(run: Run): void {
  const { three } = run;
  run.texture = null;
  if (run.drawing && !run.landed) {
    run.texture = new three.CanvasTexture(run.drawing.surface);
    run.texture.colorSpace = three.SRGBColorSpace;
    (run.room.screen as T.Mesh).material = new three.MeshBasicMaterial({ map: run.texture, toneMapped: false });
  } else {
    (run.room.screen as T.Mesh).material = new three.MeshBasicMaterial({
      color: run.palette.background,
      toneMapped: false,
    });
  }
}

/** The seconds the typing takes, and so when the camera has arrived and the boot ends. */
function schedule(boot: Boot): { travel: number; land: number } {
  const travel = TYPING.first + boot.lines.length * TYPING.perLine;
  return { travel, land: travel + TYPING.after };
}

function bootFrame(run: Run, seconds: number, times: { travel: number }): void {
  const shown = Math.max(0, Math.floor((seconds - TYPING.first) / TYPING.perLine) + 1);
  paint(run, shown, Math.floor(seconds * 2) % 2 === 0);
  if (run.texture) {
    run.texture.needsUpdate = true;
  }
  lay(run, ease(seconds / times.travel));
  draw(run);
}

/** The colors changed: the screen takes the theme's, and the hours of the window turn to the next noon or midnight. */
function themeChanged(run: Run): void {
  run.palette = readPalette();
  showScreen(run);
  run.target = targetPhase(run.phase, colorMode());
  run.dirty = true;
}

/** Watches what changes the colors of the room: the theme the page asks for and the one the system prefers. */
function watchTheme(changed: () => void): () => void {
  let waiting = 0;
  const later = (): void => {
    cancelAnimationFrame(waiting);
    waiting = requestAnimationFrame(changed);
  };
  const observer = new MutationObserver(later);
  observer.observe(document.documentElement, { attributes: true });
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  scheme.addEventListener('change', later);
  return () => {
    cancelAnimationFrame(waiting);
    observer.disconnect();
    scheme.removeEventListener('change', later);
  };
}

function surfaceOf(): Run['drawing'] {
  const surface = document.createElement('canvas');
  surface.width = 1024;
  surface.height = 640;
  const context = surface.getContext('2d');
  return context ? { surface, context } : null;
}

/** One tick of the loop: the boot, the hours turning, or a redraw that something asked for. */
function tick(
  run: Run,
  seconds: number,
  last: { at: number },
  times: { travel: number; land: number } | null,
  land: () => void,
): void {
  const step = seconds - last.at;
  last.at = seconds;
  if (!run.landed && times) {
    bootFrame(run, seconds / slowdown(), times);
    if (seconds / slowdown() >= times.land) {
      land();
    }
    return;
  }
  if (isTurning(run.phase, run.target)) {
    run.phase = advance(run.phase, run.target, step);
    run.room.setPhase(run.phase);
    draw(run);
  } else if (run.dirty) {
    run.dirty = false;
    draw(run);
  }
}

/**
 * The room behind the window of the site. With a `boot`, a power-on test is typed on the screen while the camera
 * moves in and lands on the monitor; without one the camera is at rest from the start. Once landed nothing moves:
 * the room is drawn again only when the window is resized or the theme changes, and then the hours of the window
 * turn. Resolves to null when WebGL is missing.
 */
export async function startScene(
  host: HTMLElement,
  boot: Boot | null,
  onLanded: () => void,
): Promise<SceneControl | null> {
  const three = await import('three');
  let room: Room;
  try {
    room = createRoom(three, host);
  } catch {
    return null;
  }
  const phase = colorMode() === 'dark' ? 0.5 : 0;
  const run: Run = {
    three,
    host,
    boot,
    drawing: boot ? surfaceOf() : null,
    room,
    palette: readPalette(),
    texture: null,
    rest: 3,
    landed: boot === null,
    frames: 0,
    phase,
    target: phase,
    dirty: true,
  };
  room.setPhase(phase);
  showScreen(run);
  fit(run);
  const observer = new ResizeObserver(() => fit(run));
  observer.observe(host);
  const unwatch = watchTheme(() => themeChanged(run));
  const stopLoop = { stop: null as (() => void) | null };
  const land = (): void => {
    if (!run.landed) {
      run.landed = true;
      showScreen(run);
      fit(run);
      onLanded();
    }
  };
  const times = boot ? schedule(boot) : null;
  const last = { at: 0 };
  stopLoop.stop = animate((seconds) => tick(run, seconds, last, times, land));
  if (!boot) {
    onLanded();
  }
  return {
    land,
    stop() {
      stopLoop.stop?.();
      unwatch();
      observer.disconnect();
      run.room.dispose();
    },
  };
}
