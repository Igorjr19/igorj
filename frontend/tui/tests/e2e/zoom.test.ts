/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { HOME_EN, POST_EN, POST_PT, POSTS_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };
const SHORT = { width: 600, height: 200 };

function readFrame() {
  return {
    path: [...document.querySelectorAll('.pane__path a')].map((link) => ({
      text: link.textContent,
      href: link.getAttribute('href'),
    })),
    back: document.querySelector('.pane__back')?.getAttribute('href'),
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
    assertEquals(frame.status, ['en', '4 items']);
  });

  await t.step('the text of a post stops at 80 columns, centered in the zoomed pane', async () => {
    const page = await session.open(POST_EN, { viewport: { width: 1441, height: 900 } });
    const sizes = await page.evaluate(async () => {
      await document.fonts.load(`${getComputedStyle(document.body).fontSize} 'Fira Code'`);
      const cell = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-width'));
      const pane = document.querySelector('.pane')?.getBoundingClientRect();
      const body = document.querySelector('.zoom__body')?.getBoundingClientRect();
      return {
        cell,
        body: body?.width ?? 0,
        offCenter: Math.abs((body?.left ?? 0) - (pane?.left ?? 0) - ((pane?.right ?? 0) - (body?.right ?? 0))),
      };
    });
    assertEquals(Math.round(sizes.body / sizes.cell), 80);
    assert(sizes.offCenter < 2 * sizes.cell, `${sizes.offCenter}px off center`);
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

Deno.test('q goes to the parent page, and the status line closes the window at the bottom of the screen', async (t) => {
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

  await t.step('the status line is the last row of the window, one cell above the bottom of the screen', async () => {
    const page = await session.open(POST_EN, { viewport: WIDE });
    const edges = await page.evaluate(() => {
      const win = document.querySelector('.win')?.getBoundingClientRect();
      return {
        statusBottom: Math.round(document.querySelector('.statusbar')?.getBoundingClientRect().bottom ?? 0),
        windowBottom: Math.round((win?.bottom ?? 0) - 1),
        gap: Math.round(innerHeight - (win?.bottom ?? 0)),
        cell: Math.round(
          Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-height')),
        ),
      };
    });
    assertEquals(edges.statusBottom, edges.windowBottom);
    assertEquals(edges.gap, edges.cell);
  });
});
