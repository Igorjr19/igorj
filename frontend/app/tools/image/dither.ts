import type { Bits, Gray } from './types.ts';

/** Where a pixel's error goes: the offset of each neighbour and its share of the error. */
type Diffusion = readonly (readonly [dx: number, dy: number, share: number])[];

const ATKINSON: Diffusion = [
  [1, 0, 1 / 8],
  [2, 0, 1 / 8],
  [-1, 1, 1 / 8],
  [0, 1, 1 / 8],
  [1, 1, 1 / 8],
  [0, 2, 1 / 8],
];

const FLOYD_STEINBERG: Diffusion = [
  [1, 0, 7 / 16],
  [-1, 1, 3 / 16],
  [0, 1, 5 / 16],
  [1, 1, 1 / 16],
];

function spread(
  work: Float32Array,
  size: { width: number; height: number },
  at: [number, number],
  error: number,
  matrix: Diffusion,
): void {
  for (const [dx, dy, share] of matrix) {
    const nx = at[0] + dx;
    const ny = at[1] + dy;
    if (nx >= 0 && nx < size.width && ny < size.height) {
      const index = ny * size.width + nx;
      work[index] = (work[index] ?? 0) + error * share;
    }
  }
}

function diffuse(image: Gray, matrix: Diffusion): Bits {
  const { width, height } = image;
  const work = Float32Array.from(image.data);
  const bits = new Uint8Array(work.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = work[y * width + x] ?? 0;
      const bright = value >= 0.5 ? 1 : 0;
      bits[y * width + x] = bright;
      spread(work, image, [x, y], value - bright, matrix);
    }
  }
  return { width, height, data: bits };
}

/** Atkinson spreads only three quarters of the error, so highlights and shadows stay clean: a face keeps its lines. */
export const atkinson = (image: Gray): Bits => diffuse(image, ATKINSON);

export const floydSteinberg = (image: Gray): Bits => diffuse(image, FLOYD_STEINBERG);

export function invert(bits: Bits): Bits {
  return { ...bits, data: bits.data.map((bit) => 1 - bit) };
}
