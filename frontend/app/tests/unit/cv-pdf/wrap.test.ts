import { assertEquals } from '@std/assert';
import type { Measure } from '../../../tools/cv-pdf/types.ts';
import { wrapText } from '../../../tools/cv-pdf/wrap.ts';

/** Every character is five points wide, so a line of ten characters is fifty. */
const measure: Measure = (text) => text.length * 5;

Deno.test('a text breaks at spaces so no line is wider than the room', () => {
  assertEquals(wrapText('one two three four five', 50, measure, 'regular', 10), ['one two', 'three four', 'five']);
});

Deno.test('a word wider than the room stands alone on a line instead of being cut', () => {
  assertEquals(wrapText('a extraordinarily b', 40, measure, 'regular', 10), ['a', 'extraordinarily', 'b']);
});

Deno.test('the first line makes room for what stands before it', () => {
  assertEquals(wrapText('one two three', 50, measure, 'regular', 10, 20), ['one', 'two three']);
  assertEquals(wrapText('one two three', 50, measure, 'regular', 10, 0), ['one two', 'three']);
});

Deno.test('a text with no words has no lines', () => {
  assertEquals(wrapText('   ', 50, measure, 'regular', 10), []);
});
