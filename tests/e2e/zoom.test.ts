/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { HOME_EN, POST_EN, POST_PT, POSTS_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };
const SHORT = { width: 600, height: 200 };

function readFrame() {
  return {
    path: [...document.querySelectorAll('.zoom__path a')].map((link) => ({
      text: link.textContent,
      href: link.getAttribute('href'),
    })),
    back: document.querySelector('.zoom__back')?.getAttribute('href'),
    status: [...document.querySelectorAll('.status-line > span')]
      .filter((item) => item.checkVisibility())
      .map((item) => item.textContent?.replace(/\s+/g, ' ').trim()),
  };
}

Deno.test('inner pages show the path, a way back and a status line', async (t) => {
  await using session = await Session.start();

  await t.step('a post: path from the home, back to the list, file, language and reading time', async () => {
    const page = await session.open(POST_EN, { viewport: WIDE, javascript: false });
    assertEquals(await page.evaluate(readFrame), {
      path: [
        { text: '~', href: '/en/' },
        { text: 'posts', href: '/en/posts/' },
        { text: 'fixture-post', href: '/en/posts/fixture-post/' },
      ],
      back: '/en/posts/',
      status: ['posts/fixture-post/index.en.md', 'en', '1 min read'],
    });
  });

  await t.step('in Portuguese the interface is translated while the URLs stay in English', async () => {
    const page = await session.open(POST_PT, { viewport: WIDE, javascript: false });
    const frame = await page.evaluate(readFrame);
    assertEquals(
      frame.path.map((link) => link.text),
      ['~', 'escrita', 'fixture-post'],
    );
    assertEquals(frame.back, '/pt/posts/');
    assertEquals(frame.status.at(-1), '1 min de leitura');
  });

  await t.step('a list: path and item count, with the home above it', async () => {
    const page = await session.open(POSTS_EN, { viewport: WIDE, javascript: false });
    const frame = await page.evaluate(readFrame);
    assertEquals(
      frame.path.map((link) => link.text),
      ['~', 'posts'],
    );
    assertEquals(frame.back, '/en/');
    assertEquals(frame.status, ['en', '1 item']);
  });

  await t.step('the frame is a whole number of cells wide and the content stops at 80 columns', async () => {
    const page = await session.open(POST_EN, { viewport: { width: 1441, height: 900 } });
    const sizes = await page.evaluate(async () => {
      await document.fonts.load(`${getComputedStyle(document.body).fontSize} 'Fira Code'`);
      const cell = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-width'));
      return {
        cell,
        frame: document.querySelector('.zoom')?.getBoundingClientRect().width ?? 0,
        body: document.querySelector('.zoom__body')?.getBoundingClientRect().width ?? 0,
      };
    });
    assert(Math.abs(sizes.frame / sizes.cell - Math.round(sizes.frame / sizes.cell)) < 0.01);
    assertEquals(Math.round(sizes.body / sizes.cell), 80);
  });
});

Deno.test('the read percentage follows the scroll and exists only with JavaScript', async (t) => {
  await using session = await Session.start();

  const percent = () => document.querySelector('[data-progress]')?.textContent;

  await t.step('without JavaScript there is no percentage to show', async () => {
    const page = await session.open(POST_EN, { viewport: SHORT, javascript: false });
    assertEquals(
      (await page.evaluate(readFrame)).status.some((item) => item?.includes('%')),
      false,
    );
  });

  await t.step('0% at the top, 100% at the end', async () => {
    const page = await session.open(POST_EN, { viewport: SHORT });
    assertEquals(await page.evaluate(percent), '0');
    await page.evaluate(async () => {
      scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    assertEquals(await page.evaluate(percent), '100');
  });
});

Deno.test('q goes to the parent page, and the status line sits right above the key bar', async (t) => {
  await using session = await Session.start();

  await t.step('q on a post leads to the list; on the list, to the home', async () => {
    const page = await session.open(POST_EN, { viewport: WIDE });
    await page.keyboard.press('q');
    await page.waitForNavigation();
    assertEquals(new URL(page.url).pathname, POSTS_EN);
    await page.keyboard.press('q');
    await page.waitForNavigation();
    assertEquals(new URL(page.url).pathname, HOME_EN);
  });

  await t.step('q does nothing on the home, where there is no parent', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.press('q');
    assertEquals(new URL(page.url).pathname, HOME_EN);
  });

  await t.step('the status line ends where the key bar starts, at the bottom of the window', async () => {
    const page = await session.open(POST_EN, { viewport: WIDE });
    const edges = await page.evaluate(() => ({
      statusBottom: document.querySelector('.status-line')?.getBoundingClientRect().bottom,
      keybarTop: document.querySelector('.keybar')?.getBoundingClientRect().top,
      keybarBottom: document.querySelector('.keybar')?.getBoundingClientRect().bottom,
    }));
    assertEquals(edges.statusBottom, edges.keybarTop);
    assertEquals(edges.keybarBottom, WIDE.height);
  });
});
