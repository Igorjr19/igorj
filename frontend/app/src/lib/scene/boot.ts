import type * as T from 'three';
import { poseAt, poseOf } from './flight.ts';
import { type Boot, draw, lay, type Run, stageOf } from './run.ts';

const TYPING = { first: 0.8, perLine: 1.1, after: 1.4 };
const LINE = 52;

/** How many times slower the boot runs: a test sets `localStorage['boot-slowdown']` to hold it long enough to look at it. */
export function slowdown(): number {
  try {
    return Math.max(1, Number(localStorage.getItem('boot-slowdown')) || 1);
  } catch {
    return 1;
  }
}

/** The seconds the typing takes, and so when the camera has arrived and the boot ends. */
export function schedule(boot: Boot): { travel: number; land: number } {
  const travel = TYPING.first + boot.lines.length * TYPING.perLine;
  return { travel, land: travel + TYPING.after };
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

/** The screen shows what is typed on the canvas of the boot, then the plain color of the theme. */
export function showScreen(run: Run): void {
  const { three } = run;
  run.texture = null;
  const screen = run.room.screen as T.Mesh;
  if (run.drawing && !run.landed) {
    run.texture = new three.CanvasTexture(run.drawing.surface);
    run.texture.colorSpace = three.SRGBColorSpace;
    screen.material = new three.MeshBasicMaterial({ map: run.texture, toneMapped: false });
  } else {
    screen.material = new three.MeshBasicMaterial({ color: run.palette.background, toneMapped: false });
  }
}

/** One frame of the boot: the lines typed so far, and the camera on its way in from the view of the room. */
export function bootFrame(run: Run, seconds: number, times: { travel: number }): void {
  const shown = Math.max(0, Math.floor((seconds - TYPING.first) / TYPING.perLine) + 1);
  paint(run, shown, Math.floor(seconds * 2) % 2 === 0);
  if (run.texture) {
    run.texture.needsUpdate = true;
  }
  const stage = stageOf(run);
  lay(
    run,
    poseAt({
      from: poseOf('room', stage),
      to: poseOf('monitor', stage),
      progress: Math.min(1, seconds / times.travel),
    }),
  );
  draw(run);
}
