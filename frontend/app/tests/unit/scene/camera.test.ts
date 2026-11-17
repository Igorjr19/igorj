import { assertAlmostEquals, assertEquals } from '@std/assert';
import { ease, fitDistance } from '../../../src/lib/scene/camera.ts';

Deno.test('in a view wider than the screen the height decides the distance, and in a narrower one the width does', () => {
  const tangent = Math.tan((40 * Math.PI) / 360);
  assertAlmostEquals(fitDistance(40, 3, 1.6, 1, 0.8), 1 / 0.8 / (2 * tangent), 1e-9);
  assertAlmostEquals(fitDistance(40, 0.5, 1.6, 1, 0.8), 1.6 / 0.8 / (2 * tangent * 0.5), 1e-9);
});

Deno.test('the ease starts and ends at rest and stays inside its range', () => {
  assertEquals([ease(-1), ease(0), ease(0.5), ease(1), ease(2)], [0, 0, 0.5, 1, 1]);
});
