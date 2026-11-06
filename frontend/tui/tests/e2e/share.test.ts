/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { HOME_EN, PROJECTS_EN, SECOND_POST_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

const preview = () => ({
  image: document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? null,
  width: document.querySelector('meta[property="og:image:width"]')?.getAttribute('content'),
  height: document.querySelector('meta[property="og:image:height"]')?.getAttribute('content'),
  card: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
});

Deno.test('every page has a picture for link previews, made at build time', async (t) => {
  await using session = await Session.start();

  await t.step('a post has its own, the size previews expect, and the file is there', async () => {
    const page = await session.open(SECOND_POST_EN, { viewport: WIDE, javascript: false });
    const post = await page.evaluate(preview);
    assertEquals([post.width, post.height, post.card], ['1200', '630', 'summary_large_image']);
    assert(post.image?.startsWith('https://'), 'previews need a full address');
    const response = await fetch(`${session.url}${new URL(post.image ?? '').pathname}`);
    assertEquals([response.status, response.headers.get('content-type')], [200, 'image/jpeg']);
    await response.body?.cancel();
  });

  await t.step('a list or the home shares the picture with the name, not one of an item', async () => {
    const images: (string | null)[] = [];
    for (const path of [SECOND_POST_EN, HOME_EN, PROJECTS_EN]) {
      const page = await session.open(path, { viewport: WIDE, javascript: false });
      images.push((await page.evaluate(preview)).image);
    }
    assert(images[0] !== images[1], 'the post has its own picture');
    assertEquals(images[1], images[2]);
  });
});

Deno.test('the end of a text offers to share it', async (t) => {
  await using session = await Session.start();

  const button = () => ({
    shown: document.querySelector('[data-share]')?.checkVisibility() ?? false,
    label: document.querySelector('[data-share] button span')?.textContent,
  });

  await t.step('without JavaScript there is no button', async () => {
    const page = await session.open(SECOND_POST_EN, { viewport: WIDE, javascript: false });
    assertEquals((await page.evaluate(button)).shown, false);
  });

  await t.step("with the system's sharing, the button hands it the title and the address", async () => {
    const page = await session.open(SECOND_POST_EN, { viewport: WIDE });
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', {
        value: (data: ShareData) => {
          document.body.dataset['shared'] = `${data.title} | ${data.url}`;
          return Promise.resolve();
        },
      });
    });
    await page.locator('[data-share] button').click();
    const [shared, title] = await page.evaluate(() => [document.body.dataset['shared'], document.title]);
    assertEquals(shared, `${title} | ${session.url}${SECOND_POST_EN}`);
  });

  await t.step('without it, the button copies the address and says so', async () => {
    const page = await session.open(SECOND_POST_EN, { viewport: WIDE });
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { value: undefined });
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: (text: string) => {
            document.body.dataset['copied'] = text;
            return Promise.resolve();
          },
        },
      });
    });
    assertEquals(await page.evaluate(button), { shown: true, label: 'share' });
    await page.locator('[data-share] button').click();
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)));
    assertEquals(await page.evaluate(button), { shown: true, label: 'link copied' });
    assertEquals(await page.evaluate(() => document.body.dataset['copied']), `${session.url}${SECOND_POST_EN}`);
  });
});
