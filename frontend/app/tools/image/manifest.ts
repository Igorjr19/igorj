/** A dithered picture the page paints with the theme's ink: the mask for bright ink, its inverse for dark ink, and the size. */
export interface MaskEntry {
  readonly src: string;
  readonly inverted: string;
  readonly width: number;
  readonly height: number;
}

/** What the build of the pictures tells the frontend, by the media path the content uses. */
export interface ImagesManifest {
  readonly portraits: Readonly<Record<string, MaskEntry>>;
  readonly figures: Readonly<Record<string, MaskEntry>>;
}

/** Image files the content can hold that are worth dithering; vector images stay as they are. */
export const RASTER_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const;

export function isRaster(path: string): boolean {
  return RASTER_EXTENSIONS.some((extension) => path.toLowerCase().endsWith(extension));
}

/** Figures never fill more than the text column, so the dots are not made wider than this. */
export const FIGURE_MAX_WIDTH = 960;

/** As tall as the photo itself (3:4), so the home can stretch it to the height of the text beside it with little cropped. */
export const HERO_PORTRAIT_SIZE = { width: 320, height: 427 } as const;

export function withoutExtension(path: string): string {
  return path.replace(/\.[^./]+$/, '');
}
