/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { HOME_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

const focused = () => ({
  panel: document.activeElement?.closest('.panel')?.id ?? null,
  text: document.activeElement?.textContent?.trim() ?? null,
});

Deno.test('going back to the home lands on the panel and row the visitor left from', async (t) => {
  await using session = await Session.start();

  const goBack = async (page: Awaited<ReturnType<Session['open']>>, times: number) => {
    for (let step = 0; step < times; step++) {
      await page.keyboard.press('q');
      await page.waitForNavigation();
    }
  };

  await t.step('a post opened from the posts panel: two steps back return to that row', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.press('4');
    const row = (await page.evaluate(focused)).text;
    await page.keyboard.press('Enter');
    await page.waitForNavigation();
    await goBack(page, 2);
    assertEquals(new URL(page.url).pathname, HOME_EN);
    assertEquals(await page.evaluate(focused), { panel: 'posts', text: row });
  });

  await t.step('the panel title link leads to the list and back to that title', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.evaluate(() => document.querySelector<HTMLAnchorElement>('#projects .panel__name')?.click());
    await page.waitForNavigation();
    await goBack(page, 1);
    assertEquals(await page.evaluate(focused), { panel: 'projects', text: 'Projects' });
  });

  await t.step('a reload starts from the top even when a place is saved', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.evaluate(() =>
      sessionStorage.setItem('home-origin', JSON.stringify({ panel: 'posts', href: '/en/posts/' })),
    );
    await page.reload();
    assertEquals(await page.evaluate(() => document.activeElement?.tagName), 'BODY');
  });

  await t.step('opening the home straight away focuses nothing', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    assertEquals((await page.evaluate(focused)).panel, null);
  });
});
