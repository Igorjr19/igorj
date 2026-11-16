import { assertEquals, assertNotEquals } from '@std/assert';
import { population, seeded, step } from '../../../src/lib/lab/life.ts';

Deno.test('a blinker flips between a row and a column, because a cell with two neighbours stays and one with three is born', () => {
  const start = { cols: 5, rows: 5, cells: new Uint8Array(25) };
  for (const at of [11, 12, 13]) {
    start.cells[at] = 1;
  }
  const next = step(start);
  assertEquals(
    [...next.cells.keys()].filter((at) => next.cells[at] === 1),
    [7, 12, 17],
  );
  assertEquals(step(next).cells, start.cells);
});

Deno.test('the edges wrap around, so a lone line across the border keeps its shape', () => {
  const grid = { cols: 4, rows: 4, cells: new Uint8Array(16) };
  for (const at of [3, 0, 1]) {
    grid.cells[at] = 1;
  }
  assertEquals(population(step(grid)), 3);
});

Deno.test('the same seed gives the same pattern and another seed another one', () => {
  assertEquals(seeded(20, 20, 7).cells, seeded(20, 20, 7).cells);
  assertNotEquals(seeded(20, 20, 7).cells, seeded(20, 20, 8).cells);
});
