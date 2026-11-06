import * as v from '@valibot/valibot';
import { readData } from './check.ts';
import { stripFrontMatter } from './front-matter.ts';
import type { Post, Project, Research } from './schema.ts';
import { schemaForPath } from './schema.ts';
import type { ContentFile, ContentItem, RawContent } from './types.ts';

const ITEM = /^(posts|projects|research)\/([^/]+)\/index\.([a-z]{2})\.md$/;
const PER_LANGUAGE = /^(about|cv)\/(?:about|cv)\.([a-z]{2})\.yaml$/;
const PHOTO = /^about\/photo\.[a-z]+$/;

/** Parses a file the content check already accepted; a file it would reject is a programming error here. */
function parse<T>(file: ContentFile): T {
  const schema = schemaForPath(file.path);
  const read = readData(file.path, file.text);
  if (schema === null || 'problem' in read) {
    throw new Error(`${file.path} does not pass the content check`);
  }
  return v.parse(schema, read.data) as T;
}

function mediaBeside(folderPath: string, paths: readonly string[]): string[] {
  return paths.filter((path) => path.startsWith(`${folderPath}/`) && !/\/index\.[a-z]{2}\.md$/.test(path)).sort();
}

function single<T>(byPath: ReadonlyMap<string, ContentFile>, path: string): T | null {
  const file = byPath.get(path);
  return file ? parse<T>(file) : null;
}

function required<T>(byPath: ReadonlyMap<string, ContentFile>, path: string): T {
  const value = single<T>(byPath, path);
  if (value === null) {
    throw new Error(`${path} is missing`);
  }
  return value;
}

/** Turns the content files into typed content; `paths` lists every file, images included, relative to the content root. */
export function readContent(files: readonly ContentFile[], paths: readonly string[]): RawContent {
  const byPath = new Map(files.map((file) => [file.path, file]));
  const perLanguage: { about: Record<string, unknown>; cv: Record<string, unknown> } = { about: {}, cv: {} };
  const items: { posts: ContentItem<Post>[]; projects: ContentItem<Project>[]; research: ContentItem<Research>[] } = {
    posts: [],
    projects: [],
    research: [],
  };
  for (const file of files) {
    const item = ITEM.exec(file.path);
    const own = PER_LANGUAGE.exec(file.path);
    if (item) {
      const [, section = '', folder = '', language = ''] = item;
      const media = mediaBeside(`${section}/${folder}`, paths);
      const entry: ContentItem<unknown> = {
        path: file.path,
        folder,
        language,
        data: parse(file),
        body: stripFrontMatter(file.text),
        media,
      };
      (items[section as keyof typeof items] as ContentItem<unknown>[]).push(entry);
    } else if (own) {
      const [, kind = '', language = ''] = own;
      perLanguage[kind as keyof typeof perLanguage][language] = parse(file);
    }
  }
  return {
    site: required(byPath, 'site/site.yaml'),
    categories: required(byPath, 'categories/categories.yaml'),
    tags: single(byPath, 'tags/tags.yaml'),
    about: perLanguage.about as RawContent['about'],
    cv: perLanguage.cv as RawContent['cv'],
    contact: single(byPath, 'contact/contact.yaml'),
    reading: single(byPath, 'reading/reading.yaml'),
    music: single(byPath, 'external/music.json'),
    films: single(byPath, 'external/films.json'),
    photo: paths.find((path) => PHOTO.test(path)) ?? null,
    ...items,
  };
}
