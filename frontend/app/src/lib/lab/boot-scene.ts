import { ease, fitDistance } from './camera.ts';
import { animate } from './loop.ts';
import { type Palette, readPalette } from './palette.ts';
import { createRoom, type Room, SCREEN } from './room.ts';
import { type Rect, screenRect } from './screen-rect.ts';
import type { Three } from './three.ts';

const FOV = 35;
const TIMELINE = { first: 0.8, perLine: 0.45, travel: 4.4, land: 5.0 };
const REST_FILL = 0.8;
const FAR = 6.5;

function paint(context: CanvasRenderingContext2D, shown: readonly string[], palette: Palette, cursor: boolean): void {
  const { width, height } = context.canvas;
  context.fillStyle = palette.background;
  context.fillRect(0, 0, width, height);
  context.fillStyle = palette.text;
  context.font = '34px "Fira Code", monospace';
  context.textBaseline = 'top';
  for (const [at, line] of shown.entries()) {
    context.fillText(line, 48, 48 + at * 52);
  }
  if (cursor) {
    context.fillStyle = palette.accent;
    context.fillRect(48, 48 + shown.length * 52, 22, 36);
  }
}

function surfaceOf(): { surface: HTMLCanvasElement; context: CanvasRenderingContext2D } | null {
  const surface = document.createElement('canvas');
  surface.width = 1024;
  surface.height = 640;
  const context = surface.getContext('2d');
  return context ? { surface, context } : null;
}

export interface BootControl {
  /** Takes the camera to its resting place at once, as if the boot had run to its end. */
  readonly land: () => void;
  readonly stop: () => void;
}

export interface BootHandlers {
  /** Fires once the camera has landed and the live page should light the screen. */
  readonly onLanded: () => void;
  /** Where the screen is in the view, now and after every resize. */
  readonly onRect: (rect: Rect) => void;
}

interface Run {
  readonly three: Three;
  readonly host: HTMLElement;
  readonly room: Room;
  readonly texture: InstanceType<Three['CanvasTexture']>;
  readonly drawing: { surface: HTMLCanvasElement; context: CanvasRenderingContext2D };
  readonly palette: Palette;
  readonly lines: readonly string[];
  readonly handlers: BootHandlers;
  rest: number;
  landed: boolean;
  frames: number;
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
    run.handlers.onRect(screenRect(run.three, run.room.camera, SCREEN, SCREEN, { width, height }));
  }
}

function frame(run: Run, seconds: number): void {
  const shown = Math.max(0, Math.floor((seconds - TIMELINE.first) / TIMELINE.perLine) + 1);
  paint(run.drawing.context, run.lines.slice(0, shown), run.palette, Math.floor(seconds * 2) % 2 === 0);
  run.texture.needsUpdate = true;
  const travel = ease(seconds / TIMELINE.travel);
  lay(run, FAR + (run.rest - FAR) * travel, 0.15 * (1 - travel));
  draw(run);
}

/**
 * A power-on test typed on the screen while the camera moves in and lands on the monitor. After that nothing
 * moves: the room is drawn again only when the window changes size.
 */
export async function startBoot(
  host: HTMLElement,
  lines: readonly string[],
  handlers: BootHandlers,
): Promise<BootControl | null> {
  const three = await import('three');
  const palette = readPalette();
  const drawing = surfaceOf();
  let room: Room;
  try {
    room = createRoom(three, host, palette);
  } catch {
    return null;
  }
  if (!drawing) {
    room.dispose();
    return null;
  }
  const texture = new three.CanvasTexture(drawing.surface);
  texture.colorSpace = three.SRGBColorSpace;
  room.screen.material = new three.MeshBasicMaterial({ map: texture });
  const run: Run = { three, host, room, texture, drawing, palette, lines, handlers, rest: 3, landed: false, frames: 0 };
  const observer = new ResizeObserver(() => fit(run));
  observer.observe(host);
  fit(run);
  const loop: { stop: (() => void) | null } = { stop: null };
  const land = (): void => {
    if (!run.landed) {
      run.landed = true;
      loop.stop?.();
      fit(run);
      handlers.onLanded();
    }
  };
  loop.stop = animate((seconds) => {
    frame(run, seconds);
    if (seconds >= TIMELINE.land) {
      land();
    }
  });
  return {
    land,
    stop: () => {
      loop.stop?.();
      observer.disconnect();
      texture.dispose();
      room.dispose();
    },
  };
}
