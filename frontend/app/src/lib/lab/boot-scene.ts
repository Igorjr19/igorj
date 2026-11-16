import { ease, fitDistance } from './camera.ts';
import { animate } from './loop.ts';
import { type Palette, readPalette } from './palette.ts';
import { createRoom, type Room, SCREEN } from './room.ts';

const FOV = 35;
const TIMELINE = { first: 0.8, perLine: 0.45, travel: 4.6, handover: 5.4 };
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

/** A power-on test typed on the screen while the camera moves in. `onDone` fires when the live page should take over. */
export async function startBoot(
  host: HTMLElement,
  lines: readonly string[],
  onDone: () => void,
): Promise<(() => void) | null> {
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
  let near = 3;
  const fit = (): void => {
    const { clientWidth: width, clientHeight: height } = host;
    room.resize(width, height);
    near = fitDistance(FOV, width / height, SCREEN.width, SCREEN.height, 0.94);
  };
  const observer = new ResizeObserver(fit);
  observer.observe(host);
  fit();
  let finished = false;
  const stop = animate((seconds) => {
    const shown = Math.max(0, Math.floor((seconds - TIMELINE.first) / TIMELINE.perLine) + 1);
    paint(drawing.context, lines.slice(0, shown), palette, Math.floor(seconds * 2) % 2 === 0);
    texture.needsUpdate = true;
    const travel = ease(seconds / TIMELINE.travel);
    room.camera.position.set(0, SCREEN.y + 0.15 * (1 - travel), FAR + (near - FAR) * travel);
    room.camera.lookAt(SCREEN.x, SCREEN.y, SCREEN.z);
    room.render();
    if (seconds >= TIMELINE.handover && !finished) {
      finished = true;
      onDone();
    }
  });
  return () => {
    stop();
    observer.disconnect();
    texture.dispose();
    room.dispose();
  };
}
