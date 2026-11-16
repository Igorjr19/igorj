import { hexToRgb } from './hex.ts';

/** WCAG 2 minimum for text. */
export const MIN_TEXT_CONTRAST = 4.5;
/** WCAG 2 minimum for non-text indicators such as focus rings and borders. */
export const MIN_UI_CONTRAST = 3;

const toLinear = (channel: number) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
