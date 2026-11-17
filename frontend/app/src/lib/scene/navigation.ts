import { type Flight, isFocus, type Place, poseOf } from './flight.ts';
import { type Handlers, pointerOnScreen } from './interaction.ts';
import { GLOW, INK, type SpotName } from './kit.ts';
import { arrowSpot, placeOf } from './navigate.ts';
import { type Run, stageOf, viewNow } from './run.ts';

function setView(run: Run): void {
  const view = viewNow(run);
  document.documentElement.dataset['view'] = view;
  run.overlay.reachable(view === 'room');
}

/** Lights the outline of the object pointed at and of the one chosen. */
function glow(run: Run): void {
  for (const spot of run.room.spots) {
    const on = spot.name === run.hovered || spot.name === run.selected;
    for (const outline of spot.outlines) {
      outline.color.set(on ? GLOW : INK);
    }
  }
  run.dirty = true;
}

/** Puts the marks where the objects are, and the name of the one pointed at over it. */
export function refreshMarks(run: Run): void {
  const marks = run.room.marks();
  run.overlay.marks(marks, viewNow(run) === 'room');
  run.overlay.hover(viewNow(run) === 'room' ? (marks.find((mark) => mark.name === run.hovered) ?? null) : null);
}

/** Sends the camera to a place, from where it is now. */
export function go(run: Run, place: Place | null): void {
  if (!run.landed || run.flight || place === null || place === run.place) {
    return;
  }
  const stage = stageOf(run);
  const flight: Flight = { from: poseOf(run.place, stage), to: poseOf(place, stage), progress: 0 };
  run.flight = flight;
  run.place = place;
  run.hovered = null;
  run.overlay.caption(null);
  glow(run);
  setView(run);
  refreshMarks(run);
}

/** The camera has arrived: the view is the one of its place, and what is there is said. */
export function arrive(run: Run): void {
  run.flight = null;
  setView(run);
  if (isFocus(run.place)) {
    run.overlay.caption(run.place);
  } else {
    run.overlay.caption(run.place === 'room' ? run.selected : null);
  }
  refreshMarks(run);
  run.dirty = true;
}

export function select(run: Run, spot: SpotName | null): void {
  run.selected = spot;
  run.overlay.caption(viewNow(run) === 'room' ? spot : null);
  glow(run);
}

/** The objects as buttons: choosing one goes to it, as Enter does after the arrows. */
export function pick(run: Run, spot: SpotName): void {
  select(run, spot);
  go(run, placeOf(spot));
}

export function handlersOf(run: Run): Handlers {
  return {
    view: () => viewNow(run),
    place: () => run.place,
    selected: () => run.selected,
    under: (event) => run.room.spotAt(...pointerOnScreen(event, run.host)),
    go: (place) => go(run, place),
    hover(spot) {
      if (spot !== run.hovered) {
        run.hovered = spot;
        glow(run);
        refreshMarks(run);
      }
    },
    arrow: (arrow) => select(run, arrowSpot(run.selected, run.room.anchors(), arrow)),
  };
}
