import type { AccentSet, ThemeFamily } from './types.ts';

export interface ThemeIndex {
  readonly defaultFamily: string;
  readonly families: readonly {
    readonly name: string;
    readonly label: string;
    /** The themes used when the family follows the system. */
    readonly system: { readonly light: string; readonly dark: string };
    readonly themes: readonly {
      readonly id: string;
      readonly name: string;
      readonly variant: 'light' | 'dark';
      /** A strip of the theme's colors for the picker: background, text, link, success, warning. */
      readonly swatch: readonly string[];
    }[];
  }[];
  /** The accents a visitor can choose, with each accent's color on every theme of its family. */
  readonly accents: {
    readonly family: string;
    readonly default: string;
    readonly options: readonly { readonly name: string; readonly colors: Readonly<Record<string, string>> }[];
  } | null;
}

/** What the theme picker lists: families with their light and dark themes, in the order the manifests define them. */
export function describeThemes(
  families: readonly ThemeFamily[],
  defaultFamily: string,
  accents: AccentSet | null = null,
): ThemeIndex {
  return {
    defaultFamily,
    families: families.map(({ name, light, dark, themes }) => ({
      name,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      system: { light: light.manifest.id, dark: dark.manifest.id },
      themes: themes.map(({ manifest, colors }) => ({
        id: manifest.id,
        name: manifest.name,
        variant: manifest.variant,
        swatch: [colors.background, colors.text, colors.link, colors.success, colors.warning],
      })),
    })),
    accents: accents && {
      family: accents.family,
      default: accents.default,
      options: accents.names.map((name) => ({
        name,
        colors: Object.fromEntries(
          Object.entries(accents.colors).map(([theme, colors]) => [theme, colors[name]?.accent ?? '']),
        ),
      })),
    },
  };
}
