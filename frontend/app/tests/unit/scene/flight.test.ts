import { assert, assertAlmostEquals, assertEquals } from '@std/assert';
import { advanceFlight, isFocus, type Pose, poseAt, poseOf, type Stage } from '../../../src/lib/scene/flight.ts';
import { TRIP_SECONDS } from '../../../src/lib/scene/view.ts';

const stage: Stage = { rest: 3, fov: 35, aspect: 1.6, screen: [0, 1.35, 0] };

Deno.test('at rest the camera stands in front of the screen, looking at it, and the room is seen from further back', () => {
  const monitor = poseOf('monitor', stage);
  assertEquals(monitor.target, [0, 1.35, 0]);
  assertEquals(monitor.position, [0, 1.35, 3]);
  assert(poseOf('room', stage).position[2] > monitor.position[2]);
});

Deno.test('each object has its own close view, in front of it', () => {
  for (const place of ['music', 'books', 'posters', 'plant'] as const) {
    const pose = poseOf(place, stage);
    assert(isFocus(place));
    assertEquals(pose.position.length, 3);
    assert(pose.position[2] !== pose.target[2]);
  }
  assert(!isFocus('monitor'));
  assert(!isFocus('room'));
});

Deno.test('a flight starts where it began, ends where it goes, and takes the same time wherever it goes', () => {
  const from: Pose = { position: [0, 0, 10], target: [0, 0, 0] };
  const to: Pose = { position: [4, 2, 2], target: [1, 1, 1] };
  assertEquals(poseAt({ from, to, progress: 0 }), from);
  assertEquals(poseAt({ from, to, progress: 1 }), to);
  const half = advanceFlight({ from, to, progress: 0 }, TRIP_SECONDS / 2);
  assertAlmostEquals(half.progress, 0.5);
  assertAlmostEquals(poseAt(half).position[0], 2);
  assertEquals(advanceFlight(half, 5).progress, 1);
});
