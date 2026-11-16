import { MONITOR_QUERY } from './query.ts';
import { type Boot, type MonitorControl, startMonitor } from './scene.ts';

/** The day the boot last ran, in the form the `<head>` script of app.html compares. */
const today = (): string => new Date().toLocaleDateString('sv-SE');

/** The boot is over: the page shows, with a power-on, and the day is kept so the same day does not boot again. */
function finish(root: HTMLElement): void {
  if (root.dataset['boot'] !== undefined) {
    root.removeAttribute('data-boot');
    root.dataset['powering'] = '';
    setTimeout(() => root.removeAttribute('data-powering'), 700);
  }
  try {
    localStorage.setItem('boot-day', today());
  } catch {
    // Storage blocked: the boot plays again next time.
  }
}

interface State {
  control: MonitorControl | null;
  generation: number;
  skipped: boolean;
}

function begin(root: HTMLElement, element: HTMLElement, boot: Boot, state: State, withBoot: boolean): void {
  state.generation += 1;
  const mine = state.generation;
  void startMonitor(element, withBoot ? boot : null, () => finish(root)).then((started) => {
    if (mine !== state.generation) {
      started?.stop();
    } else if (started) {
      // The room shows as soon as it exists: the boot is typed on its screen.
      element.dataset['on'] = '';
      state.control = started;
      if (state.skipped) {
        started.land();
      }
    } else {
      root.removeAttribute('data-monitor');
      root.removeAttribute('data-boot');
    }
  });
}

function end(element: HTMLElement, state: State): void {
  state.generation += 1;
  state.control?.stop();
  state.control = null;
  element.removeAttribute('data-on');
}

/**
 * Puts the room behind the window when the head script has turned the monitor on, and keeps it while the window is
 * wide enough. Any key or click during the boot skips it and does nothing else. Returns the way to undo it all.
 */
export function mountMonitor(boot: Boot): () => void {
  const root = document.documentElement;
  if (root.dataset['monitor'] === undefined) {
    return () => undefined;
  }
  // The room hangs from the root, not from the body: the body is the screen and holds back what is fixed inside it.
  const element = document.createElement('div');
  element.className = 'monitor';
  element.setAttribute('aria-hidden', 'true');
  root.append(element);
  const state: State = { control: null, generation: 0, skipped: false };
  const media = matchMedia(MONITOR_QUERY);
  const onChange = (): void => (media.matches ? begin(root, element, boot, state, false) : end(element, state));
  const skip = (event: Event): void => {
    if (root.dataset['boot'] !== undefined) {
      event.stopPropagation();
      event.preventDefault();
      // Before the room is up there is nothing to land yet: it lands as soon as it is.
      state.skipped = true;
      state.control?.land();
    }
  };
  media.addEventListener('change', onChange);
  addEventListener('keydown', skip, true);
  addEventListener('click', skip, true);
  if (media.matches) {
    begin(root, element, boot, state, root.dataset['boot'] !== undefined);
  }
  return () => {
    media.removeEventListener('change', onChange);
    removeEventListener('keydown', skip, true);
    removeEventListener('click', skip, true);
    end(element, state);
    element.remove();
  };
}
