/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { HOME_EN, HOME_PT } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

const ageLines = () =>
  ['listening', 'watched'].map((id) =>
    [...(document.getElementById(id)?.querySelectorAll('.panel__meta') ?? [])]
      .map((line) => line.textContent?.trim() ?? '')
      .filter((line) => /\d{4}-\d{2}-\d{2}/.test(line)),
  );

Deno.test('music and film data a week old or more says when it was saved', async (t) => {
  await using session = await Session.start();

  // The fixture data was saved on 2026-01-01, long before any build.
  await t.step('in English', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, javascript: false });
    assertEquals(await page.evaluate(ageLines), [['data from 2026-01-01'], ['data from 2026-01-01']]);
  });

  await t.step('in Portuguese', async () => {
    const page = await session.open(HOME_PT, { viewport: WIDE, javascript: false });
    assertEquals(await page.evaluate(ageLines), [['dados de 2026-01-01'], ['dados de 2026-01-01']]);
  });
});
