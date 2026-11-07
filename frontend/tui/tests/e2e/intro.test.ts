/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { HOME_EN, POST_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

const read = () => ({
  intro: document.documentElement.dataset['intro'] ?? null,
  overlay: document.querySelector('.intro') !== null,
  shown: getComputedStyle(document.querySelector('.win') as Element).opacity,
});

Deno.test('the opening plays in full on the first visit and gives way to the page', async (t) => {
  await using session = await Session.start();

  await t.step('the name forms with the sentence under it, then the window comes in', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, intro: true });
    await page.waitForFunction(() => (document.querySelector('.intro__text')?.textContent?.length ?? 0) > 0);
    assertEquals((await page.evaluate(read)).intro, 'full');
    await page.waitForFunction(() => document.querySelector('.intro') === null);
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 600)));
    assertEquals(await page.evaluate(read), { intro: 'short', overlay: false, shown: '1' });
  });

  await t.step('any key skips it and does nothing else; the next page has none', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, intro: true });
    // The visit before left its time in the browser; without it this is a first visit again.
    await page.evaluate(() => localStorage.removeItem('intro'));
    await page.reload();
    await page.waitForFunction(() => document.querySelector('.intro') !== null);
    await page.keyboard.press('2');
    assertEquals(await page.evaluate(read), { intro: null, overlay: false, shown: '1' });
    assertEquals(new URL(page.url).pathname, HOME_EN);
    await page.goto(`${session.url}${POST_EN}`, { waitUntil: 'load' });
    assertEquals((await page.evaluate(read)).intro, null);
  });
});

Deno.test('the short opening comes after a long absence, and none at all with motion turned down on the site', async (t) => {
  await using session = await Session.start();

  await t.step('back after a long absence, the window draws itself without the name', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, intro: true, savedStorage: { intro: '1' } });
    assertEquals((await page.evaluate(read)).intro, 'short');
    assertEquals((await page.evaluate(read)).overlay, false);
  });

  await t.step('with motion turned down on the site nothing plays; the system setting does not stop it', async () => {
    const reduced = await session.open(HOME_EN, { viewport: WIDE, intro: true, savedStorage: { motion: 'reduced' } });
    assertEquals(await reduced.evaluate(read), { intro: null, overlay: false, shown: '1' });
    const system = await session.open(HOME_EN, { viewport: WIDE, intro: true, reducedMotion: true });
    await system.evaluate(() => localStorage.clear());
    await system.reload();
    assertEquals((await system.evaluate(read)).intro, 'full');
  });

  await t.step('without JavaScript the page is simply there', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, intro: true, javascript: false });
    assertEquals(await page.evaluate(read), { intro: null, overlay: false, shown: '1' });
  });
});
