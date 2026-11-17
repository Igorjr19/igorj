import type { Place } from './flight.ts';
import type { SpotName } from './kit.ts';
import { clickPlace, enterPlace, escapePlace } from './navigate.ts';
import type { Arrow } from './neighbour.ts';
import type { View } from './view.ts';

export interface Handlers {
  view(): View;
  /** Where the camera is, or is going. */
  place(): Place;
  selected(): SpotName | null;
  /** The object of the room under the pointer, if any. */
  under(event: PointerEvent | MouseEvent): SpotName | null;
  /** Sends the camera to a place; does nothing for null. */
  go(place: Place | null): void;
  hover(spot: SpotName | null): void;
  arrow(arrow: Arrow): void;
}

const ARROWS: readonly string[] = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

/** Whether a key press belongs to the page and not to the room: a field being typed in, a box open, or a key already taken. */
function taken(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  const typing = target?.matches?.('input, textarea, select, [contenteditable]') ?? false;
  const inIndex = target?.closest?.('.scene__index') !== null && target?.closest?.('.scene__index') !== undefined;
  return event.defaultPrevented || typing || inIndex || document.querySelector('dialog[open]') !== null;
}

/** Where a pointer is on the screen of `host`, from -1 to 1 across and up. */
export function pointerOnScreen(event: PointerEvent | MouseEvent, host: HTMLElement): [number, number] {
  const box = host.getBoundingClientRect();
  return [((event.clientX - box.left) / box.width) * 2 - 1, -(((event.clientY - box.top) / box.height) * 2 - 1)];
}

/**
 * What the visitor does to the room itself: a click on the room around the screen steps back, a click on an object
 * goes to it, and the wheel and the keys do the same. Returns the way to undo it all.
 */
export function listen(host: HTMLElement, handlers: Handlers): () => void {
  const click = (event: MouseEvent): void =>
    handlers.go(clickPlace(handlers.view(), handlers.place(), handlers.under(event)));
  const wheel = (event: WheelEvent): void => {
    const view = handlers.view();
    if (event.deltaY > 0 && (view === 'monitor' || view === 'focus')) {
      handlers.go('room');
    } else if (event.deltaY < 0 && view === 'room') {
      handlers.go('monitor');
    }
  };
  const move = (event: PointerEvent): void => {
    const spot = handlers.view() === 'room' ? handlers.under(event) : null;
    handlers.hover(spot);
    host.style.cursor = spot ? 'pointer' : '';
  };
  const key = (event: KeyboardEvent): void => {
    if (taken(event)) {
      return;
    }
    const view = handlers.view();
    if (event.key === 'Escape') {
      handlers.go(escapePlace(view));
    } else if (event.key === 'Enter') {
      handlers.go(enterPlace(view, handlers.selected()));
    } else if (view === 'room' && ARROWS.includes(event.key)) {
      event.preventDefault();
      handlers.arrow(event.key as Arrow);
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
