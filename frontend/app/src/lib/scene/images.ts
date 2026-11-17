/** Loads a picture to draw on a surface of the room: the first of `sources` that arrives, or null when none does. */
export async function loadImage(sources: readonly string[]): Promise<HTMLImageElement | null> {
  for (const source of sources) {
    const image = await new Promise<HTMLImageElement | null>((resolve) => {
      const picture = new Image();
      // A picture can be drawn on a 3D surface only when the service lets other sites read it.
      picture.crossOrigin = 'anonymous';
      picture.referrerPolicy = 'no-referrer';
      picture.onload = () => resolve(picture);
      picture.onerror = () => resolve(null);
      picture.src = source;
    });
    if (image) {
      return image;
    }
  }
  return null;
}

/** The ways to fetch a poster: through the server of the site, which is allowed to read it. */
export function posterSources(poster: string): readonly string[] {
  return [`/api/poster?u=${encodeURIComponent(poster)}`];
}
