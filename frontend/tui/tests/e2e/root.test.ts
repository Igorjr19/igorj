/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { waitToLeave } from './support/navigation.ts';
import { HOME_EN, HOME_PT } from './support/paths.ts';
import { Session } from './support/session.ts';

// Long enough for the root script to have redirected, had it run on a page it should leave alone.
const SETTLE_MS = 300;

Deno.test('the root page sends visitors to a language home on the same host, wherever the site is served', async () => {
  await using session = await Session.start();
  const page = await session.open('/', { acceptLanguage: 'en-US' });
  await waitToLeave(page, '/');
  const { host, pathname } = await page.evaluate(() => ({ host: location.host, pathname: location.pathname }));
  assertEquals(pathname, HOME_EN);
  assertEquals(host, new URL(session.url).host);
});

Deno.test('the browser language picks the home only at the root address', async (t) => {
  await using session = await Session.start();

  const cases = [
    ['pt-BR', HOME_PT],
    ['pt', HOME_PT],
    ['en-US', HOME_EN],
    ['de', HOME_EN],
  ];
  for (const [language = '', home] of cases) {
    await t.step(`a browser preferring ${language} lands on ${home}`, async () => {
      const page = await session.open('/', { acceptLanguage: language });
      await waitToLeave(page, '/');
      assertEquals(new URL(page.url).pathname, home);
    });
  }

  await t.step('without JavaScript the root leads to English', async () => {
    const page = await session.open('/', { javascript: false });
    await waitToLeave(page, '/');
    assertEquals(new URL(page.url).pathname, HOME_EN);
  });

  await t.step('a direct link to the Portuguese home never redirects an English browser', async () => {
    const page = await session.open(HOME_PT, { acceptLanguage: 'en-US' });
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    assertEquals(new URL(page.url).pathname, HOME_PT);
  });
});
