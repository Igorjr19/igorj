import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { proceduralGray } from '../../../tools/image/pattern.ts';

Deno.test('the same title grows the same picture on every build, so a card never changes between deploys', () => {
  assertEquals(proceduralGray('AutoDep', 48, 27).data, proceduralGray('AutoDep', 48, 27).data);
});

Deno.test('different titles grow different pictures, so the cards of a grid are told apart', () => {
  assertNotEquals(proceduralGray('AutoDep', 48, 27).data, proceduralGray('go-shorty', 48, 27).data);
});

Deno.test('the picture has the size asked, and every value is a brightness from 0 to 1', () => {
  const { width, height, data } = proceduralGray('Me formei', 40, 20);
  assertEquals([width, height, data.length], [40, 20, 800]);
  assert(data.every((value) => value >= 0 && value <= 1));
});

Deno.test('the picture has both dark and light areas, so the dots are neither empty nor solid', () => {
  const { data } = proceduralGray('Sarampo e cobertura vacinal', 96, 54);
  assert(data.some((value) => value < 0.3));
  assert(data.some((value) => value > 0.7));
});
