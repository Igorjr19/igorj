/// <reference lib="dom" />
import type { Page } from '@astral/astral';
import { assert, assertEquals } from '@std/assert';
import { CV_EN, CV_PT, HOME_EN, RESEARCH_EN, RESEARCH_ITEM_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

async function textOf(page: Page, selector: string): Promise<(string | undefined)[]> {
  return await page.evaluate(
    (query: string) =>
      [...document.querySelectorAll(query)].map((element) => element.textContent?.replace(/\s+/g, ' ').trim()),
    { args: [selector] },
  );
}

Deno.test('the CV is a page of its own, built from the CV data', async (t) => {
  await using session = await Session.start();

  await t.step('every section of the data shows up, with an open position marked as present', async () => {
    const page = await session.open(CV_EN, { viewport: WIDE, javascript: false });
    assertEquals(await textOf(page, 'h1, .zoom__body h2'), [
      'CV',
      'Experience',
      'Education',
      'Skills',
      'Languages',
      'Publications',
    ]);
    const body = (await textOf(page, '.zoom__body'))[0] ?? '';
    for (const expected of [
      'Fixture role · Fixture city',
      'Fixture Developer · Fixture Company',
      '2024-02 – present · Remote',
      '2022-01 – 2023-12',
      'Bachelor · Computing',
      'Fixture University · 2020-01 – 2023-12',
      'TypeScript · Go',
      'Fluent',
    ]) {
      assert(body.includes(expected), `missing "${expected}" in ${body}`);
    }
  });

  await t.step('publications link to the research pages', async () => {
    const page = await session.open(CV_EN, { viewport: WIDE, javascript: false });
    const links = await page.evaluate(() =>
      [...document.querySelectorAll('.zoom__body section:last-of-type a')].map((link) => link.getAttribute('href')),
    );
    assertEquals(links, [RESEARCH_ITEM_EN]);
  });

  await t.step('the Portuguese CV has its own data and a title in Portuguese', async () => {
    const page = await session.open(CV_PT, { viewport: WIDE, javascript: false });
    assertEquals((await textOf(page, 'h1'))[0], 'Currículo');
    assert(((await textOf(page, '.zoom__body'))[0] ?? '').includes('Resumo fixture da carreira.'));
  });

  await t.step('the home links to the CV and to the research list', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, javascript: false });
    const links = await page.evaluate(() =>
      [...document.querySelectorAll('#about a')].map((link) => link.getAttribute('href')),
    );
    assertEquals(links, [RESEARCH_EN, CV_EN]);
  });
});

Deno.test('research has a list and a page with the facts of each work', async (t) => {
  await using session = await Session.start();

  await t.step('the list shows kind, year, authors and venue', async () => {
    const page = await session.open(RESEARCH_EN, { viewport: WIDE, javascript: false });
    assertEquals(await textOf(page, 'h1, .entries li'), [
      'Research',
      'Fixture research article · 2025 First Author, Second Author · Fixture Journal',
    ]);
  });

  await t.step('the page lists the facts and links the DOI', async () => {
    const page = await session.open(RESEARCH_ITEM_EN, { viewport: WIDE, javascript: false });
    assertEquals(await textOf(page, '.zoom__body .facts > *'), [
      'Kind',
      'article',
      'Year',
      '2025',
      'Authors',
      'First Author, Second Author',
      'Venue',
      'Fixture Journal',
      'DOI',
      '10.1000/fixture',
    ]);
    assertEquals(
      await page.evaluate(() => document.querySelector('.zoom__body .facts a')?.getAttribute('href')),
      'https://doi.org/10.1000/fixture',
    );
  });
});

Deno.test('the CV prints on white paper without the screen furniture', async (t) => {
  await using session = await Session.start();

  await t.step('the print button needs JavaScript, so it is not offered without it', async () => {
    const page = await session.open(CV_EN, { viewport: WIDE, javascript: false });
    assertEquals(
      await page.evaluate(() => [...document.querySelectorAll('[data-action=print]')].map((b) => b.checkVisibility())),
      [false],
    );
    const withScript = await session.open(CV_EN, { viewport: WIDE });
    assertEquals(
      await withScript.evaluate(() =>
        [...document.querySelectorAll('[data-action=print]')].map((b) => b.checkVisibility()),
      ),
      [true],
    );
  });

  await t.step(
    'in print the header, status line and path are gone and the dark theme turns black on white',
    async () => {
      const page = await session.open(CV_EN, { viewport: WIDE, colorScheme: 'dark' });
      await page
        .unsafelyGetCelestialBindings()
        .Emulation.setEmulatedMedia({ media: 'print', features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
      const printed = await page.evaluate(() => ({
        hidden: ['.site-header', '.dock', '.zoom__bar'].map(
          (selector) => getComputedStyle(document.querySelector(selector) as Element).display,
        ),
        text: getComputedStyle(document.querySelector('.zoom__body p') as Element).color,
        background: getComputedStyle(document.body).backgroundColor,
      }));
      assertEquals(printed, {
        hidden: ['none', 'none', 'none'],
        text: 'rgb(0, 0, 0)',
        background: 'rgb(255, 255, 255)',
      });
    },
  );
});
