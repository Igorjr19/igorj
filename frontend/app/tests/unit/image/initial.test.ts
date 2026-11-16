import { assertEquals } from '@std/assert';
import { initialOf } from '../../../tools/image/initial.ts';

Deno.test('the initial is the first letter in capitals, accents kept, ignoring marks before it', () => {
  assertEquals(initialOf('autodep'), 'A');
  assertEquals(initialOf('Ígor'), 'Í');
  assertEquals(initialOf('“Quoted” title'), 'Q');
});

Deno.test('a title that starts with a digit uses the digit, and one with no letter at all gets a dot', () => {
  assertEquals(initialOf('2026 plan'), '2');
  assertEquals(initialOf('—'), '·');
});
