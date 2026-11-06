/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import {
  FILM_POST_EN,
  FIRST_POST_EN,
  POSTS_EN,
  POSTS_PT,
  PROFESSIONAL_EN,
  PROJECT_EN,
  PROJECTS_EN,
  SECOND_POST_EN,
} from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

function readList() {
  return {
    heading: document.querySelector('h1')?.textContent,
    titles: [...document.querySelectorAll('.zoom__body .item__title')].map((title) => title.textContent?.trim()),
    filter: [...document.querySelectorAll('.filter li')].map((item) => item.textContent?.replace(/\s+/g, ' ').trim()),
    current: document.querySelector('.filter [aria-current="page"]')?.textContent,
    feeds: [...document.querySelectorAll('.items__feed')].map(
      (link) => `${link.textContent?.trim()} ${link.getAttribute('href')}`,
    ),
    back: document.querySelector('.statusbar [data-nav="back"]')?.getAttribute('href'),
  };
}

Deno.test('the post list shows every published post, newest first, with a category filter', async (t) => {
  await using session = await Session.start();

  await t.step('drafts stay out, order is by date and the filter counts each category', async () => {
    const page = await session.open(POSTS_EN, { viewport: WIDE, javascript: false });
    assertEquals(await page.evaluate(readList), {
      heading: 'Posts',
      titles: ['Film fixture post', 'Post só em português', 'Second fixture post', 'Fixture post'],
      filter: ['all', 'Entertainment 1', 'Notes 1', 'Professional 1'],
      current: 'all',
      feeds: ['RSS: all posts /en/index.xml'],
      back: '/en/',
    });
  });

  await t.step('a post written only in Portuguese is listed in English with a language label', async () => {
    const page = await session.open(POSTS_EN, { viewport: WIDE, javascript: false });
    const labels = await page.evaluate(() =>
      [...document.querySelectorAll('.zoom__body .item__link[lang]')].map((link) => [
        link.querySelector('.item__title')?.textContent?.trim(),
        link.getAttribute('lang'),
        link.querySelector('.item__meta')?.textContent?.split(' · ').at(-1),
      ]),
    );
    assertEquals(labels, [['Post só em português', 'pt-BR', 'Português']]);
  });

  await t.step('the heading and the category names follow the interface language', async () => {
    const page = await session.open(POSTS_PT, { viewport: WIDE, javascript: false });
    const { heading, filter } = await page.evaluate(readList);
    assertEquals([heading, filter.slice(1)], ['Escrita', ['Notas 2']]);
  });

  await t.step('a category lists only its posts and goes back to the blog, not to the categories', async () => {
    const page = await session.open(PROFESSIONAL_EN, { viewport: WIDE, javascript: false });
    assertEquals(await page.evaluate(readList), {
      heading: 'Professional',
      titles: ['Second fixture post'],
      filter: ['all', 'Entertainment 1', 'Notes 1', 'Professional 1'],
      current: 'Professional',
      feeds: ['RSS: Professional /en/categories/professional/index.xml'],
      back: '/en/posts/',
    });
  });
});

Deno.test('projects show their facts in the list and on their own page', async (t) => {
  await using session = await Session.start();

  await t.step('the list shows tags and summary, ordered by weight before title', async () => {
    const page = await session.open(PROJECTS_EN, { viewport: WIDE, javascript: false });
    assertEquals(
      await page.evaluate(() => [
        document.querySelector('h1')?.textContent,
        ...[...document.querySelectorAll('.zoom__body .item')].map((row) =>
          [
            row.querySelector('.item__title')?.textContent?.trim(),
            [...row.querySelectorAll('.chip')].map((chip) => chip.textContent).join(' · '),
            row.querySelector('.item__summary')?.textContent?.trim(),
          ].join(' | '),
        ),
      ]),
      [
        'Projects',
        'Second fixture project | Go | A project the weight puts first, although its title sorts after the other.',
        'Fixture project | hugo · deno | A project used by the end-to-end tests.',
      ],
    );
  });

  await t.step('the project page lists its tags, each leading to the tag, with no period or status', async () => {
    const page = await session.open(PROJECT_EN, { viewport: WIDE, javascript: false });
    assertEquals(
      await page.evaluate(() => ({
        facts: document.querySelectorAll('.zoom__body .facts > *').length,
        tags: [...document.querySelectorAll('.zoom__tags .chip')].map(
          (chip) => `${chip.textContent} ${chip.getAttribute('href')}`,
        ),
      })),
      { facts: 0, tags: ['hugo /en/tags/hugo/', 'deno /en/tags/deno/'] },
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

Deno.test('the view switch says which view is on and changes it with a click', async (t) => {
  await using session = await Session.start();

  await t.step('list is pressed first; clicking grid shows the grid and presses it', async () => {
    const page = await session.open(POSTS_EN, { viewport: WIDE });
    const read = () => ({
      view: document.querySelector<HTMLElement>('[data-items]')?.dataset['view'],
      pressed: [...document.querySelectorAll('.view-switch button')].map((button) =>
        button.getAttribute('aria-pressed'),
      ),
    });
    const before = await page.evaluate(read);
    await page.locator('.view-switch [data-view="grid"]').click();
    assertEquals(
      [before, await page.evaluate(read)],
      [
        { view: 'list', pressed: ['true', 'false'] },
        { view: 'grid', pressed: ['false', 'true'] },
      ],
    );
    await page.evaluate(() => localStorage.clear());
  });
});

Deno.test('a tag gathers everything that carries it, under its name in the language', async (t) => {
  await using session = await Session.start();

  const read = () => ({
    heading: document.querySelector('h1')?.textContent,
    titles: [...document.querySelectorAll('.zoom__body .item__title')].map((title) => title.textContent?.trim()),
    feed: document.querySelector('.items__feed')?.getAttribute('href'),
  });

  await t.step('in English: the post and the research item, with the feed of the tag', async () => {
    const page = await session.open('/en/tags/machine-learning/', { viewport: WIDE, javascript: false });
    assertEquals(await page.evaluate(read), {
      heading: 'machine learning',
      titles: ['Fixture post', 'Fixture research'],
      feed: '/en/tags/machine-learning/index.xml',
    });
  });

  await t.step('in Portuguese the tags file gives it its translated name', async () => {
    const page = await session.open('/pt/tags/machine-learning/', { viewport: WIDE, javascript: false });
    assertEquals((await page.evaluate(read)).heading, 'aprendizado de máquina');
  });
});
