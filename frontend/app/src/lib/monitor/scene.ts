import { ease, fitDistance } from './camera.ts';
import { animate } from './loop.ts';
import { type Palette, readPalette } from './palette.ts';
import { createRoom, type Room, SCREEN } from './room.ts';
import type { Three } from './three.ts';

const FOV = 35;
/** The share of the view the screen takes at rest; monitor.css gives the window the same share. */
export const REST_FILL = 0.8;
const TIMELINE = { first: 0.8, perLine: 0.45, travel: 4.4, land: 5 };
const FAR = 6.5;
const LINE = 52;

export interface Boot {
  readonly lines: readonly string[];
  readonly skip: string;
}

export interface MonitorControl {
  /** Takes the camera to its resting place at once, as if the boot had run to its end. */
  readonly land: () => void;
  readonly stop: () => void;
}

interface Run {
  readonly three: Three;
  readonly host: HTMLElement;
  readonly onLanded: () => void;
  readonly boot: Boot | null;
  readonly drawing: { surface: HTMLCanvasElement; context: CanvasRenderingContext2D } | null;
  room: Room;
  palette: Palette;
  texture: InstanceType<Three['CanvasTexture']> | null;
  rest: number;
  landed: boolean;
  frames: number;
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
}

function lay(run: Run, distance: number, lift: number): void {
  run.room.camera.position.set(0, SCREEN.y + lift, distance);
  run.room.camera.lookAt(SCREEN.x, SCREEN.y, SCREEN.z);
}

function fit(run: Run): void {
  const { clientWidth: width, clientHeight: height } = run.host;
  run.room.resize(width, height);
  run.rest = fitDistance(FOV, width / height, SCREEN.width, SCREEN.height, REST_FILL);
  if (run.landed) {
    lay(run, run.rest, 0);
    draw(run);
  }
}

function frame(run: Run, seconds: number): void {
  const shown = Math.max(0, Math.floor((seconds - TIMELINE.first) / TIMELINE.perLine) + 1);
  paint(run, shown, Math.floor(seconds * 2) % 2 === 0);
  if (run.texture) {
    run.texture.needsUpdate = true;
  }
  const travel = ease(seconds / TIMELINE.travel);
  lay(run, FAR + (run.rest - FAR) * travel, 0.15 * (1 - travel));
  draw(run);
}

/** While the boot runs, the screen shows what is typed on the canvas of the boot. */
function showBoot(run: Run): void {
  run.texture = null;
  if (run.drawing && !run.landed) {
    run.texture = new run.three.CanvasTexture(run.drawing.surface);
    run.texture.colorSpace = run.three.SRGBColorSpace;
    run.room.screen.material = new run.three.MeshBasicMaterial({ map: run.texture });
  }
}

/** Builds the room again in the colors the theme has now; the camera stays where it is. */
function rebuild(run: Run): void {
  run.room.dispose();
  run.palette = readPalette();
  run.room = createRoom(run.three, run.host, run.palette);
  showBoot(run);
  fit(run);
}

function surfaceOf(): Run['drawing'] {
  const surface = document.createElement('canvas');
  surface.width = 1024;
  surface.height = 640;
  const context = surface.getContext('2d');
  return context ? { surface, context } : null;
}

/** Watches what changes the colors of the room: the theme the page asks for and the one the system prefers. */
function watchTheme(redraw: () => void): () => void {
  let waiting = 0;
  const later = (): void => {
    cancelAnimationFrame(waiting);
    waiting = requestAnimationFrame(redraw);
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

/**
 * The room behind the window of the site. With a `boot`, a power-on test is typed on the screen while the camera
 * moves in and lands on the monitor; without one the camera is at rest from the start. Once landed nothing
 * moves: the room is drawn again only when the window is resized or the theme changes. Resolves to null when
 * WebGL is missing.
 */
export async function startMonitor(
  host: HTMLElement,
  boot: Boot | null,
  onLanded: () => void,
): Promise<MonitorControl | null> {
  const three = await import('three');
  const palette = readPalette();
  let room: Room;
  try {
    room = createRoom(three, host, palette);
  } catch {
    return null;
  }
  const run: Run = {
    three,
    host,
    onLanded,
    boot,
    drawing: boot ? surfaceOf() : null,
    room,
    palette,
    texture: null,
    rest: 3,
    landed: boot === null,
    frames: 0,
  };
  showBoot(run);
  fit(run);
  const observer = new ResizeObserver(() => fit(run));
  observer.observe(host);
  const unwatch = watchTheme(() => rebuild(run));
  const loop: { stop: (() => void) | null } = { stop: null };
  const land = (): void => {
    if (!run.landed) {
      run.landed = true;
      loop.stop?.();
      loop.stop = null;
      rebuild(run);
      onLanded();
    }
  };
  if (boot) {
    loop.stop = animate((seconds) => {
      frame(run, seconds);
      if (seconds >= TIMELINE.land) {
        land();
      }
    });
  } else {
    onLanded();
  }
  return {
    land,
    stop: () => {
      loop.stop?.();
      unwatch();
      observer.disconnect();
      run.room.dispose();
    },
  };
}
