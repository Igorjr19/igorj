import type { Gray } from './types.ts';

/** A number from a text, always the same for the same text, so a title always grows the same picture. */
function hashOf(text: string): number {
  let hash = 2166136261;
  for (const char of text) {
    hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), 16777619);
  }
  return hash >>> 0;
}

/** A small, fast source of numbers from 0 to 1 for a seed, the same sequence every time. */
function randomOf(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Random values on a lattice, read between its points with an eased blend, so the picture flows instead of jumping. */
function lattice(random: () => number, columns: number, rows: number): (x: number, y: number) => number {
  const points = Array.from({ length: (columns + 1) * (rows + 1) }, random);
  const at = (column: number, row: number): number => points[row * (columns + 1) + column] ?? 0;
  return (x, y) => {
    const fx = x * columns;
    const fy = y * rows;
    const column = Math.min(columns - 1, Math.floor(fx));
    const row = Math.min(rows - 1, Math.floor(fy));
    const u = smooth(fx - column);
    const v = smooth(fy - row);
    const top = at(column, row) * (1 - u) + at(column + 1, row) * u;
    const bottom = at(column, row + 1) * (1 - u) + at(column + 1, row + 1) * u;
    return top * (1 - v) + bottom * v;
  };
}

/**
 * A picture grown from a title: soft blobs of light and dark, the same for the same title on every build, to stand
 * where a picture would. Values run from 0 to 1, ready for dithering.
 */
export function proceduralGray(title: string, width: number, height: number): Gray {
  const random = randomOf(hashOf(title));
  const broad = lattice(random, 5, 3);
  const fine = lattice(random, 11, 6);
  const data = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = broad(x / width, y / height) * 0.7 + fine(x / width, y / height) * 0.3;
      data[y * width + x] = Math.min(1, Math.max(0, (value - 0.5) * 1.6 + 0.5));
    }
  }
  return { width, height, data };
}
