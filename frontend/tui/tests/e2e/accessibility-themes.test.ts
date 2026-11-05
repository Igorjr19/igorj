/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { THEME_STORAGE_KEY } from '../../assets/ts/theme/storage.ts';
import { findAccessibilityViolations } from './support/axe.ts';
import { CV_EN, HOME_EN, POST_EN, POSTS_EN, RESEARCH_ITEM_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

interface ThemeIndex {
  readonly families: readonly { readonly themes: readonly { readonly id: string }[] }[];
}

const index = JSON.parse(await Deno.readTextFile('generated/data/themes.json')) as ThemeIndex;
const THEMES = index.families.flatMap((family) => family.themes.map((theme) => theme.id));
const PAGES = [HOME_EN, POSTS_EN, POST_EN, CV_EN, RESEARCH_ITEM_EN];

async function openWithTheme(session: Session, path: string, theme: string) {
  const page = await session.open(path);
  await page.evaluate((key: string, value: string) => localStorage.setItem(key, value), {
    args: [THEME_STORAGE_KEY, JSON.stringify({ theme })],
  });
  await page.reload();
  return page;
}

Deno.test('every theme keeps every kind of page within WCAG 2.1 AA', async (t) => {
  await using session = await Session.start();

  for (const theme of THEMES) {
    await t.step(theme, async () => {
      for (const path of PAGES) {
        const page = await openWithTheme(session, path, theme);
        assertEquals(await findAccessibilityViolations(page), [], `${theme} on ${path}`);
      }
    });
  }
});

Deno.test('every theme keeps the selected row and the open help readable', async (t) => {
  await using session = await Session.start();

  for (const theme of THEMES) {
    await t.step(`${theme}: reverse video on the focused row`, async () => {
      const page = await openWithTheme(session, HOME_EN, theme);
      await page.keyboard.press('4');
      assertEquals(await findAccessibilityViolations(page), [], theme);
    });
    await t.step(`${theme}: help dialog`, async () => {
      const page = await openWithTheme(session, POST_EN, theme);
      await page.keyboard.press('?');
      assertEquals(await findAccessibilityViolations(page), [], theme);
    });
  }
});
