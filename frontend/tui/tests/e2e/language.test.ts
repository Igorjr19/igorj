/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { waitToLeave } from './support/navigation.ts';
import { HOME_EN, HOME_PT } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

Deno.test('the language switcher is remembered and the root address follows it', async (t) => {
  await using session = await Session.start();

  await t.step('choosing Portuguese with the switcher beats an English browser at the root next time', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.evaluate(() => document.querySelector<HTMLAnchorElement>('.site-header__languages a')?.click());
    await page.waitForNavigation();
    assertEquals(await page.evaluate(() => localStorage.getItem('language')), 'pt');
    const root = await session.open('/', { viewport: WIDE, acceptLanguage: 'en-US', savedStorage: { language: 'pt' } });
    await waitToLeave(root, '/');
    assertEquals(new URL(root.url).pathname, HOME_PT);
  });

  await t.step(
    'the root page offers both languages as links and a refresh to English for readers without scripts',
    async () => {
      const html = await (await fetch(`${session.url}/`)).text();
      const links = [...html.matchAll(/<a href=([^ >]+)/g)].map((match) => match[1]);
      assertEquals(links.sort(), [HOME_EN, HOME_PT].sort());
      assertEquals(html.includes(`<noscript><meta http-equiv=refresh content="0; url=${HOME_EN}"></noscript>`), true);
    },
  );
});

Deno.test('posts written only in the other language carry a language label on the home too', async (t) => {
  await using session = await Session.start();

  const rows = () =>
    [...document.querySelectorAll('#posts li')].map((row) => [
      row.querySelector('a')?.textContent?.trim(),
      row.querySelector('span[lang]')?.textContent?.trim() ?? null,
    ]);

  await t.step('the English home labels the Portuguese-only post and leaves the others alone', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, javascript: false });
    const labelled = (await page.evaluate(rows)).filter(([, label]) => label !== null);
    assertEquals(labelled, [['Post só em português', 'Português']]);
  });

  await t.step('the Portuguese home labels the English-only posts', async () => {
    const page = await session.open(HOME_PT, { viewport: WIDE, javascript: false });
    const labelled = (await page.evaluate(rows)).filter(([, label]) => label !== null);
    assertEquals(labelled, [
      ['Film fixture post', 'English'],
      ['Second fixture post', 'English'],
    ]);
  });
});
