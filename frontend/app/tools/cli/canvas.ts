import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import type { Bits, Rgba } from '../image/types.ts';
import { webKind, webSize } from '../image/web.ts';

export type { SKRSContext2D as Context } from '@napi-rs/canvas';

export function registerFonts(directory: string): void {
  for (const file of ['FiraCode-Regular.ttf', 'FiraCode-Bold.ttf']) {
    GlobalFonts.registerFromPath(`${directory}/${file}`, 'Fira Code');
  }
}

export interface Fit {
  readonly width: number;
  readonly height: number;
}

/** Reads an image and scales it to `width` wide, or to cover `fit` and crops around the centre. */
export async function readRgba(path: string, size: { width: number } | { fit: Fit }): Promise<Rgba> {
  const image = await loadImage(path);
  const target =
    'fit' in size ? size.fit : { width: size.width, height: Math.round((image.height * size.width) / image.width) };
  const scale =
    'fit' in size ? Math.max(target.width / image.width, target.height / image.height) : target.width / image.width;
  const canvas = createCanvas(target.width, target.height);
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  const drawn = { width: image.width * scale, height: image.height * scale };
  context.drawImage(
    image,
    (target.width - drawn.width) / 2,
    (target.height - drawn.height) / 2,
    drawn.width,
    drawn.height,
  );
  const { data } = context.getImageData(0, 0, target.width, target.height);
  return { width: target.width, height: target.height, data };
}

/** The image drawn at most `maxWidth` wide, as bytes in its own kind of file; none when it is already no wider. */
export async function resized(
  path: string,
  maxWidth: number,
  quality: number,
): Promise<{ readonly bytes: Uint8Array; readonly extension: 'jpg' | 'png' } | null> {
  const image = await loadImage(path);
  const size = webSize(image.width, image.height, maxWidth);
  if (!size) {
    return null;
  }
  const canvas = createCanvas(size.width, size.height);
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, size.width, size.height);
  const extension = webKind(path);
  return {
    bytes: extension === 'png' ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg', quality),
    extension,
  };
}

/** A PNG that is opaque where the bit is set and transparent elsewhere: the mask the page paints with the theme's ink.
 * The shape is in the alpha channel, so it works in every browser; luminance masks do not work in Safari. */
export function maskPng(bits: Bits): Uint8Array {
  const canvas = createCanvas(bits.width, bits.height);
  const context = canvas.getContext('2d');
  const image = context.createImageData(bits.width, bits.height);
  bits.data.forEach((bit, index) => {
    image.data.set([255, 255, 255, bit ? 255 : 0], index * 4);
  });
  context.putImageData(image, 0, 0);
  return canvas.toBuffer('image/png');
}

export function drawingOf(width: number, height: number) {
  const canvas = createCanvas(width, height);
  return {
    context: canvas.getContext('2d'),
    png: () => canvas.toBuffer('image/png'),
    jpeg: (quality: number) => canvas.toBuffer('image/jpeg', quality),
  };
}
