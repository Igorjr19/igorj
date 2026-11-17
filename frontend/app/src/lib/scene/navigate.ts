import type { Place } from './flight.ts';
import type { SpotName } from './kit.ts';
import { type Anchor, type Arrow, neighbour } from './neighbour.ts';
import type { View } from './view.ts';

/** What each object does when it is chosen: the monitor takes the visitor in, the window needs no trip, the rest are looked at close. */
export function placeOf(spot: SpotName): Place | null {
  return spot === 'window' ? null : spot;
}

/** A click: on the room around the screen it steps back; on an object it goes there; on bare room, from close up, it steps back. */
export function clickPlace(view: View, current: Place, under: SpotName | null): Place | null {
  if (view === 'monitor') {
    return 'room';
  }
  if (view === 'moving') {
    return null;
  }
  if (under === null) {
    return view === 'focus' ? 'room' : null;
  }
  const next = placeOf(under);
  return next === current ? null : next;
}

/** Escape goes back one step: from the monitor or from close up to the room, and from the room nowhere. */
export function escapePlace(view: View): Place | null {
  return view === 'monitor' || view === 'focus' ? 'room' : null;
}

/** Enter goes to what is chosen, from the room, and back in to the monitor when nothing is. */
export function enterPlace(view: View, selected: SpotName | null): Place | null {
  if (view !== 'room') {
    return null;
  }
  return selected ? placeOf(selected) : 'monitor';
}

/** An arrow chooses the next object in its direction, from the one chosen or, with none, the monitor. */
export function arrowSpot(
  selected: SpotName | null,
  anchors: Readonly<Record<string, Anchor>>,
  arrow: Arrow,
): SpotName | null {
  if (selected === null) {
    return 'monitor';
  }
  return (neighbour(selected, anchors, arrow) as SpotName | null) ?? selected;
}
