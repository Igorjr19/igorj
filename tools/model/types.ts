/**
 * What a frontend receives for one language. Every rule about the content is already applied;
 * dates stay as the content gives them (YYYY-MM-DD), since anything relative to today is the frontend's.
 */
export type SectionKey = 'projects' | 'posts' | 'research' | 'cv' | 'shelf';

export interface SiteModel {
  readonly language: string;
  readonly languages: readonly string[];
  /** Which sections the site shows; a section turned off has no pages, and its items are left out. */
  readonly sections: Readonly<Record<SectionKey, boolean>>;
  readonly profile: ProfileModel | null;
  readonly contact: ContactModel | null;
  readonly categories: readonly CategoryModel[];
  /** Every tag the items of this language use, by name, with how many items carry it. */
  readonly tags: readonly TagSummaryModel[];
  readonly posts: readonly PostModel[];
  readonly projects: readonly ProjectModel[];
  readonly research: readonly ResearchModel[];
  readonly cv: CvModel | null;
  readonly reading: readonly ReadingModel[];
  readonly music: MusicModel | null;
  readonly films: FilmsModel | null;
  readonly github: GithubModel | null;
  readonly codetime: CodetimeModel | null;
}

export interface ProfileModel {
  readonly author: string;
  readonly role: string;
  /** Author and role, for page titles. */
  readonly title: string;
  /** The about lines as one sentence, for search engines and link previews. */
  readonly description: string;
  readonly lines: readonly string[];
  readonly location: string;
  /** Path under the generated media folder. */
  readonly photo: string | null;
  readonly photoAlt: string;
  /** The sentence of the opening, if written. */
  readonly intro: string | null;
  readonly now: { readonly work: string; readonly masters: string; readonly studying: string };
}

export interface LinkModel {
  readonly network: string;
  readonly url: string;
  readonly note?: string | undefined;
}

export interface ContactModel {
  readonly email: string;
  readonly professional: readonly LinkModel[];
  readonly personal: readonly LinkModel[];
}

export interface CategoryModel {
  readonly slug: string;
  readonly name: string;
}

/** A tag: its address, the name in this language, and its names in every language, for search. */
export interface TagModel {
  readonly slug: string;
  readonly name: string;
  readonly names: readonly string[];
}

export interface TagSummaryModel extends TagModel {
  readonly count: number;
}

/** Shared by posts, projects and research: where the item lives and what it shows. */
export interface ItemModel {
  /** Folder name in the content repository, the same in every language. */
  readonly id: string;
  /** The file the item comes from, relative to the content root; frontends may show it, never read it. */
  readonly source: string;
  readonly slug: string;
  /** The language the item is written in; a post may be listed under another one. */
  readonly language: string;
  /** Every language the item exists in. */
  readonly translations: readonly string[];
  readonly title: string;
  /** Markdown without front matter. */
  readonly body: string;
  /** Paths under the generated media folder, for the images and files the body or the item refers to. */
  readonly media: readonly string[];
  readonly tags: readonly TagModel[];
}

export interface PostModel extends ItemModel {
  readonly summary: string;
  readonly date: string;
  readonly lastmod?: string | undefined;
  readonly category: CategoryModel;
}

export interface ProjectModel extends ItemModel {
  readonly summary: string;
  readonly links: { readonly repository?: string | undefined; readonly demo?: string | undefined };
  readonly featured: boolean;
}

export interface ResearchModel extends ItemModel {
  readonly kind: 'article' | 'thesis' | 'presentation' | 'poster';
  readonly year: number;
  readonly authors: readonly string[];
  readonly venue: string;
  readonly doi?: string | undefined;
  readonly file?: string | undefined;
}

export interface CvModel {
  /** The language of the CV shown; another one when this language has none. */
  readonly language: string;
  readonly fallback: boolean;
  readonly basics: {
    readonly label: string;
    readonly summary: string;
    readonly email: string;
    readonly location: string;
    readonly profiles: readonly LinkModel[];
  };
  readonly work: readonly {
    readonly name: string;
    readonly position: string;
    readonly startDate: string;
    readonly endDate?: string | undefined;
    readonly location?: string | undefined;
    readonly summary?: string | undefined;
    readonly highlights: readonly string[];
  }[];
  readonly education: readonly {
    readonly institution: string;
    readonly studyType: string;
    readonly area: string;
    readonly startDate?: string | undefined;
    readonly endDate?: string | undefined;
  }[];
  readonly academic: readonly {
    readonly title: string;
    readonly institution: string;
    readonly year: number;
    readonly summary?: string | undefined;
  }[];
  readonly skills: readonly { readonly name: string; readonly keywords: readonly string[] }[];
  readonly languages: readonly { readonly language: string; readonly fluency: string }[];
  /** Research items of this language the CV lists; ones missing here are left out. */
  readonly publications: readonly {
    readonly id: string;
    readonly slug: string;
    readonly title: string;
    readonly year: number;
  }[];
}

export interface ReadingModel {
  readonly title: string;
  readonly authors: readonly string[];
  readonly kind: 'book' | 'paper';
  readonly url?: string | undefined;
}

export interface MusicModel {
  readonly updated: string;
  readonly period: 'week' | 'month';
  readonly artists: readonly { readonly name: string; readonly plays: number; readonly url?: string | undefined }[];
}

export interface FilmsModel {
  readonly updated: string;
  readonly films: readonly {
    readonly title: string;
    readonly year: number;
    readonly rating?: number | undefined;
    readonly url?: string | undefined;
  }[];
}

/** Public GitHub activity: contributions per day in weeks that start on Sunday, oldest first. */
export interface GithubModel {
  readonly updated: string;
  readonly login: string;
  readonly url: string;
  readonly total: number;
  /** The day the first week starts. */
  readonly start: string;
  readonly weeks: readonly (readonly number[])[];
  /** How busy each day is, from 0 (nothing) to 4 (among the busiest), in the same weeks. */
  readonly levels: readonly (readonly number[])[];
  readonly repositories: readonly {
    readonly name: string;
    readonly url: string;
    readonly description?: string | undefined;
    readonly language?: string | undefined;
    readonly stars: number;
    readonly pushed: string;
  }[];
}

/** Coding time from CodeTime, in minutes. */
export interface CodetimeModel {
  readonly updated: string;
  readonly weekMinutes: number;
  readonly monthMinutes: number;
  readonly languages: readonly { readonly name: string; readonly minutes: number }[];
}
