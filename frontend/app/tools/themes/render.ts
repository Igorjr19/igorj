import type { AccentColors, AccentSet, ResolvedTheme, ThemeFamily } from './types.ts';

const INDENT = '  ';

function declarations(theme: ResolvedTheme, depth: number): string {
  const pad = INDENT.repeat(depth);
  const scheme = `${pad}color-scheme: ${theme.manifest.variant};`;
  const colors = Object.entries(theme.colors).map(([name, value]) => `${pad}--color-${name}: ${value};`);
  return [scheme, ...colors].join('\n');
}

function rule(selector: string, theme: ResolvedTheme, depth: number): string {
  const pad = INDENT.repeat(depth);
  return `${pad}${selector} {\n${declarations(theme, depth + 1)}\n${pad}}`;
}

function followSystem(selector: string, family: ThemeFamily): string {
  return [
    rule(selector, family.light, 1),
    `${INDENT}@media (prefers-color-scheme: dark) {`,
    rule(selector, family.dark, 2),
    `${INDENT}}`,
  ].join('\n');
}

function accentRule(selector: string, colors: AccentColors | undefined, depth: number): string {
  const pad = INDENT.repeat(depth);
  const inner = INDENT.repeat(depth + 1);
  return `${pad}${selector} {\n${inner}--color-accent: ${colors?.accent};\n${inner}--color-link: ${colors?.link};\n${pad}}`;
}

function accentFollowingSystem(
  selector: string,
  family: ThemeFamily,
  accent: Readonly<Record<string, AccentSet['colors'][string]>>,
  name: string,
): string {
  return [
    accentRule(selector, accent[family.light.manifest.id]?.[name], 1),
    `${INDENT}@media (prefers-color-scheme: dark) {`,
    accentRule(selector, accent[family.dark.manifest.id]?.[name], 2),
    `${INDENT}}`,
  ].join('\n');
}

/**
 * Accent rules come after the theme rules and are one attribute more specific, so they win wherever they apply.
 * No `data-accent` means the default accent; other families never match, so they keep their own accent.
 */
function renderAccents(accents: AccentSet, families: readonly ThemeFamily[], defaultFamily: string): string[] {
  const family = families.find((candidate) => candidate.name === accents.family);
  if (!family) {
    throw new Error(`Accent family "${accents.family}" does not exist`);
  }
  return accents.names.flatMap((name) => {
    const chosen =
      name === accents.default ? `:is(:not([data-accent]), [data-accent='${name}'])` : `[data-accent='${name}']`;
    return [
      ...(family.name === defaultFamily
        ? [accentFollowingSystem(`:root${chosen}:not([data-theme-family], [data-theme])`, family, accents.colors, name)]
        : []),
      accentFollowingSystem(
        `[data-theme-family='${family.name}']${chosen}:not([data-theme])`,
        family,
        accents.colors,
        name,
      ),
      ...family.themes.map((theme) =>
        accentRule(`[data-theme='${theme.manifest.id}']${chosen}`, accents.colors[theme.manifest.id]?.[name], 1),
      ),
    ];
  });
}

/**
 * Rules share the same specificity, so source order decides:
 * the default family follows the system, a chosen family follows the system,
 * and an explicitly chosen theme overrides the system.
 */
export function renderThemeCss(
  families: readonly ThemeFamily[],
  defaultFamily: string,
  accents: AccentSet | null = null,
): string {
  const fallback = families.find((family) => family.name === defaultFamily);
  if (!fallback) {
    throw new Error(`Default family "${defaultFamily}" does not exist`);
  }
  const themes = families.flatMap((family) => family.themes);
  const blocks = [
    followSystem(':root', fallback),
    ...families.map((family) => followSystem(`[data-theme-family='${family.name}']`, family)),
    ...themes.map((theme) => rule(`[data-theme='${theme.manifest.id}']`, theme, 1)),
    ...(accents ? renderAccents(accents, families, defaultFamily) : []),
  ];
  return `@layer app.tokens {\n${blocks.join('\n\n')}\n}\n`;
}
