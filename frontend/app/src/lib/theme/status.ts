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
