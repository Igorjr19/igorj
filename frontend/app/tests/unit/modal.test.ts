import { assertEquals } from '@std/assert';
import { isOutside } from '../../src/lib/modal.ts';

const box = { left: 10, right: 110, top: 20, bottom: 70 };

Deno.test('a point inside the box, edges included, is not outside, so a click on the padding of a modal keeps it open', () => {
  assertEquals(isOutside(box, 50, 40), false);
  assertEquals(isOutside(box, 10, 20), false);
  assertEquals(isOutside(box, 110, 70), false);
});

Deno.test('a point beyond any edge is outside, so a click on the backdrop closes the modal', () => {
  assertEquals(isOutside(box, 9, 40), true);
  assertEquals(isOutside(box, 111, 40), true);
  assertEquals(isOutside(box, 50, 19), true);
  assertEquals(isOutside(box, 50, 71), true);
});
