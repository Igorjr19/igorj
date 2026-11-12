import type { ThemesData } from './schema.ts';

export interface PictureColors {
  readonly background: string;
  readonly text: string;
  readonly accent: string;
}

/** The background, text and accent of the default dark theme, for pictures made at build time. */
export function defaultColors(themes: ThemesData): PictureColors {
  const family = themes.families.find((candidate) => candidate.name === themes.defaultFamily);
  const theme = family?.themes.find((candidate) => candidate.id === family.system.dark);
  const [background, text] = theme?.swatch ?? [];
  if (!(theme && background && text)) {
    throw new Error(`The default family "${themes.defaultFamily}" has no dark theme with colors`);
  }
  const accent = themes.accents.options.find((option) => option.name === themes.accents.default)?.colors[theme.id];
  return { background, text, accent: accent ?? text };
}
