import { assert, assertEquals } from '@std/assert';
import { coverage, frame, nameLines, RAMP } from '../../../assets/ts/name/ascii.ts';

Deno.test('coverage averages the alpha of each cell, so a cell half covered by the name reads 0.5', () => {
  // A 2x1 grid of 2x2 cells: the first is fully drawn, the second only in its top row.
  const alpha = [255, 255, 255, 0, 255, 255, 0, 0];
  const cells = coverage(alpha, 4, 2, 1, 2, 2);
  assertEquals([...cells], [1, 0.25]);
});

Deno.test('frame draws one line per row with one character per column', () => {
  const text = frame(new Float32Array(12), 4, 3, 0);
  assertEquals(
    text.split('\n').map((line) => line.length),
    [4, 4, 4],
  );
});

Deno.test('frame keeps the letters in the dense half of the ramp at any moment, so the name stays readable while it moves', () => {
  const dense = RAMP.slice(Math.floor(RAMP.length * 0.45));
  for (const t of [0, 1.7, 9.3]) {
    for (const char of frame(new Float32Array(20).fill(1), 5, 4, t)) {
      assert(char === '\n' || dense.includes(char), `"${char}" at t=${t}`);
    }
  }
});

Deno.test('frame leaves the space around the name light, so the letters stand out', () => {
  const light = RAMP.slice(0, 4);
  for (const char of frame(new Float32Array(400), 20, 20, 2.5).replaceAll('\n', '')) {
    assert(light.includes(char) || char === RAMP[4] || char === RAMP[5], `"${char}"`);
  }
});

Deno.test('nameLines puts a long name on two lines and leaves a short one alone', () => {
  assertEquals(nameLines('Ígor José Rodrigues'), ['Ígor José', 'Rodrigues']);
  assertEquals(nameLines('Fixture Author'), ['Fixture Author']);
});
