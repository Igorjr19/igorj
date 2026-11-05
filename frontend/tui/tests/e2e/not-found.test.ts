/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

function readPage() {
  return {
    title: document.title,
    lang: document.documentElement.lang,
    message: (document.querySelector('article p') as HTMLElement | null)?.innerText.replace(/\s+/g, ' ').trim(),
    robots: document.querySelector('meta[name=robots]')?.getAttribute('content'),
    languageLinks: document.querySelectorAll('.site-header__languages a').length,
    home: document.querySelector('article a')?.getAttribute('href'),
  };
}

Deno.test('unknown addresses answer 404 with the command-not-found message of the nearest language', async (t) => {
  await using session = await Session.start();

  await t.step('the server answers 404 and the page names the address once scripts run', async () => {
    const page = await session.open('/en/posts/nope/', { viewport: WIDE });
    assertEquals(await page.evaluate(readPage), {
      title: '404',
      lang: 'en',
      message: 'igorj: /en/posts/nope/: command not found',
      robots: 'noindex',
      languageLinks: 0,
      home: '/en/',
    });
    const response = await fetch(`${session.url}/en/posts/nope/`);
    assertEquals(response.status, 404);
    await response.body?.cancel();
  });

  await t.step('without JavaScript the address is left out instead of showing an empty slot', async () => {
    const page = await session.open('/pt/nada/', { viewport: WIDE, javascript: false });
    const frame = await page.evaluate(readPage);
    assertEquals(frame.message, 'igorj: command not found');
    assertEquals(frame.home, '/pt/');
  });

  await t.step('outside the languages the root page offers both and is not indexed', async () => {
    const page = await session.open('/nada', { viewport: WIDE, javascript: false });
    assertEquals(
      await page.evaluate(() => ({
        links: [...document.querySelectorAll('a')].map((link) => link.getAttribute('href')),
        robots: document.querySelector('meta[name=robots]')?.getAttribute('content'),
      })),
      { links: ['/en/', '/pt/'], robots: 'noindex' },
    );
  });
});
