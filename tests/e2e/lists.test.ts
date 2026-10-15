/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import {
  DEVOPS_EN,
  FILM_POST_EN,
  FIRST_POST_EN,
  POSTS_EN,
  POSTS_PT,
  PROJECT_EN,
  PROJECTS_EN,
  SECOND_POST_EN,
} from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

function readList() {
  return {
    heading: document.querySelector('h1')?.textContent,
    titles: [...document.querySelectorAll('.zoom__body .entries > li > a:first-of-type')].map((link) =>
      link.textContent?.trim(),
    ),
    filter: [...document.querySelectorAll('.filter li')].map((item) => item.textContent?.replace(/\s+/g, ' ').trim()),
    current: document.querySelector('.filter [aria-current="page"]')?.textContent,
    feeds: [...document.querySelectorAll('.zoom__body > p a')].map(
      (link) => `${link.textContent} ${link.getAttribute('href')}`,
    ),
    back: document.querySelector('.zoom__back')?.getAttribute('href'),
  };
}

Deno.test('the post list shows every published post, newest first, with a category filter', async (t) => {
  await using session = await Session.start();

  await t.step('drafts stay out, order is by date and the filter counts each category', async () => {
    const page = await session.open(POSTS_EN, { viewport: WIDE, javascript: false });
    assertEquals(await page.evaluate(readList), {
      heading: 'Posts',
      titles: ['Film fixture post', 'Post só em português', 'Second fixture post', 'Fixture post'],
      filter: ['all', 'Devops 1', 'Film reviews 1', 'Testing 1'],
      current: 'all',
      feeds: ['RSS: all posts /en/index.xml'],
      back: '/en/',
    });
  });

  await t.step('the heading follows the interface language', async () => {
    const page = await session.open(POSTS_PT, { viewport: WIDE, javascript: false });
    assertEquals((await page.evaluate(readList)).heading, 'Escrita');
  });

  await t.step('a category lists only its posts and goes back to the blog, not to the categories', async () => {
    const page = await session.open(DEVOPS_EN, { viewport: WIDE, javascript: false });
    assertEquals(await page.evaluate(readList), {
      heading: 'Devops',
      titles: ['Second fixture post'],
      filter: ['all', 'Devops 1', 'Film reviews 1', 'Testing 1'],
      current: 'Devops',
      feeds: ['RSS: all posts /en/index.xml', 'RSS: Devops /en/categories/devops/index.xml'],
      back: '/en/posts/',
    });
  });
});

Deno.test('projects show their facts in the list and on their own page', async (t) => {
  await using session = await Session.start();

  await t.step('the list shows status and stack', async () => {
    const page = await session.open(PROJECTS_EN, { viewport: WIDE, javascript: false });
    assertEquals(
      await page.evaluate(() => [
        document.querySelector('h1')?.textContent,
        document.querySelector('.zoom__body .entries li')?.textContent?.replace(/\s+/g, ' ').trim(),
      ]),
      ['Projects', 'Fixture project in progress hugo · deno A project used by the end-to-end tests.'],
    );
  });

  await t.step('the project page lists status, period and stack, with an open period shown as present', async () => {
    const page = await session.open(PROJECT_EN, { viewport: WIDE, javascript: false });
    assertEquals(
      await page.evaluate(() =>
        [...document.querySelectorAll('.zoom__body .facts > *')].map((cell) => cell.textContent?.trim()),
      ),
      ['Status', 'in progress', 'Period', '2026-01 – present', 'Stack', 'hugo · deno'],
    );
  });
});

Deno.test('posts link to the previous and the next post, also by key', async (t) => {
  await using session = await Session.start();

  const pager = () => [...document.querySelectorAll('.pager a')].map((link) => link.textContent?.trim());

  await t.step('the middle post links both ways, in chronological order', async () => {
    const page = await session.open(SECOND_POST_EN, { viewport: WIDE, javascript: false });
    assertEquals(await page.evaluate(pager), ['‹ previous: Fixture post', 'next: Film fixture post ›']);
  });

  await t.step('n goes to the next post and p returns', async () => {
    const page = await session.open(SECOND_POST_EN, { viewport: WIDE });
    await page.keyboard.press('n');
    await page.waitForNavigation();
    assertEquals(new URL(page.url).pathname, FILM_POST_EN);
    await page.keyboard.press('p');
    await page.waitForNavigation();
    assertEquals(new URL(page.url).pathname, SECOND_POST_EN);
  });

  await t.step('the first post has nothing before it, so p does nothing', async () => {
    const page = await session.open(FIRST_POST_EN, { viewport: WIDE });
    assertEquals(await page.evaluate(pager), ['next: Second fixture post ›']);
    await page.keyboard.press('p');
    assertEquals(new URL(page.url).pathname, FIRST_POST_EN);
  });
});
