import { bootFrame, schedule, showScreen, slowdown } from './boot.ts';
import { advance, isTurning, targetPhase } from './cycle.ts';
import { advanceFlight, poseAt, poseOf } from './flight.ts';
import { loadImage } from './images.ts';
import { listen } from './interaction.ts';
import { animate } from './loop.ts';
import { arrive, handlersOf, pick, refreshMarks } from './navigation.ts';
import { createOverlay } from './overlay.ts';
import { readPalette } from './palette.ts';
import type { Track } from './parts/ipod.ts';
import { createRoom, type Room } from './room.ts';
import {
  type Boot,
  colorMode,
  draw,
  fit,
  lay,
  newRun,
  type Run,
  type SceneControl,
  type SceneOptions,
  stageOf,
  viewNow,
} from './run.ts';

/** How often, in milliseconds, the iPod asks again what is playing while the room is in view. */
const ASK_EVERY = 30_000;

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
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-theme-family', 'data-accent'],
  });
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  scheme.addEventListener('change', later);
  return () => {
    cancelAnimationFrame(waiting);
    observer.disconnect();
    scheme.removeEventListener('change', later);
  };
}

/** The camera is at rest looking at the room, where things move: the leaves, the list on the iPod. */
function inRoom(run: Run): boolean {
  return viewNow(run) === 'room';
}

/** While the room is in view, asks every so often what is playing and tells the iPod; the answer waits when the camera is elsewhere. */
function askWhileInRoom(run: Run, ask: () => Promise<Track | null>): () => void {
  let timer = 0;
  const check = (): void => {
    if (inRoom(run) && timer === 0) {
      const once = (): void => void ask().then((track) => run.room.ipod?.setNow(track));
      once();
      timer = window.setInterval(once, ASK_EVERY);
    } else if (!inRoom(run) && timer !== 0) {
      clearInterval(timer);
      timer = 0;
    }
  };
  const watcher = window.setInterval(check, 500);
  return () => {
    clearInterval(watcher);
    clearInterval(timer);
  };
}

/** The trip the camera is on: one step of it, and its arrival. */
function fly(run: Run, interval: number): void {
  if (!run.flight) {
    return;
  }
  run.flight = advanceFlight(run.flight, interval);
  lay(run, poseAt(run.flight));
  if (run.flight.progress >= 1) {
    arrive(run);
  }
  draw(run);
}

/** One tick of the loop: the boot, a trip, the hours turning, or a redraw that something asked for. */
function tick(
  run: Run,
  seconds: number,
  last: { at: number },
  times: { travel: number; land: number } | null,
  land: () => void,
): void {
  const interval = seconds - last.at;
  last.at = seconds;
  if (!run.landed && times) {
    bootFrame(run, seconds / slowdown(), times);
    if (seconds / slowdown() >= times.land) {
      land();
    }
    return;
  }
  if (run.flight) {
    fly(run, interval);
  } else if (isTurning(run.phase, run.target)) {
    run.phase = advance(run.phase, run.target, interval);
    run.room.setPhase(run.phase);
    draw(run);
  } else if (run.dirty) {
    run.dirty = false;
    draw(run);
  }
  if (inRoom(run)) {
    run.room.plant.sway(seconds, 0);
    run.room.ipod?.tick(seconds);
    refreshMarks(run);
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
  options: SceneOptions,
): Promise<SceneControl | null> {
  const three = await import('three');
  const changed: { run: (() => void) | null } = { run: null };
  let room: Room;
  try {
    room = createRoom(three, host, options.input, { load: loadImage, changed: () => changed.run?.() });
  } catch {
    return null;
  }
  const picked: { run: ((name: Parameters<typeof pick>[1]) => void) | null } = { run: null };
  const overlay = createOverlay(host, options.input.strings, (name) => picked.run?.(name));
  const run = newRun(three, host, boot, room, overlay);
  picked.run = (name) => pick(run, name);
  changed.run = () => {
    run.dirty = true;
  };
  const unask = askWhileInRoom(run, options.nowPlaying);
  room.setPhase(run.phase);
  showScreen(run);
  const place = (): ReturnType<typeof poseOf> => (run.flight ? poseAt(run.flight) : poseOf(run.place, stageOf(run)));
  fit(run, place);
  const observer = new ResizeObserver(() => fit(run, place));
  observer.observe(host);
  const unwatch = watchTheme(() => themeChanged(run));
  const land = (): void => {
    if (!run.landed) {
      run.landed = true;
      showScreen(run);
      fit(run, place);
      document.documentElement.dataset['view'] = 'monitor';
      onLanded();
    }
  };
  const unlisten = listen(host, handlersOf(run));
  const times = boot ? schedule(boot) : null;
  const last = { at: 0 };
  const stopLoop = animate((seconds) => tick(run, seconds, last, times, land));
  if (!boot) {
    document.documentElement.dataset['view'] = 'monitor';
    onLanded();
  }
  return {
    land,
    stop() {
      stopLoop();
      unask();
      unlisten();
      overlay.dispose();
      document.documentElement.removeAttribute('data-view');
      unwatch();
      observer.disconnect();
      run.room.dispose();
    },
  };
}
