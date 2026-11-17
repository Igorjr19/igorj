import type { SpotName } from './kit.ts';
import type { View } from './view.ts';

export interface Handlers {
  /** Where the camera is: at the monitor, at the room, or on the way. */
  view(): View;
  /** Sends the camera to the monitor (1) or back to the room (0). */
  go(goal: 0 | 1): void;
  /** The object of the room under the pointer, if any. */
  under(event: PointerEvent | MouseEvent): SpotName | null;
}

/** Whether a key press belongs to the page and not to the room: a field being typed in, a box open, or a key already taken. */
function taken(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  const typing = target?.matches?.('input, textarea, select, [contenteditable]') ?? false;
  return event.defaultPrevented || typing || document.querySelector('dialog[open]') !== null;
}

/**
 * What the visitor does to the room itself: a click on the room around the screen steps back to see it, a click on
 * the monitor in it goes back in, and the wheel and the keys do the same. Returns the way to undo it all.
 */
export function listen(host: HTMLElement, handlers: Handlers): () => void {
  const click = (event: MouseEvent): void => {
    if (handlers.view() === 'monitor') {
      handlers.go(0);
    } else if (handlers.view() === 'room' && handlers.under(event) === 'monitor') {
      handlers.go(1);
    }
  };
  const wheel = (event: WheelEvent): void => {
    if (event.deltaY > 0 && handlers.view() === 'monitor') {
      handlers.go(0);
    } else if (event.deltaY < 0 && handlers.view() === 'room') {
      handlers.go(1);
    }
  };
  const move = (event: PointerEvent): void => {
    host.style.cursor = handlers.view() === 'room' && handlers.under(event) === 'monitor' ? 'pointer' : '';
  };
  const key = (event: KeyboardEvent): void => {
    if (taken(event)) {
      return;
    }
    if (event.key === 'Escape' && handlers.view() === 'monitor') {
      handlers.go(0);
    } else if (event.key === 'Enter' && handlers.view() === 'room') {
      handlers.go(1);
    }
  };
  host.addEventListener('click', click);
  host.addEventListener('wheel', wheel, { passive: true });
  host.addEventListener('pointermove', move);
  addEventListener('keydown', key);
  return () => {
    host.removeEventListener('click', click);
    host.removeEventListener('wheel', wheel);
    host.removeEventListener('pointermove', move);
    removeEventListener('keydown', key);
  };
}

/** Where a pointer is on the screen of `host`, from -1 to 1 across and up. */
export function pointerOnScreen(event: PointerEvent | MouseEvent, host: HTMLElement): [number, number] {
  const box = host.getBoundingClientRect();
  return [((event.clientX - box.left) / box.width) * 2 - 1, -(((event.clientY - box.top) / box.height) * 2 - 1)];
}
