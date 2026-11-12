export interface TagData {
  readonly slug: string;
  readonly name: string;
}

/** What a list row or card of any section needs. */
export interface ItemRowData {
  readonly section: 'posts' | 'projects' | 'research';
  readonly href: string;
  /** The language the item is written in. */
  readonly language: string;
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly TagData[];
  readonly category: { readonly slug: string; readonly name: string } | null;
  readonly date: string | null;
  readonly research: {
    readonly kind: string;
    readonly year: number;
    readonly authors: readonly string[];
    readonly venue: string;
  } | null;
  readonly image: {
    readonly src: string;
    readonly inverted: string;
    readonly width: number;
    readonly height: number;
  } | null;
}

export interface ItemPageData {
  readonly section: 'posts' | 'projects' | 'research';
  readonly title: string;
  readonly html: string;
  readonly headings: readonly { readonly id: string; readonly text: string; readonly level: number }[];
  readonly tags: readonly TagData[];
  readonly post: {
    readonly date: string;
    readonly lastmod: string | null;
    readonly category: { readonly slug: string; readonly name: string };
    readonly previous: { readonly href: string; readonly title: string } | null;
    readonly next: { readonly href: string; readonly title: string } | null;
  } | null;
  readonly project: { readonly repository: string | null; readonly demo: string | null } | null;
  readonly research: {
    readonly kind: string;
    readonly year: number;
    readonly authors: readonly string[];
    readonly venue: string;
    readonly doi: string | null;
    readonly file: string | null;
  } | null;
  readonly source: string;
}
