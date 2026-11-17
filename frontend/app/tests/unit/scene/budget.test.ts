import { assertEquals } from '@std/assert';
import { judge, SAMPLE_SIZE } from '../../../src/lib/scene/budget.ts';

const frames = (milliseconds: number, count = SAMPLE_SIZE): number[] =>
  Array.from({ length: count }, () => milliseconds);

Deno.test('a room that runs smoothly keeps its level', () => {
  assertEquals(judge('full', frames(16)), 'full');
});

Deno.test('a slow room steps down one level at a time, and the simple site is the last', () => {
  assertEquals(judge('full', frames(60)), 'reduced');
  assertEquals(judge('reduced', frames(60)), 'simple');
  assertEquals(judge('simple', frames(60)), 'simple');
});

Deno.test('too few frames are not enough to judge, so a stall while textures load does not cost the room its shadows', () => {
  assertEquals(judge('full', frames(500, SAMPLE_SIZE - 1)), 'full');
});

Deno.test('only the latest frames count, so an early stall is forgotten once the room runs well', () => {
  assertEquals(judge('full', [...frames(500, 20), ...frames(16)]), 'full');
});
