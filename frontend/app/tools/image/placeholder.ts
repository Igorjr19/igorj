import type { Gray } from './types.ts';

/** A small deterministic hash of a text, so the same item always gets the same picture. */
export function hashOf(text: string): number {
  let hash = 2166136261;
  for (const char of text) {
    hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), 16777619) >>> 0;
  }
  return hash;
}

/** A pseudo-random number from 0 to 1 for the nth value drawn from a hash. */
function drawn(hash: number, n: number): number {
  const mixed = Math.imul(hash ^ Math.imul(n + 1, 0x9e3779b1), 0x85ebca6b) >>> 0;
  return ((mixed ^ (mixed >>> 13)) >>> 0) / 4294967295;
}

/**
 * A soft pattern of waves made from a text, for an item that has no picture: dithered like every other picture, it
 * reads as the site's own texture. Values run from 0 to 1.
 */
export function placeholderGray(seed: string, width: number, height: number): Gray {
  const hash = hashOf(seed);
  const waves = Array.from({ length: 3 }, (_, n) => ({
    fx: (drawn(hash, n * 4) - 0.5) * 0.09,
    fy: (drawn(hash, n * 4 + 1) - 0.5) * 0.09,
    phase: drawn(hash, n * 4 + 2) * Math.PI * 2,
    weight: 0.6 + drawn(hash, n * 4 + 3) * 0.4,
  }));
  const total = waves.reduce((sum, wave) => sum + wave.weight, 0);
  const data = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (const wave of waves) {
        sum += wave.weight * Math.sin(x * wave.fx + y * wave.fy + wave.phase + Math.sin(y * wave.fy * 1.7) * 1.5);
      }
      data[y * width + x] = 0.5 + (0.42 * sum) / total;
    }
  }
  return { width, height, data };
}
