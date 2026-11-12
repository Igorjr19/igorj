import { assertAlmostEquals, assertEquals } from '@std/assert';
import { brightness, grayscale, sigmoid, unsharpMask } from '../../../tools/image/filters.ts';
import { treatPortrait } from '../../../tools/image/portrait.ts';
import type { Gray } from '../../../tools/image/types.ts';

const row = (...values: number[]): Gray => ({ width: values.length, height: 1, data: Float32Array.from(values) });

Deno.test('grayscale weighs green over red over blue, as the eye does', () => {
  const rgba = { width: 3, height: 1, data: Uint8ClampedArray.from([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]) };
  const [red, green, blue] = grayscale(rgba).data;
  assertEquals((green ?? 0) > (red ?? 0) && (red ?? 0) > (blue ?? 0), true);
  assertAlmostEquals(red ?? 0, 0.299, 1e-6);
});

Deno.test('brightness lifts every value by the percentage and never past white', () => {
  assertEquals(
    Array.from(brightness(row(0, 0.5, 0.95), 12).data).map((v) => Number(v.toFixed(2))),
    [0.12, 0.62, 1],
  );
});

Deno.test('the sigmoid keeps black and white where they are and pushes the middle apart', () => {
  const [black, dark, light, white] = sigmoid(row(0, 0.3, 0.7, 1), 0.45, 5).data;
  assertAlmostEquals(black ?? 1, 0, 1e-6);
  assertAlmostEquals(white ?? 0, 1, 1e-6);
  assertEquals((dark ?? 1) < 0.3 && (light ?? 0) > 0.7, true);
});

Deno.test('unsharp masking raises the contrast of an edge but leaves a flat area alone', () => {
  const edge = unsharpMask(row(0.2, 0.2, 0.2, 0.8, 0.8, 0.8), 1, 1, 0);
  assertEquals((edge.data[2] ?? 1) < 0.2 && (edge.data[3] ?? 0) > 0.8, true);
  assertAlmostEquals(unsharpMask(row(0.5, 0.5, 0.5, 0.5), 1, 1, 0).data[1] ?? 0, 0.5, 1e-6);
});

Deno.test('the portrait treatment turns a light wall to clean white so the dither leaves no dots there', () => {
  const wall = treatPortrait({ width: 8, height: 8, data: new Float32Array(64).fill(0.75) });
  assertEquals(
    wall.data.every((value) => value > 0.9),
    true,
  );
});
