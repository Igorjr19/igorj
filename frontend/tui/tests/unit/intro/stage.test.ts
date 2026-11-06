import { assertEquals } from '@std/assert';
import { forming, introStage, SESSION_GAP } from '../../../assets/ts/intro/stage.ts';

const NOW = 1_000_000_000;

Deno.test('introStage plays the full opening once, the short one after a long absence, and none in between', () => {
  assertEquals(
    [
      introStage(null, NOW, false),
      introStage('not a time', NOW, false),
      introStage(String(NOW - SESSION_GAP - 1), NOW, false),
      introStage(String(NOW - 60_000), NOW, false),
    ],
    ['full', 'full', 'short', null],
  );
});

Deno.test('introStage plays nothing when motion is reduced, even on the first visit', () => {
  assertEquals([introStage(null, NOW, true), introStage('0', NOW, true)], [null, null]);
});

Deno.test('forming settles the name from the left, with noise ahead and blank beyond', () => {
  const name = '##########\n##  ######';
  assertEquals(
    forming(name, 0, () => '?'),
    '\n',
  );
  assertEquals(
    forming(name, 0.5, () => '?'),
    '####??\n##  ??',
  );
  assertEquals(
    forming(name, 1, () => '?'),
    name,
  );
});
