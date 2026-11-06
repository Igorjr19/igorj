/// <reference lib="dom" />
import { assert, assertAlmostEquals, assertEquals, assertNotEquals } from '@std/assert';
import { HOME_EN, HOME_PT } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };
const NAME = 'Ígor José Rodrigues';

Deno.test('the home opens the window on its first pane', async (t) => {
  await using session = await Session.start();

  for (const [path, labels] of [
    [HOME_EN, ['Home', 'Projects', 'Writing', 'Research', 'CV', 'Listening and watching']],
    [HOME_PT, ['Início', 'Projetos', 'Escrita', 'Pesquisa', 'Currículo', 'Ouvindo e assistindo']],
  ] as const) {
    await t.step(`${path}: six panes, numbered for their keys, the first one current`, async () => {
      const page = await session.open(path, { viewport: WIDE, javascript: false });
      const panes = await page.evaluate(() =>
        [...document.querySelectorAll('.side__panes a')].map((link) => ({
          key: link.querySelector('.side__key')?.textContent,
          label: link.querySelector('.side__label')?.textContent,
          current: link.getAttribute('aria-current'),
        })),
      );
      assertEquals(
        panes.map(({ key }) => key),
        ['1', '2', '3', '4', '5', '6'],
      );
      assertEquals(
        panes.map(({ label }) => label),
        [...labels],
      );
      assertEquals(
        panes.map(({ current }) => current),
        ['page', null, null, null, null, null],
      );
    });
  }

  await t.step('the top line names the site and marks the current pane, like a tmux status bar', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, javascript: false });
    const tabs = await page.evaluate(() =>
      [...document.querySelectorAll('.tabs > span')].map((tab) => tab.textContent?.trim()),
    );
    assertEquals(tabs.slice(0, 3), ['igorj.dev', '1:home*', '2:projects']);
  });
});

Deno.test('the home presents the author and the latest work', async (t) => {
  await using session = await Session.start();

  await t.step('the name is the page heading, with the photo, the role and the three lines', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, javascript: false });
    const hero = await page.evaluate(() => ({
      heading: document.querySelector('h1')?.textContent?.trim(),
      photo: document.querySelector('.hero__photo')?.getAttribute('aria-label'),
      role: document.querySelector('.hero__role')?.textContent?.trim(),
      lines: [...document.querySelectorAll('.hero__lines li')].map((line) => line.textContent),
    }));
    assertEquals(hero, {
      heading: NAME,
      photo: 'Fixture photo',
      role: 'Developer',
      lines: ['Fixture line one.', 'Fixture line two.', 'Fixture line three.'],
    });
  });

  await t.step('recent rows: the three latest posts with their category, then the featured projects', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, javascript: false });
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('#recent .recent__row')].map((row) => [
        row.querySelector('.recent__kind')?.textContent,
        row.querySelector('.recent__title')?.textContent,
      ]),
    );
    assertEquals(rows, [
      ['Entertainment', 'Film fixture post'],
      ['Notes', 'Post só em português'],
      ['Professional', 'Second fixture post'],
      ['Project', 'Fixture project'],
    ]);
  });
});

Deno.test('the home boxes show live facts: the build, the week of music and the latest films', async (t) => {
  await using session = await Session.start();

  await t.step('the boxes are system, listening and watched, each titled on its border', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, javascript: false });
    const boxes = await page.evaluate(() =>
      [...document.querySelectorAll('.home__widgets > .panel')].map((box) => [
        box.id,
        box.querySelector(':scope > .panel__title')?.textContent?.trim(),
      ]),
    );
    assertEquals(boxes, [
      ['system', 'system'],
      ['listening', 'listening'],
      ['watched', 'watched'],
    ]);
  });

  await t.step('the listening box sums the week and scales each bar to the most played artist', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, javascript: false });
    const listening = await page.evaluate(() => ({
      total: document.querySelector('#listening .panel__meta')?.textContent?.trim(),
      bars: [...document.querySelectorAll('#listening .bars__row')].map((row) => {
        const track = row.querySelector('.bars__track') as Element;
        const fill = row.querySelector('.bars__fill') as Element;
        return [
          row.querySelector('.bars__name')?.textContent?.trim(),
          Math.round((fill.getBoundingClientRect().width / track.getBoundingClientRect().width) * 100),
          row.querySelector('.bars__count')?.textContent,
        ];
      }),
    }));
    assertEquals(listening.total, '17 plays this week');
    assertEquals(listening.bars, [
      ['Fixture Artist', 100, '12 plays'],
      ['Second Artist', 42, '5 plays'],
    ]);
  });
});

Deno.test('with JavaScript the name is drawn in moving characters, and stays a heading for screen readers', async (t) => {
  await using session = await Session.start();

  const read = () => {
    const drawing = document.querySelector('.hero__ascii');
    const heading = document.querySelector('h1') as HTMLElement;
    return {
      drawn: drawing?.textContent ?? null,
      hidden: drawing?.getAttribute('aria-hidden') ?? null,
      heading: heading.textContent?.trim(),
      headingShown: heading.getBoundingClientRect().width > 1,
    };
  };

  await t.step('without JavaScript the heading shows the name in plain text', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, javascript: false });
    const name = await page.evaluate(read);
    assertEquals([name.drawn, name.headingShown], [null, true]);
  });

  await t.step('with it, a drawing hidden from screen readers replaces the visible heading', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.evaluate(() => document.fonts.ready);
    const name = await page.evaluate(read);
    assertEquals([name.hidden, name.heading, name.headingShown], ['true', NAME, false]);
    assert((name.drawn?.split('\n').length ?? 0) > 4, 'the drawing has several rows');
  });

  await t.step('the drawing moves, and stands still for visitors who ask for reduced motion', async () => {
    const moving = await session.open(HOME_EN, { viewport: WIDE });
    await moving.evaluate(() => new Promise((resolve) => setTimeout(resolve, 400)));
    const first = (await moving.evaluate(read)).drawn;
    await moving.evaluate(() => new Promise((resolve) => setTimeout(resolve, 400)));
    assertNotEquals((await moving.evaluate(read)).drawn, first);

    const still = await session.open(HOME_EN, { viewport: WIDE, reducedMotion: true });
    await still.evaluate(() => new Promise((resolve) => setTimeout(resolve, 400)));
    const before = (await still.evaluate(read)).drawn;
    await still.evaluate(() => new Promise((resolve) => setTimeout(resolve, 400)));
    assertEquals((await still.evaluate(read)).drawn, before);
  });
});

Deno.test('the role ends in a block cursor one cell wide that blinks unless motion is reduced', async (t) => {
  await using session = await Session.start();

  const read = () => {
    const role = document.querySelector('.hero__role') as Element;
    const cursor = role.querySelector('.cursor') as Element;
    return {
      last: role.lastElementChild === cursor,
      hidden: cursor.getAttribute('aria-hidden'),
      width: cursor.getBoundingClientRect().width,
      cell: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-width')),
      animation: getComputedStyle(cursor).animationName,
      title: document.title,
    };
  };

  await t.step('blinking by default, with the name and role as the page title', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    const cursor = await page.evaluate(read);
    assertEquals([cursor.last, cursor.hidden, cursor.animation], [true, 'true', 'cursor-blink']);
    assertAlmostEquals(cursor.width, cursor.cell, 0.01);
    assertEquals(cursor.title, `${NAME} — Developer`);
  });

  await t.step('still when the visitor asks for reduced motion', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, reducedMotion: true });
    assertEquals((await page.evaluate(read)).animation, 'none');
  });
});
