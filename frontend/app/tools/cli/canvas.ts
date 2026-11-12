import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import type { Bits, Rgba } from '../image/types.ts';

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

/** A PNG with white where the bit is set and black elsewhere: the mask the page paints with the theme's ink. */
export function maskPng(bits: Bits): Uint8Array {
  const canvas = createCanvas(bits.width, bits.height);
  const context = canvas.getContext('2d');
  const image = context.createImageData(bits.width, bits.height);
  bits.data.forEach((bit, index) => {
    const value = bit ? 255 : 0;
    image.data.set([value, value, value, 255], index * 4);
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
