import { assertAlmostEquals, assertEquals } from '@std/assert';
import { roomDistance, step, TRIP_SECONDS, viewOf } from '../../../src/lib/scene/view.ts';

Deno.test('a trip to the monitor or back to the room takes the same time and stops on arrival', () => {
  assertAlmostEquals(step(0, 1, TRIP_SECONDS / 2), 0.5);
  assertEquals(step(0.9, 1, 5), 1);
  assertAlmostEquals(step(1, 0, TRIP_SECONDS / 4), 0.75);
  assertEquals(step(0.1, 0, 5), 0);
});

Deno.test('the view is the monitor or the room only once the camera has arrived, and moving in between', () => {
  assertEquals(viewOf(1, 1), 'monitor');
  assertEquals(viewOf(0, 0), 'room');
  assertEquals(viewOf(0.4, 1), 'moving');
  assertEquals(viewOf(0.4, 0), 'moving');
});

Deno.test('a narrow window stands the camera further back so the whole desk is in the picture, and a wide one no nearer than the base', () => {
  assertEquals(roomDistance(35, 3) >= 9.2, true);
  assertEquals(roomDistance(35, 0.6) > roomDistance(35, 1.6), true);
});
