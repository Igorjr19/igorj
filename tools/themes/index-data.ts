import type { ThemeFamily } from './types.ts';

export interface ThemeIndex {
  readonly defaultFamily: string;
  readonly families: readonly {
    readonly name: string;
    readonly label: string;
    readonly themes: readonly { readonly id: string; readonly name: string; readonly variant: 'light' | 'dark' }[];
  }[];
}

/** What the theme picker lists: families with their light and dark themes, in the order the manifests define them. */
export function describeThemes(families: readonly ThemeFamily[], defaultFamily: string): ThemeIndex {
  return {
    defaultFamily,
    families: families.map(({ name, light, dark }) => ({
      name,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      themes: [light, dark].map(({ manifest }) => ({
        id: manifest.id,
        name: manifest.name,
        variant: manifest.variant,
      })),
    })),
  };
}
