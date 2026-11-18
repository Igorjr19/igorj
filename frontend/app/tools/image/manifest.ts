import type { ColorRole } from './color.ts';

/** A dithered picture the page paints with the theme's ink: the mask for bright ink, its inverse for dark ink, and the size. */
export interface MaskEntry {
  readonly src: string;
  readonly inverted: string;
  readonly width: number;
  readonly height: number;
  /** The same picture dithered at the size of a list preview, so the browser never shrinks the dots. */
  readonly thumb?: Omit<MaskEntry, 'thumb'>;
}

/** A picture in the colors of the theme: one dithered layer pair per color role it uses, each painted with that role's color. */
export interface ColorEntry {
  readonly width: number;
  readonly height: number;
  readonly layers: readonly {
    readonly role: ColorRole;
    readonly src: string;
    readonly inverted: string;
  }[];
}

/** What the build of the pictures tells the frontend, by the media path the content uses. */
export interface ImagesManifest {
  readonly portraits: Readonly<Record<string, MaskEntry>>;
  readonly figures: Readonly<Record<string, MaskEntry>>;
  /** The figures the content asked for in color with `#color`, by media path. */
  readonly colorFigures: Readonly<Record<string, ColorEntry>>;
  /** For an item with no picture, by `section:id`: its initial. */
  readonly placeholders: Readonly<Record<string, MaskEntry>>;
  /** The copy of a picture sized for the screen, by media path, for the ones larger than that; the original stays under /media/. */
  readonly webCopies: Readonly<Record<string, string>>;
}

/** Image files the content can hold that are worth dithering; vector images stay as they are. */
export const RASTER_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const;

export function isRaster(path: string): boolean {
  return RASTER_EXTENSIONS.some((extension) => path.toLowerCase().endsWith(extension));
}

/** A picture opened from a page is shown at most this wide; a larger original is shown from a smaller copy of it. */
export const WEB_MAX_WIDTH = 1600;

/** Figures never fill more than the text column, so the dots are made no wider than this: one dot for each pixel on screen, as the portrait of the home. */
export const FIGURE_MAX_WIDTH = 640;

/** As tall as the photo itself (3:4), so the home can stretch it to the height of the text beside it with little cropped. */
export const HERO_PORTRAIT_SIZE = { width: 320, height: 427 } as const;

export function withoutExtension(path: string): string {
  return path.replace(/\.[^./]+$/, '');
}

/** The shape of every list preview, 16:9: a picture is cropped to it, so a row of cards lines up whatever the pictures are. */
export const PLACEHOLDER_SIZE = { width: 480, height: 270 } as const;
