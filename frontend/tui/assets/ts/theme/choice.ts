import type { SavedTheme } from './storage.ts';

const FAMILY_PREFIX = 'family:';
const THEME_PREFIX = 'theme:';

/** The picker's radio values: a family follows the system, a theme stays as chosen. */
export function choiceToSaved(choice: string): SavedTheme | null {
  if (choice.startsWith(FAMILY_PREFIX)) {
    return { family: choice.slice(FAMILY_PREFIX.length) };
  }
  return choice.startsWith(THEME_PREFIX) ? { theme: choice.slice(THEME_PREFIX.length) } : null;
}

/** Which radio is on: an explicit theme wins over a family, and nothing saved means the default family. */
export function savedToChoice(saved: SavedTheme | null, defaultFamily: string): string {
  if (saved?.theme) {
    return `${THEME_PREFIX}${saved.theme}`;
  }
  return `${FAMILY_PREFIX}${saved?.family ?? defaultFamily}`;
}
