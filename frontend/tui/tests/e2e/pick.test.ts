/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { findAccessibilityViolations } from './support/axe.ts';
import { waitToLeave } from './support/navigation.ts';
import { HOME_EN, POSTS_EN, PROFESSIONAL_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

type Page = Awaited<ReturnType<Session['open']>>;

async function openBox(page: Page, key: 'f' | '#') {
  await page.keyboard.press(key);
  await page.waitForFunction(() => document.querySelector('dialog.pick[open]') !== null);
}

const options = () =>
  [...document.querySelectorAll('.pick__option')].map((option) => option.querySelector('.pick__label')?.textContent);

Deno.test('f opens a palette that finds pages and runs commands', async (t) => {
  await using session = await Session.start();

  await t.step('nothing of it loads before it is asked for', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    const loaded = await page.evaluate(
      () => [...document.scripts].filter((script) => script.src.includes('/pick/')).length,
    );
    assertEquals(loaded, 0);
  });

  await t.step('typing narrows the list, best first, and Enter opens the page', async () => {
    const page = await openPalette(session);
    await page.keyboard.type('fix pro');
    assertEquals((await page.evaluate(options))[0], 'Fixture project');
    await page.keyboard.press('Enter');
    await waitToLeave(page, HOME_EN);
    assertEquals(new URL(page.url).pathname, '/en/projects/fixture-project/');
  });

  await t.step('> lists the commands; the best one is completed in gray and Tab takes it', async () => {
    const page = await openPalette(session);
    await page.keyboard.type('>th');
    const ghost = await page.evaluate(() => document.querySelector('.pick__ghost')?.textContent);
    await page.keyboard.press('Tab');
    const value = await page.evaluate(() => document.querySelector<HTMLInputElement>('.pick__input')?.value);
    assertEquals([ghost, value], ['>theme: choose the theme', '>theme: choose the theme']);
  });

  await t.step('a command acts on the page: the side column hides', async () => {
    const page = await openPalette(session);
    await page.keyboard.type('>side');
    await page.keyboard.press('Enter');
    assertEquals(await page.evaluate(() => document.querySelector('.side')?.checkVisibility()), false);
  });

  await t.step('the search button opens it with the mouse, and a click on a row opens that page', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.locator('.win__controls [data-action="palette"]').click();
    await page.waitForFunction(() => document.querySelector('dialog.pick[open]') !== null);
    await page.locator('.pick__option:nth-child(2)').click();
    await waitToLeave(page, HOME_EN);
    assert(new URL(page.url).pathname !== HOME_EN);
  });

  await t.step('the open palette passes the accessibility checks', async () => {
    const page = await openPalette(session);
    assertEquals(await findAccessibilityViolations(page), []);
  });
});

async function openPalette(session: Session): Promise<Page> {
  const page = await session.open(HOME_EN, { viewport: WIDE });
  await openBox(page, 'f');
  return page;
}

Deno.test('# opens the filter of the blog, one category at a time', async (t) => {
  await using session = await Session.start();

  await t.step('it starts with all posts, marked as open, then each category with its count', async () => {
    const page = await session.open(POSTS_EN, { viewport: WIDE });
    await openBox(page, '#');
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('.pick__option')].map((option) => [
        option.querySelector('.pick__label')?.textContent,
        option.querySelector('.pick__hint')?.textContent ?? null,
        option.getAttribute('data-current'),
      ]),
    );
    assertEquals(rows, [
      ['all posts', null, 'true'],
      ['Entertainment', '1', null],
      ['Notes', '1', null],
      ['Professional', '1', null],
    ]);
  });

  await t.step('choosing one opens its page, and the button there names it', async () => {
    const page = await session.open(POSTS_EN, { viewport: WIDE });
    await page.locator('.items__filter').click();
    await page.waitForFunction(() => document.querySelector('dialog.pick[open]') !== null);
    await page.keyboard.type('prof');
    await page.keyboard.press('Enter');
    await waitToLeave(page, POSTS_EN);
    const current = await page.evaluate(() => document.querySelector('.items__filter-current')?.textContent);
    assertEquals([new URL(page.url).pathname, current], [PROFESSIONAL_EN, 'professional']);
  });

  await t.step('with JavaScript the links give way to the button; without it, the links stay', async () => {
    for (const javascript of [true, false]) {
      const page = await session.open(POSTS_EN, { viewport: WIDE, javascript });
      const shown = await page.evaluate(() => [
        document.querySelector('.filter')?.checkVisibility() ?? false,
        document.querySelector('.items__filter')?.checkVisibility() ?? false,
      ]);
      assertEquals(shown, javascript ? [false, true] : [true, false]);
    }
  });
});
