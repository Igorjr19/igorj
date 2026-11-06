import { assert, assertEquals } from '@std/assert';
import { coverage, nameLines, RAMP, render } from '../../../assets/ts/name/ascii.ts';

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
