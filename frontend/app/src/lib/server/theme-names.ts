import { readFile } from 'node:fs/promises';
import type { ThemeIndex } from '../pick/entries.ts';
import type { ThemeNames } from '../theme/status.ts';

const THEMES = process.env['THEMES_MANIFEST'] ?? '../../generated/data/themes.json';

/** What the status line needs to name the theme in effect: which theme a family picks for light and dark, and the names. */
export async function readThemeNames(): Promise<ThemeNames> {
  const index = JSON.parse(await readFile(THEMES, 'utf8')) as ThemeIndex;
  const family = index.accents?.family;
  return {
    defaultFamily: index.defaultFamily,
    system: Object.fromEntries(
      index.families.map((entry) => [entry.name, [entry.system.light, entry.system.dark] as const]),
    ),
    names: Object.fromEntries(index.families.flatMap((entry) => entry.themes.map((theme) => [theme.id, theme.name]))),
    accents: index.accents ? { family: family ?? '', default: index.accents.default } : null,
  };
}
