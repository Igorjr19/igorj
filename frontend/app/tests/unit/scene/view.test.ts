import { assertEquals } from '@std/assert';
import { roomDistance, viewOf } from '../../../src/lib/scene/view.ts';

Deno.test('the view is the one of the place the camera has arrived at, and moving while it is still on the way', () => {
  assertEquals(viewOf('monitor', true), 'monitor');
  assertEquals(viewOf('room', true), 'room');
  assertEquals(viewOf('focus', true), 'focus');
  assertEquals(viewOf('room', false), 'moving');
});

Deno.test('a narrow window stands the camera further back so the whole desk is in the picture, and a wide one no nearer than the base', () => {
  assertEquals(roomDistance(35, 3) >= 9.2, true);
  assertEquals(roomDistance(35, 0.6) > roomDistance(35, 1.6), true);
});
