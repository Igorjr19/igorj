import { assert, assertAlmostEquals, assertEquals } from '@std/assert';
import {
  advance,
  bodyAt,
  isTurning,
  nightness,
  PHASE_PER_SECOND,
  sunlight,
  targetPhase,
} from '../../../src/lib/scene/cycle.ts';

Deno.test('from noon the dark theme aims at the next midnight and the light one stays at noon', () => {
  assertEquals(targetPhase(0, 'dark'), 0.5);
  assertEquals(targetPhase(0, 'light'), 0);
});

Deno.test('from midnight the light theme aims at the next noon, a whole turn on, and never back', () => {
  assertEquals(targetPhase(0.5, 'light'), 1);
  assertEquals(targetPhase(0.5, 'dark'), 0.5);
  assertEquals(targetPhase(1, 'dark'), 1.5);
});

Deno.test('a choice made while the hours are turning aims at the next one ahead, so the phase never runs back', () => {
  assertEquals(targetPhase(0.3, 'light'), 1);
  assertEquals(targetPhase(0.8, 'dark'), 1.5);
});

Deno.test('the phase moves toward its target at a fixed pace, stops on it, and says it is turning only until then', () => {
  assertAlmostEquals(advance(0, 0.5, 1), PHASE_PER_SECOND);
  assertEquals(advance(0.45, 0.5, 5), 0.5);
  assert(isTurning(0.2, 0.5));
  assert(!isTurning(0.5, 0.5));
});

Deno.test('half a cycle takes two and a half seconds', () => {
  assertAlmostEquals(0.5 / PHASE_PER_SECOND, 2.5);
});

Deno.test('daylight is full at noon, none at dusk and dawn and reversed at midnight', () => {
  assertAlmostEquals(sunlight(0), 1);
  assertAlmostEquals(sunlight(0.25), 0, 1e-9);
  assertAlmostEquals(sunlight(0.5), -1);
  assertAlmostEquals(nightness(0), 0);
  assertAlmostEquals(nightness(0.5), 1);
});

Deno.test('the sun is up and in sight at noon and gone at midnight, when the moon takes its place', () => {
  assert(bodyAt(0).visible);
  assert(!bodyAt(0.5).visible);
  assert(bodyAt(0.5, 0.5).visible);
  assert(!bodyAt(0, 0.5).visible);
});

Deno.test('the sun goes down to the left and the same way every day, whatever the number of the day', () => {
  assert(bodyAt(0.1).x < bodyAt(0).x);
  assert(bodyAt(0.2).x < bodyAt(0.1).x);
  assertAlmostEquals(bodyAt(3.1).x, bodyAt(0.1).x);
  assert(bodyAt(0.2).y > bodyAt(0.1).y);
});
