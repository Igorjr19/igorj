import type { Surface } from './share.ts';

/** What the favicon needs beyond {@link Surface}: where the glyph's ink sits, to centre it by what shows. */
export interface GlyphSurface extends Surface {
  textAlign: string;
  measureText(text: string): {
    readonly width: number;
    readonly actualBoundingBoxAscent: number;
    readonly actualBoundingBoxDescent: number;
  };
}

export interface FaviconSpec {
  readonly size: number;
  readonly letter: string;
  readonly ink: string;
  /** None leaves the icon transparent. */
  readonly background: string | null;
}

/** The initial in Fira Code Bold, centred by its ink and filling about three quarters of the height. */
export function drawFavicon(surface: GlyphSurface, spec: FaviconSpec): void {
  if (spec.background) {
    surface.fillStyle = spec.background;
    surface.fillRect(0, 0, spec.size, spec.size);
  }
  surface.fillStyle = spec.ink;
  surface.font = `bold ${Math.round(spec.size * 0.78)}px "Fira Code"`;
  surface.textAlign = 'center';
  surface.textBaseline = 'alphabetic';
  const { actualBoundingBoxAscent: ascent, actualBoundingBoxDescent: descent } = surface.measureText(spec.letter);
  surface.fillText(spec.letter, spec.size / 2, spec.size / 2 + (ascent - descent) / 2);
}
