import type { ResolvedTheme, ThemeFamily, Variant } from './types.ts';

/** The variant the family uses when it follows the system: the only one, or the one marked `system = true`. */
function systemVariant(name: string, members: readonly ResolvedTheme[], variant: Variant): ResolvedTheme {
  const candidates = members.filter((theme) => theme.manifest.variant === variant);
  if (candidates.length === 0) {
    throw new Error(`Family "${name}" needs a light and a dark variant`);
  }
  const marked = candidates.length === 1 ? candidates : candidates.filter((theme) => theme.manifest.system);
  const [chosen, ...rest] = marked;
  if (!chosen || rest.length > 0) {
    throw new Error(
      `Family "${name}" has ${candidates.length} ${variant} variants; mark exactly one with system = true`,
    );
  }
  return chosen;
}

/** Groups themes by family, keeping the manifests' order with the light themes first. */
export function groupFamilies(themes: readonly ResolvedTheme[]): ThemeFamily[] {
  const members = new Map<string, ResolvedTheme[]>();
  for (const theme of themes) {
    members.set(theme.manifest.family, [...(members.get(theme.manifest.family) ?? []), theme]);
  }
  return [...members].map(([name, list]) => ({
    name,
    light: systemVariant(name, list, 'light'),
    dark: systemVariant(name, list, 'dark'),
    themes: [
      ...list.filter((theme) => theme.manifest.variant === 'light'),
      ...list.filter((theme) => theme.manifest.variant === 'dark'),
    ],
  }));
}
