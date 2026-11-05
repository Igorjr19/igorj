/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { findAccessibilityViolations } from './support/axe.ts';
import {
  CREDITS_EN,
  CV_EN,
  HOME_EN,
  HOME_PT,
  NOT_FOUND_EN,
  POST_EN,
  POSTS_EN,
  RESEARCH_EN,
  RESEARCH_ITEM_EN,
} from './support/paths.ts';
import { Session } from './support/session.ts';

Deno.test('pages meet WCAG 2.1 AA in both color schemes', async (t) => {
  await using session = await Session.start();

  for (const colorScheme of ['light', 'dark'] as const) {
    for (const path of [
      HOME_EN,
      HOME_PT,
      POST_EN,
      POSTS_EN,
      NOT_FOUND_EN,
      CV_EN,
      RESEARCH_EN,
      RESEARCH_ITEM_EN,
      CREDITS_EN,
    ]) {
      await t.step(`${path} (${colorScheme})`, async () => {
        const page = await session.open(path, { colorScheme });
        assertEquals(await findAccessibilityViolations(page), []);
      });
    }
  }
});
