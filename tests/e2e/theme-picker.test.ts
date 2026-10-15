/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { findAccessibilityViolations } from './support/axe.ts';
import { HOME_EN, POST_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

async function openSaved(session: Session, path: string, saved: string, colorScheme?: 'light' | 'dark') {
  const page = await session.open(path, { viewport: WIDE, ...(colorScheme && { colorScheme }) });
  await page.evaluate((value: string) => localStorage.setItem('theme', value), { args: [saved] });
  await page.reload();
  return page;
}

// A dialog's close event is queued after the dialog closes, so the page settles for a tick before it is read.
const state = async () => {
  await new Promise((resolve) => setTimeout(resolve));
  return {
    open: document.querySelector<HTMLDialogElement>('.theme-picker')?.open ?? false,
    family: document.documentElement.dataset['themeFamily'] ?? null,
    theme: document.documentElement.dataset['theme'] ?? null,
    saved: localStorage.getItem('theme'),
    background: getComputedStyle(document.body).backgroundColor,
  };
};

Deno.test('t opens the theme picker with every family and previews while moving', async (t) => {
  await using session = await Session.start();

  await t.step('it lists every family with a follow-the-system choice and its light and dark themes', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    const options = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLInputElement>('.theme-picker input')].map((input) => input.value),
    );
    assertEquals(options, [
      'family:catppuccin',
      'theme:catppuccin-latte',
      'theme:catppuccin-mocha',
      'family:one',
      'theme:one-light',
      'theme:one-dark',
    ]);
  });

  await t.step('it opens on the theme in effect, here the default family', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.press('t');
    assertEquals(
      await page.evaluate(() => [
        document.querySelector<HTMLDialogElement>('.theme-picker')?.open,
        (document.activeElement as HTMLInputElement).value,
      ]),
      [true, 'family:catppuccin'],
    );
  });

  await t.step('moving with the arrows previews the theme without saving it', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, colorScheme: 'dark' });
    const initial = await page.evaluate(state);
    await page.keyboard.press('t');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    const previewed = await page.evaluate(state);
    assertEquals([previewed.theme, previewed.saved], ['one-dark', null]);
    assertEquals(previewed.background !== initial.background, true);
  });
});

Deno.test('the picker keeps only what is applied', async (t) => {
  await using session = await Session.start();

  await t.step('Esc puts the page back as it was and saves nothing', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, colorScheme: 'dark' });
    const initial = await page.evaluate(state);
    await page.keyboard.press('t');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    assertEquals(await page.evaluate(state), initial);
  });

  await t.step('applying saves the theme, which survives a reload before the first paint', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.press('t');
    for (let step = 0; step < 5; step++) {
      await page.keyboard.press('ArrowDown');
    }
    await page.keyboard.press('Enter');
    const applied = await page.evaluate(state);
    assertEquals([applied.open, applied.theme, applied.saved], [false, 'one-dark', '{"theme":"one-dark"}']);
    await page.reload();
    assertEquals((await page.evaluate(state)).theme, 'one-dark');
    await page.evaluate(() => localStorage.clear());
  });

  await t.step('choosing a family follows the system again and clears an earlier theme', async () => {
    const page = await openSaved(session, HOME_EN, '{"theme":"one-dark"}');
    await page.keyboard.press('t');
    assertEquals(await page.evaluate(() => (document.activeElement as HTMLInputElement).value), 'theme:one-dark');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    const applied = await page.evaluate(state);
    assertEquals([applied.family, applied.theme, applied.saved], ['one', null, '{"family":"one"}']);
    await page.evaluate(() => localStorage.clear());
  });
});

Deno.test('the open picker is accessible in every theme', async (t) => {
  await using session = await Session.start();

  await t.step('it passes the accessibility checks in both color schemes of each family', async () => {
    for (const colorScheme of ['light', 'dark'] as const) {
      for (const family of ['catppuccin', 'one']) {
        const page = await openSaved(session, POST_EN, JSON.stringify({ family }), colorScheme);
        await page.keyboard.press('t');
        assertEquals(await findAccessibilityViolations(page), []);
      }
    }
  });
});
