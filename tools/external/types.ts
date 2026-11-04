export interface Artist {
  readonly name: string;
  readonly plays: number;
  readonly url?: string;
}

/** Most played artists of the week; nothing here may say when a song was played. */
export interface MusicSummary {
  readonly updated: string;
  readonly period: 'week';
  readonly artists: readonly Artist[];
}

export interface Film {
  readonly title: string;
  readonly year: number;
  readonly rating?: number;
  readonly url?: string;
}

/** Films logged most recently; nothing here may say when a film was watched. */
export interface FilmsSummary {
  readonly updated: string;
  readonly films: readonly Film[];
}
