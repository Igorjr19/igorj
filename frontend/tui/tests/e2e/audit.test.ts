/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { CV_EN, HOME_EN, HOME_PT, POST_EN, POSTS_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const PHONE = { width: 320, height: 640 };
const WIDE = { width: 1440, height: 900 };

Deno.test('content reflows at 320 px without scrolling the page sideways', async (t) => {
  await using session = await Session.start();

  for (const path of [HOME_EN, HOME_PT, POSTS_EN, POST_EN, CV_EN, '/en/404.html']) {
    await t.step(path, async () => {
      const page = await session.open(path, { viewport: PHONE });
      const overflow = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth - window.innerWidth,
        offenders: [...document.querySelectorAll('body *')]
          .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1 && !element.closest('pre'))
          .map((element) => `${element.tagName}.${element.className}`),
      }));
      assertEquals(overflow, { page: 0, offenders: [] });
    });
  }

  await t.step('a code block wider than the screen scrolls inside itself and can be reached by keyboard', async () => {
    const page = await session.open(POST_EN, { viewport: PHONE });
    const block = await page.evaluate(() => {
      const pre = document.querySelector('pre') as HTMLElement;
      return { scrolls: pre.scrollWidth > pre.clientWidth, focusable: pre.tabIndex === 0 };
    });
    assertEquals(block, { scrolls: true, focusable: true });
  });
});

Deno.test('every link, button and row of the home can be reached with Tab alone', async () => {
  await using session = await Session.start();
  const page = await session.open(HOME_EN, { viewport: WIDE });

  const expected = await page.evaluate(
    () =>
      [...document.querySelectorAll('a[href], button, summary, input, select, textarea')].filter((element) =>
        element.checkVisibility(),
      ).length,
  );
  const reached = new Set<string>();
  for (let step = 0; step < expected + 5; step++) {
    await page.keyboard.press('Tab');
    reached.add(
      await page.evaluate(() => {
        const active = document.activeElement as HTMLElement;
        return active === document.body ? 'wrapped' : `${[...document.querySelectorAll('*')].indexOf(active)}`;
      }),
    );
  }
  reached.delete('wrapped');
  assertEquals(reached.size, expected);
});

Deno.test('titles of posts written in another language say so, for screen readers', async () => {
  await using session = await Session.start();
  const page = await session.open(HOME_EN, { viewport: WIDE });
  const languages = await page.evaluate(() =>
    [...document.querySelectorAll('#posts li > a:first-of-type')].map((link) => [
      link.textContent?.trim(),
      link.getAttribute('lang'),
    ]),
  );
  assertEquals(
    languages.filter(([, lang]) => lang !== null),
    [['Post só em português', 'pt-BR']],
  );
});
