import { contrastRatio } from '../color/contrast.ts';
import { mixOklab } from '../color/oklab.ts';
import type { ContrastRequirement, Role, ThemeColors } from './types.ts';

const STEPS = 24;

/**
 * The color itself when it already reaches the minimum against the background; otherwise the color
 * pulled towards `toward` (the theme's text color) just far enough to reach it, keeping its hue.
 */
export function legibleColor(color: string, background: string, toward: string, minimum: number): string {
  if (contrastRatio(color, background) >= minimum) {
    return color;
  }
  let low = 0;
  let high = 1;
  for (let step = 0; step < STEPS; step++) {
    const middle = (low + high) / 2;
    if (contrastRatio(mixOklab(color, toward, middle), background) >= minimum) {
      high = middle;
    } else {
      low = middle;
    }
  }
  return mixOklab(color, toward, high);
}

/** Roles that stay as the palette gives them: the text itself and the pairs it is measured against. */
const FIXED: ReadonlySet<string> = new Set<Role>(['background', 'text', 'selection-background', 'selection-text']);

/** Adjusts every role that misses its contrast requirement, towards the text color, as little as possible. */
export function ensureLegible(colors: ThemeColors, requirements: readonly ContrastRequirement[]): ThemeColors {
  const adjusted: Record<string, string> = { ...colors };
  for (const { foreground, background, minimum } of requirements) {
    if (!FIXED.has(foreground)) {
      adjusted[foreground] = legibleColor(
        adjusted[foreground] as string,
        adjusted[background] as string,
        colors.text,
        minimum,
      );
    }
  }
  return adjusted as ThemeColors;
}
