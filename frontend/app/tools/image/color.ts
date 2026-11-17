import { grayscale, toLinear } from './filters.ts';
import type { Bits, Gray, Rgba } from './types.ts';

/** The color roles a theme has that a picture can borrow: neutrals take the text, hues take the nearest role. */
export const COLOR_ROLES = ['text', 'accent', 'link', 'success', 'warning', 'error'] as const;
export type ColorRole = (typeof COLOR_ROLES)[number];

/** The role a pixel takes: near grays and near black or white take the text color, the rest go by hue. */
export function colorRole(red: number, green: number, blue: number): ColorRole {
  const high = Math.max(red, green, blue) / 255;
  const low = Math.min(red, green, blue) / 255;
  const chroma = high - low;
  const lightness = (high + low) / 2;
  if (chroma < 0.18 || lightness < 0.08 || lightness > 0.94) {
    return 'text';
  }
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  let hue: number;
  if (high === r) {
    hue = (((g - b) / chroma) % 6) * 60;
  } else if (high === g) {
    hue = ((b - r) / chroma + 2) * 60;
  } else {
    hue = ((r - g) / chroma + 4) * 60;
  }
  hue = (hue + 360) % 360;
  if (hue < 20 || hue >= 330) {
    return 'error';
  }
  if (hue < 70) {
    return 'warning';
  }
  if (hue < 170) {
    return 'success';
  }
  return hue < 260 ? 'link' : 'accent';
}

export interface RoleBits {
  readonly role: ColorRole;
  /** The role's pixels where the dither is bright: the ink of a dark theme. */
  readonly bright: Bits;
  /** The role's pixels where the dither is dark: the ink of a light theme. */
  readonly dark: Bits;
}

/** Splits a dithered picture by the role of the color each pixel had, leaving out the roles it has no pixel of. */
export function splitByRole(image: Rgba, bits: Bits): RoleBits[] {
  const { width, height } = bits;
  const layers = new Map<ColorRole, { bright: Uint8Array; dark: Uint8Array; count: number }>();
  for (let at = 0; at < width * height; at += 1) {
    const role = colorRole(image.data[at * 4] ?? 0, image.data[at * 4 + 1] ?? 0, image.data[at * 4 + 2] ?? 0);
    const layer = layers.get(role) ?? {
      bright: new Uint8Array(width * height),
      dark: new Uint8Array(width * height),
      count: 0,
    };
    (bits.data[at] ? layer.bright : layer.dark)[at] = 1;
    layer.count += 1;
    layers.set(role, layer);
  }
  return COLOR_ROLES.flatMap((role) => {
    const layer = layers.get(role);
    return layer
      ? [{ role, bright: { width, height, data: layer.bright }, dark: { width, height, data: layer.dark } }]
      : [];
  });
}

/** The share of a colored pixel that carries ink: about half, a little more where the color is light, so a bar is
 * as visible on a dark theme (ink where the picture is bright) as on a light one (ink where it is dark). */
const COLOR_COVERAGE = { least: 0.4, spread: 0.35 } as const;

/** What the dither reads: the brightness of the neutral pixels as a theme would show it, and a middling value for the colored ones, which carry their hue and not their brightness. */
export function colorGray(image: Rgba): Gray {
  const bright = toLinear(grayscale(image));
  const shown = grayscale(image);
  const data = Float32Array.from(bright.data, (value, at) => {
    const role = colorRole(image.data[at * 4] ?? 0, image.data[at * 4 + 1] ?? 0, image.data[at * 4 + 2] ?? 0);
    return role === 'text' ? value : COLOR_COVERAGE.least + COLOR_COVERAGE.spread * (shown.data[at] ?? 0);
  });
  return { width: image.width, height: image.height, data };
}
