import type { RecentRow } from './data.ts';

export interface HeroData {
  readonly author: string;
  readonly role: string;
  readonly location: string;
  readonly lines: readonly string[];
  readonly photo: {
    readonly alt: string;
    readonly src: string;
    readonly inverted: string;
    readonly width: number;
    readonly height: number;
  } | null;
}

export interface SystemData {
  readonly commit: string | null;
  readonly built: string;
  readonly counts: {
    readonly posts: number | null;
    readonly projects: number | null;
    readonly research: number | null;
  };
  readonly sources: readonly string[];
  readonly updated: string | null;
}

export interface CodeData {
  readonly github: {
    readonly total: number;
    readonly levels: readonly (readonly number[])[];
    readonly updatedLate: string | null;
  } | null;
  readonly codetime: {
    readonly weekMinutes: number;
    readonly monthMinutes: number;
    readonly languages: readonly string[];
    readonly updatedLate: string | null;
  } | null;
}

export interface FilmRow {
  readonly title: string;
  readonly year: number;
  readonly rating: number | null;
  readonly url: string | null;
}

export interface HomeData {
  readonly hero: HeroData | null;
  readonly recent: readonly RecentRow[];
  readonly system: SystemData;
  readonly code: CodeData | null;
  readonly listening: {
    readonly total: number;
    readonly bars: readonly { name: string; url: string | null; plays: number; percent: number }[];
    readonly updatedLate: string | null;
  } | null;
  readonly watched: { readonly films: readonly FilmRow[]; readonly updatedLate: string | null } | null;
  /** The profile address of each network the home links its boxes to. */
  readonly networks: Readonly<Record<string, string>>;
}
