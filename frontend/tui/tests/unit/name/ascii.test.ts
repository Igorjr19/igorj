import { assert, assertEquals } from '@std/assert';
import {
  coverage,
  lensed,
  lensRadius,
  nameLines,
  RAMP,
  render,
  scrambled,
  sweepLens,
} from '../../../assets/ts/name/ascii.ts';

Deno.test('coverage averages the alpha of each cell, so a cell half covered by the name reads 0.5', () => {
  // A 2x1 grid of 2x2 cells: the first is fully drawn, the second only in its top row.
  const alpha = [255, 255, 255, 0, 255, 255, 0, 0];
  const cells = coverage(alpha, 4, 2, 1, 2, 2);
  assertEquals([...cells], [1, 0.25]);
});

Deno.test('render draws one line per row, with no trailing space, and a full cell with the heaviest character', () => {
  const cells = new Float32Array([1, 0, 1, 0, 0, 0]);
  assertEquals(render(cells, 3, 2).split('\n'), [`${RAMP.at(-1)} ${RAMP.at(-1)}`, '']);
});

Deno.test('render keeps the letters in the dense half of the ramp, so the name reads as solid shapes', () => {
  const dense = RAMP.slice(Math.floor(RAMP.length * 0.45));
  for (const char of render(new Float32Array([0.1, 0.4, 0.7, 1]), 4, 1)) {
    assert(dense.includes(char), `"${char}"`);
  }
});

Deno.test('render leaves the space around the name blank, so nothing moves or speckles around the letters', () => {
  assertEquals(render(new Float32Array([0, 0.05, 0]), 3, 1), '');
});

Deno.test('nameLines puts a long name on two lines and leaves a short one alone', () => {
  assertEquals(nameLines('Ígor José Rodrigues'), ['Ígor José', 'Rodrigues']);
  assertEquals(nameLines('Fixture Author'), ['Fixture Author']);
});

const GRID = { cols: 30, rows: 3, cells: new Float32Array(90).fill(0.3), aspect: 2 };

Deno.test('lensed makes the cells under the pointer denser and leaves the far ones alone', () => {
  const cells = lensed(GRID, { col: 2, row: 1 });
  const at = (col: number, row: number) => cells[row * GRID.cols + col] ?? 0;
  assert(at(2, 1) > at(5, 1), 'denser at the pointer than beside it');
  assert(at(5, 1) > (GRID.cells[0] ?? 0), 'still denser within the lens');
  assertEquals(at(2 + lensRadius(GRID), 1), GRID.cells[0]);
  assertEquals(at(29, 1), GRID.cells[0]);
});

Deno.test('lensed keeps blank cells blank, so the space around the name stays clear', () => {
  const blank = { ...GRID, cells: new Float32Array(90) };
  assertEquals([...lensed(blank, { col: 2, row: 1 })], [...blank.cells]);
});

Deno.test('scrambled only touches characters near the pointer, and never the spaces', () => {
  const text = ['#'.repeat(30), '#  '.repeat(10), '#'.repeat(30)].join('\n');
  const always = () => 0;
  const lines = scrambled(text, GRID, { col: 2, row: 1 }, always).split('\n');
  assertEquals(lines[1]?.[0], RAMP[4]);
  assertEquals(lines[1]?.slice(1, 3), '  ');
  assertEquals(lines[0]?.slice(20), '#'.repeat(10));
});

Deno.test('sweepLens crosses the whole name along its middle, starting and ending out of sight', () => {
  const grid = { cols: 100, rows: 9, cells: new Float32Array(900), aspect: 2 };
  const radius = lensRadius(grid);
  assertEquals(sweepLens(grid, 0), { col: -radius, row: 4 });
  assertEquals(sweepLens(grid, 1), { col: 100 + radius, row: 4 });
  assertEquals(sweepLens(grid, 0.5).col, 50);
});
