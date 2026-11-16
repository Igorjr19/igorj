import { MIN_TEXT_CONTRAST, MIN_UI_CONTRAST } from '../color/contrast.ts';
import { legibleColor } from './legible.ts';
import type { AccentColors, AccentSet, ResolvedTheme } from './types.ts';

/** One flavor of a palette that names its colors and marks the accents, such as Catppuccin's. */
export interface AccentFlavor {
  readonly colors: Readonly<Record<string, { readonly hex: string; readonly accent: boolean; readonly order: number }>>;
}

export interface AccentSource {
  readonly family: string;
  readonly default: string;
  /** Theme id → flavor name in the palette. */
  readonly flavors: Readonly<Record<string, string>>;
}

function accentNames(flavor: AccentFlavor): string[] {
  return Object.entries(flavor.colors)
    .filter(([, color]) => color.accent)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([name]) => name);
}

/** Each accent of a theme as a border color (3:1) and a text color (4.5:1) on that theme's background. */
function themeAccents(
  theme: ResolvedTheme,
  flavor: AccentFlavor,
  names: readonly string[],
): Record<string, AccentColors> {
  const { background, text } = theme.colors;
  return Object.fromEntries(
    names.map((name) => {
      const hex = flavor.colors[name]?.hex.toLowerCase() as string;
      return [
        name,
        {
          accent: legibleColor(hex, background, text, MIN_UI_CONTRAST),
          link: legibleColor(hex, background, text, MIN_TEXT_CONTRAST),
        },
      ];
    }),
  );
}

/** The accents of every theme the source maps to a flavor; every one of the family's themes needs a flavor. */
export function resolveAccents(
  source: AccentSource,
  palette: Readonly<Record<string, AccentFlavor>>,
  themes: readonly ResolvedTheme[],
): AccentSet {
  const members = themes.filter((theme) => theme.manifest.family === source.family);
  const flavorOf = (theme: ResolvedTheme): AccentFlavor => {
    const flavor = palette[source.flavors[theme.manifest.id] ?? ''];
    if (!flavor) {
      throw new Error(`Theme "${theme.manifest.id}" has no flavor in the accent palette`);
    }
    return flavor;
  };
  const first = members[0];
  if (!first) {
    throw new Error(`Accent family "${source.family}" has no themes`);
  }
  const names = accentNames(flavorOf(first));
  if (!names.includes(source.default)) {
    throw new Error(`Default accent "${source.default}" is not in the palette`);
  }
  return {
    family: source.family,
    default: source.default,
    names,
    colors: Object.fromEntries(
      members.map((theme) => [theme.manifest.id, themeAccents(theme, flavorOf(theme), names)]),
    ),
  };
}
