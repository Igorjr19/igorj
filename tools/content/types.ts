import type {
  About,
  Categories,
  Codetime,
  Contact,
  Cv,
  Films,
  Github,
  Music,
  Post,
  Project,
  Reading,
  Research,
  Site,
  TagNames,
} from './schema.ts';

/** A Markdown, YAML or JSON file of a content folder, with its path relative to the content root. */
export interface ContentFile {
  readonly path: string;
  readonly text: string;
}

/** A post, project or research item in one language: its folder, front matter, body and the other files beside it. */
export interface ContentItem<T> {
  /** The Markdown file, relative to the content root. */
  readonly path: string;
  readonly folder: string;
  readonly language: string;
  readonly data: T;
  readonly body: string;
  readonly media: readonly string[];
}

/** Everything the content repository holds, parsed and typed but with no rule applied yet. */
export interface RawContent {
  readonly site: Site;
  readonly categories: Categories;
  /** Translated tag names; null when the content translates none. */
  readonly tags: TagNames | null;
  readonly about: Readonly<Record<string, About>>;
  readonly cv: Readonly<Record<string, Cv>>;
  readonly contact: Contact | null;
  readonly reading: Reading | null;
  readonly music: Music | null;
  readonly films: Films | null;
  readonly github: Github | null;
  readonly codetime: Codetime | null;
  readonly photo: string | null;
  readonly posts: readonly ContentItem<Post>[];
  readonly projects: readonly ContentItem<Project>[];
  readonly research: readonly ContentItem<Research>[];
}
