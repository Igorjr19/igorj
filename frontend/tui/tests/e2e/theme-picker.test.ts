/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { findAccessibilityViolations } from './support/axe.ts';
import { HOME_EN, POST_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

type Page = Awaited<ReturnType<Session['open']>>;

async function openSaved(session: Session, path: string, saved: string, colorScheme?: 'light' | 'dark') {
  const page = await session.open(path, { viewport: WIDE, ...(colorScheme && { colorScheme }) });
  await page.evaluate((value: string) => localStorage.setItem('theme', value), { args: [saved] });
  await page.reload();
  return page;
}

/** Opens the theme box; it loads on first use, so the test waits for it to be there. */
async function openThemes(page: Page) {
  await page.keyboard.press('t');
  await page.waitForFunction(() => document.querySelector('dialog.pick[open]') !== null);
}

// A dialog's close event is queued after the dialog closes, so the page settles for a tick before it is read.
const state = async () => {
  await new Promise((resolve) => setTimeout(resolve));
  return {
    open: document.querySelector('dialog.pick[open]') !== null,
    family: document.documentElement.dataset['themeFamily'] ?? null,
    theme: document.documentElement.dataset['theme'] ?? null,
    saved: localStorage.getItem('theme'),
    background: getComputedStyle(document.body).backgroundColor,
  };
};

const selected = () => document.querySelector('.pick__option[aria-selected="true"] .pick__label')?.textContent;

Deno.test('t opens the theme box with every family and previews while moving', async (t) => {
  await using session = await Session.start();

  await t.step('it lists every family following the system, then its themes, with their colors', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await openThemes(page);
    const options = await page.evaluate(() =>
      [...document.querySelectorAll('.pick__option')].map((option) => [
        option.querySelector('.pick__label')?.textContent,
        option.querySelectorAll('.pick__swatch i').length,
      ]),
    );
    assertEquals(
      options.map(([label]) => label),
      [
        'Catppuccin · follows the system',
        'Catppuccin Latte',
        'Catppuccin Frappé',
        'Catppuccin Macchiato',
        'Catppuccin Mocha',
        'Gruvbox · follows the system',
        'Gruvbox Light',
        'Gruvbox Dark',
        'One · follows the system',
        'One Light',
        'One Dark',
      ],
    );
    assertEquals(new Set(options.map(([, colors]) => colors)), new Set([5]));
  });

  await t.step('it opens on the theme in effect, here the default family', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await openThemes(page);
    assertEquals(await page.evaluate(selected), 'Catppuccin · follows the system');
  });

  await t.step('moving with j or the arrows previews the theme without saving it', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, colorScheme: 'dark' });
    const initial = await page.evaluate(state);
    await openThemes(page);
    for (let step = 0; step < 7; step++) {
      await page.keyboard.press(step % 2 ? 'j' : 'ArrowDown');
    }
    const previewed = await page.evaluate(state);
    assertEquals([previewed.theme, previewed.saved], ['gruvbox-dark', null]);
    assertEquals(previewed.background !== initial.background, true);
  });

  await t.step('the mouse previews too, and a click applies', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await openThemes(page);
    await page.locator('.pick__option:nth-child(11)').click();
    const applied = await page.evaluate(state);
    assertEquals([applied.open, applied.theme, applied.saved], [false, 'one-dark', '{"theme":"one-dark"}']);
    await page.evaluate(() => localStorage.clear());
  });
});

Deno.test('the theme box keeps only what is applied', async (t) => {
  await using session = await Session.start();

  await t.step('Esc puts the page back as it was and saves nothing', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, colorScheme: 'dark' });
    const initial = await page.evaluate(state);
    await openThemes(page);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    assertEquals(await page.evaluate(state), initial);
  });

  await t.step('Enter saves the theme, which survives a reload before the first paint', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await openThemes(page);
    for (let step = 0; step < 7; step++) {
      await page.keyboard.press('ArrowDown');
    }
    await page.keyboard.press('Enter');
    const applied = await page.evaluate(state);
    assertEquals([applied.open, applied.theme, applied.saved], [false, 'gruvbox-dark', '{"theme":"gruvbox-dark"}']);
    await page.reload();
    assertEquals((await page.evaluate(state)).theme, 'gruvbox-dark');
    await page.evaluate(() => localStorage.clear());
  });

  await t.step('choosing a family follows the system again and clears an earlier theme', async () => {
    const page = await openSaved(session, HOME_EN, '{"theme":"one-dark"}');
    await openThemes(page);
    assertEquals(await page.evaluate(selected), 'One Dark');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    const applied = await page.evaluate(state);
    assertEquals([applied.family, applied.theme, applied.saved], ['one', null, '{"family":"one"}']);
    await page.evaluate(() => localStorage.clear());
  });
});

Deno.test('the open theme box is accessible in every theme', async (t) => {
  await using session = await Session.start();

  await t.step('it passes the accessibility checks in both color schemes of each family', async () => {
    for (const colorScheme of ['light', 'dark'] as const) {
      for (const family of ['catppuccin', 'gruvbox', 'one']) {
        const page = await openSaved(session, POST_EN, JSON.stringify({ family }), colorScheme);
        await openThemes(page);
        assertEquals(await findAccessibilityViolations(page), []);
      }
    }
  });
});

Deno.test('Catppuccin has every flavor and fourteen accents, and the accent is kept like the theme', async (t) => {
  await using session = await Session.start();
  const accentState = () => ({
    accent: document.documentElement.dataset['accent'] ?? null,
    color: getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
    saved: localStorage.getItem('theme'),
    status: document.querySelector('[data-status-theme]')?.textContent ?? null,
  });

  await t.step('the default accent is mauve, named in the status line, with fourteen to choose from', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, colorScheme: 'dark' });
    const initial = await page.evaluate(accentState);
    assertEquals([initial.accent, initial.color, initial.status], [null, '#cba6f7', 'Catppuccin Mocha · mauve']);
    await openThemes(page);
    assertEquals(await page.evaluate(() => document.querySelectorAll('.pick__accent').length), 14);
  });

  await t.step('the arrows change the accent; clicking one previews it; Enter saves it with the theme', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, colorScheme: 'dark' });
    await openThemes(page);
    await page.keyboard.press('ArrowRight');
    assertEquals((await page.evaluate(accentState)).accent, 'red');
    await page.locator('.pick__accent[data-accent="peach"]').click();
    assertEquals((await page.evaluate(accentState)).color, '#fab387');
    await page.keyboard.press('Enter');
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)));
    await page.reload();
    const kept = await page.evaluate(accentState);
    assertEquals(
      [kept.accent, kept.color, kept.saved, kept.status],
      ['peach', '#fab387', '{"family":"catppuccin","accent":"peach"}', 'Catppuccin Mocha · peach'],
    );
    await page.evaluate(() => localStorage.clear());
  });

  await t.step('every flavor stays accessible with the faintest accent', async () => {
    for (const theme of ['catppuccin-latte', 'catppuccin-frappe', 'catppuccin-macchiato', 'catppuccin-mocha']) {
      const page = await openSaved(session, POST_EN, JSON.stringify({ theme, accent: 'yellow' }));
      assertEquals(await findAccessibilityViolations(page), []);
    }
  });
});
