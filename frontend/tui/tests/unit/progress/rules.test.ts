import { assertEquals } from '@std/assert';
import { readPercent } from '../../../assets/ts/progress/rules.ts';

Deno.test('readPercent is the share of the scrollable distance already passed', () => {
  assertEquals(readPercent(0, 2000, 1000), 0);
  assertEquals(readPercent(250, 2000, 1000), 25);
  assertEquals(readPercent(1000, 2000, 1000), 100);
});

Deno.test('readPercent counts a page that fits the window as fully read, instead of dividing by zero', () => {
  assertEquals(readPercent(0, 800, 1000), 100);
  assertEquals(readPercent(0, 1000, 1000), 100);
});

Deno.test('readPercent stays within 0 and 100 when the browser overscrolls', () => {
  assertEquals(readPercent(-40, 2000, 1000), 0);
  assertEquals(readPercent(1300, 2000, 1000), 100);
});
