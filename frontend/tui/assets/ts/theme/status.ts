/// <reference lib="dom" />
import { savedToChoice } from './choice.ts';
import type { SavedTheme } from './storage.ts';

/** What the page tells the status line about the themes, as JSON on the slot. */
export interface ThemeNames {
  readonly defaultFamily: string;
  /** Family → [light theme id, dark theme id] used when it follows the system. */
  readonly system: Readonly<Record<string, readonly [string, string]>>;
  readonly names: Readonly<Record<string, string>>;
  readonly accents: { readonly family: string; readonly default: string } | null;
}

/** The choice on the root element, as the head script or the picker left it. */
export function currentChoice(root: HTMLElement = document.documentElement): SavedTheme | null {
  const { themeFamily, theme, accent } = root.dataset;
  return themeFamily || theme || accent
    ? { ...(themeFamily && { family: themeFamily }), ...(theme && { theme }), ...(accent && { accent }) }
    : null;
}

/** The theme in effect: the chosen one, or the variant the system picks for the chosen or default family. */
export function effectiveTheme(names: ThemeNames, saved: SavedTheme | null, dark: boolean): string {
  const choice = savedToChoice(saved, names.defaultFamily);
  if (choice.startsWith('theme:')) {
    return choice.slice('theme:'.length);
  }
  const [light, darkId] = names.system[choice.slice('family:'.length)] ?? ['', ''];
  return dark ? darkId : light;
}

/** The name the status line shows, with the accent for the family that has accents. */
export function themeLabel(names: ThemeNames, saved: SavedTheme | null, dark: boolean): string {
  const id = effectiveTheme(names, saved, dark);
  const name = names.names[id] ?? '';
  const accents = names.accents;
  return accents && id.startsWith(`${accents.family}-`) ? `${name} · ${saved?.accent ?? accents.default}` : name;
}

/** Writes the theme in effect into the status line. */
export function renderThemeStatus(): void {
  for (const slot of document.querySelectorAll<HTMLElement>('[data-status-theme]')) {
    const names = JSON.parse(slot.dataset['themes'] ?? 'null') as ThemeNames | null;
    if (names) {
      slot.textContent = themeLabel(names, currentChoice(), matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }
}
