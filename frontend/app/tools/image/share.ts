import type { PictureColors } from './colors.ts';
import { atkinson } from './dither.ts';
import { wrapLines } from './text.ts';
import type { Bits, Gray } from './types.ts';

export const SHARE_WIDTH = 1200;
export const SHARE_HEIGHT = 630;
export const SHARE_PORTRAIT = { width: 364, height: 486 } as const;

/** The part of a 2D drawing surface the picture needs, so it can be drawn on a canvas or checked with a stand-in. */
export interface Surface {
  fillStyle: string | object;
  font: string;
  textBaseline: string;
  fillRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { readonly width: number };
}

export interface SharePicture {
  readonly label: string;
  readonly title: string;
  readonly footer: string;
  /** The treated photo, already the size of {@link SHARE_PORTRAIT}; none draws no photo. */
  readonly photo: Gray | null;
}

const LEFT = 72;
const TITLE_ROOM = { width: 680, height: 360 };
const TITLE_SIZE = 58;
const TITLE_GAP = 14;

/** Draws the picture a link preview shows: what the page is, its title, who wrote it, and the dithered photo. */
export function drawShare(surface: Surface, colors: PictureColors, picture: SharePicture): void {
  surface.fillStyle = colors.background;
  surface.fillRect(0, 0, SHARE_WIDTH, SHARE_HEIGHT);
  surface.textBaseline = 'top';
  surface.fillStyle = colors.accent;
  surface.font = '26px "Fira Code"';
  surface.fillText(picture.label, LEFT, 72);
  drawTitle(surface, colors, picture.title);
  surface.fillStyle = colors.text;
  surface.font = '28px "Fira Code"';
  surface.fillText(picture.footer, LEFT, 528);
  if (picture.photo) {
    drawPhoto(surface, colors, picture.photo);
  }
}

function drawTitle(surface: Surface, colors: PictureColors, title: string): void {
  surface.fillStyle = colors.text;
  surface.font = `bold ${TITLE_SIZE}px "Fira Code"`;
  const lines = wrapLines(title, TITLE_ROOM.width, (line) => surface.measureText(line).width);
  const room = Math.floor((TITLE_ROOM.height + TITLE_GAP) / (TITLE_SIZE + TITLE_GAP));
  lines.slice(0, room).forEach((line, index) => {
    surface.fillText(line, LEFT, 150 + index * (TITLE_SIZE + TITLE_GAP));
  });
}

/** The runs of equal dots in one row, as [start, end) pairs of the dots that have the wanted value. */
function runsOf(bits: Bits, y: number, wanted: number): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  for (let x = 0; x <= bits.width; x += 1) {
    const match = x < bits.width && bits.data[y * bits.width + x] === wanted;
    if (match && start < 0) {
      start = x;
    } else if (!match && start >= 0) {
      runs.push([start, x]);
      start = -1;
    }
  }
  return runs;
}

/** Runs of dots of one color, as wide as they go, so a photo takes thousands of rectangles instead of hundreds of thousands. */
function drawPhoto(surface: Surface, colors: PictureColors, photo: Gray): void {
  const bits = atkinson(photo);
  const left = SHARE_WIDTH - LEFT - bits.width;
  for (const [ink, wanted] of [
    [colors.background, 0],
    [colors.accent, 1],
  ] as const) {
    surface.fillStyle = ink;
    for (let y = 0; y < bits.height; y += 1) {
      for (const [start, end] of runsOf(bits, y, wanted)) {
        surface.fillRect(left + start, LEFT + y, end - start, 1);
      }
    }
  }
}
