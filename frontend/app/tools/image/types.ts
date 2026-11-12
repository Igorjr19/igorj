/** One channel of an image, row by row, each value from 0 (black) to 1 (white). */
export interface Gray {
  readonly width: number;
  readonly height: number;
  readonly data: Float32Array;
}

/** A dithered image: one entry per pixel, 1 where the pixel is bright. */
export interface Bits {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
}

export interface Rgba {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}
