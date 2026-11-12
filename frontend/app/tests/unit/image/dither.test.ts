import { assertEquals } from '@std/assert';
import { atkinson, floydSteinberg, invert } from '../../../tools/image/dither.ts';
import type { Gray } from '../../../tools/image/types.ts';

const flat = (width: number, height: number, value: number): Gray => ({
  width,
  height,
  data: new Float32Array(width * height).fill(value),
});

const count = (bits: Uint8Array): number => bits.reduce((sum, bit) => sum + bit, 0);

Deno.test('pure black and pure white stay clean in both dithers, so a clean background has no stray dots', () => {
  for (const dither of [atkinson, floydSteinberg]) {
    assertEquals(count(dither(flat(16, 16, 0)).data), 0);
    assertEquals(count(dither(flat(16, 16, 1)).data), 256);
  }
});

Deno.test('a mid gray comes out about half bright with Floyd-Steinberg, which spreads all of the error', () => {
  const lit = count(floydSteinberg(flat(64, 64, 0.5)).data);
  assertEquals(Math.abs(lit - 2048) < 100, true, `lit ${lit}`);
});

Deno.test('Atkinson drops a quarter of the error, so shadows go fully dark and highlights fully bright', () => {
  assertEquals(count(atkinson(flat(64, 64, 0.1)).data) < count(floydSteinberg(flat(64, 64, 0.1)).data), true);
  assertEquals(count(atkinson(flat(64, 64, 0.9)).data) > count(floydSteinberg(flat(64, 64, 0.9)).data), true);
});

Deno.test('inverting swaps every dot, which is how the mask for dark ink is made', () => {
  const bits = atkinson(flat(8, 8, 0.3));
  assertEquals(count(invert(bits).data), 64 - count(bits.data));
});
