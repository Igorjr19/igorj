/**
 * What the room shows, ready to show. The scene reads this and nothing else: it knows neither the content model
 * nor the routes, so the room can be dropped without touching them.
 */
export interface SceneInput {
  /** The words the room writes on its objects, in the language of the page. */
  readonly strings: Readonly<Record<string, string>>;
  readonly music: {
    readonly artists: readonly { readonly name: string; readonly plays: number }[];
    readonly album: { readonly title: string; readonly artist: string; readonly cover: string | null } | null;
  } | null;
  readonly films: readonly SceneFilm[];
  readonly books: readonly SceneBook[];
}

export interface SceneFilm {
  readonly title: string;
  readonly year: number;
  readonly rating: number | null;
  readonly poster: string | null;
}

export interface SceneBook {
  readonly title: string;
  readonly authors: readonly string[];
}

/** The shape the pages already hold; only the fields the room needs are read. */
export interface SceneSource {
  readonly music: {
    readonly artists: readonly { readonly name: string; readonly plays: number }[];
    readonly album?:
      | { readonly title: string; readonly artist: string; readonly cover?: string | undefined }
      | undefined;
  } | null;
  readonly films: {
    readonly films: readonly {
      readonly title: string;
      readonly year: number;
      readonly rating?: number | undefined;
      readonly poster?: string | undefined;
    }[];
  } | null;
  readonly reading: readonly { readonly title: string; readonly authors: readonly string[] }[];
}

/** The room has room for this much: the iPod lists five, the board holds four posters and the desk three books. */
export const LIMITS = { artists: 5, films: 4, books: 3 } as const;

/** The interface text the room needs, by key. */
export const SCENE_STRING_KEYS = ['sceneTop', 'sceneNow', 'sceneAlbum'] as const;

export function buildSceneInput(source: SceneSource, strings: Readonly<Record<string, string>> = {}): SceneInput {
  const artists = source.music?.artists.slice(0, LIMITS.artists) ?? [];
  const album = source.music?.album;
  return {
    strings,
    music:
      source.music && artists.length > 0
        ? {
            artists: artists.map(({ name, plays }) => ({ name, plays })),
            album: album ? { title: album.title, artist: album.artist, cover: album.cover ?? null } : null,
          }
        : null,
    films: (source.films?.films ?? []).slice(0, LIMITS.films).map((film) => ({
      title: film.title,
      year: film.year,
      rating: film.rating ?? null,
      poster: film.poster ?? null,
    })),
    books: source.reading.slice(0, LIMITS.books).map(({ title, authors }) => ({ title, authors })),
  };
}

/** The same poster at the size a texture wants: the service names the size in the address, and only 230 and 460 wide exist. */
export function posterAt(poster: string, width: 230 | 460): string {
  const height = width === 230 ? 345 : 690;
  return poster.replace(/-0-\d+-0-\d+-crop/, `-0-${width}-0-${height}-crop`);
}
