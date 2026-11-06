import type { Cv, Post, Project, Research } from '../content/schema.ts';
import type { ContentItem, RawContent } from '../content/types.ts';
import type {
  CategoryModel,
  CvModel,
  ItemModel,
  PostModel,
  ProfileModel,
  ProjectModel,
  ResearchModel,
  SiteModel,
  TagModel,
  TagSummaryModel,
} from './types.ts';

/** YAML reads unquoted dates as Date objects; the model always carries them as YYYY-MM-DD. */
export function day(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

/** The address of a tag written as text: lowercase, without accents, words joined by hyphens. */
export function tagSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** A tag in one language: the name the tags file gives it there, or the text as written. */
export function tagFor(raw: RawContent, text: string, language: string): TagModel {
  const slug = tagSlug(text);
  const names = raw.tags?.tags.find((entry) => entry.slug === slug)?.name ?? {};
  return { slug, name: names[language] ?? text, names: [...new Set([text, ...Object.values(names)])] };
}

/** Tags of the language with their counts, most used first, then by name. */
export function tagSummary(items: readonly { readonly tags: readonly TagModel[] }[]): TagSummaryModel[] {
  const counts = new Map<string, TagSummaryModel>();
  for (const tag of items.flatMap((item) => item.tags)) {
    const seen = counts.get(tag.slug);
    counts.set(tag.slug, { ...tag, count: (seen?.count ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title);

function translationsOf<T>(items: readonly ContentItem<T>[]): Map<string, string[]> {
  const languages = new Map<string, string[]>();
  for (const { folder, language } of items) {
    languages.set(folder, [...(languages.get(folder) ?? []), language].sort());
  }
  return languages;
}

function itemBase<T extends { title: string; slug?: string | undefined; tags?: string[] | undefined }>(
  raw: RawContent,
  item: ContentItem<T>,
  translations: ReadonlyMap<string, readonly string[]>,
  tags: readonly string[] = item.data.tags ?? [],
): ItemModel {
  return {
    id: item.folder,
    source: item.path,
    slug: item.data.slug ?? item.folder,
    language: item.language,
    translations: translations.get(item.folder) ?? [item.language],
    title: item.data.title,
    body: item.body,
    media: item.media,
    tags: tags.map((text) => tagFor(raw, text, item.language)),
  };
}

export function categoryName(raw: RawContent, slug: string, language: string): CategoryModel {
  const category = raw.categories.categories.find((candidate) => candidate.slug === slug);
  return { slug, name: category?.name[language] ?? slug };
}

/** Posts of the language, plus those that exist only in another one, newest first; drafts never appear. */
export function postsFor(raw: RawContent, language: string): PostModel[] {
  const published = raw.posts.filter((post) => !post.data.draft);
  const translations = translationsOf(published);
  return published
    .filter((post) => post.language === language || !translations.get(post.folder)?.includes(language))
    .map((post): PostModel => postModel(raw, post, translations, language))
    .sort((a, b) => b.date.localeCompare(a.date) || byTitle(a, b));
}

function postModel(
  raw: RawContent,
  post: ContentItem<Post>,
  translations: ReadonlyMap<string, readonly string[]>,
  language: string,
): PostModel {
  const { summary, date, lastmod, categories } = post.data;
  return {
    ...itemBase(raw, post, translations),
    // A post listed in a language it is not written in still names its tags in the language of the list.
    tags: (post.data.tags ?? []).map((text) => tagFor(raw, text, language)),
    summary,
    date: day(date),
    ...(lastmod && { lastmod: day(lastmod) }),
    category: categoryName(raw, categories[0] ?? '', language),
  };
}

/** Projects of the language: a lower weight first, those without one after, then by title. */
export function projectsFor(raw: RawContent, language: string): ProjectModel[] {
  const translations = translationsOf(raw.projects);
  const weight = (project: ContentItem<Project>) => project.data.weight ?? Number.POSITIVE_INFINITY;
  return raw.projects
    .filter((project) => project.language === language)
    .sort((a, b) => weight(a) - weight(b) || a.data.title.localeCompare(b.data.title))
    .map(
      (project): ProjectModel => ({
        ...itemBase(raw, project, translations),
        summary: project.data.summary,
        links: { ...project.data.links },
        featured: project.data.featured ?? false,
      }),
    );
}

/** Research of the language, newest year first; drafts never appear. */
export function researchFor(raw: RawContent, language: string): ResearchModel[] {
  const published = raw.research.filter((item) => !item.data.draft);
  const translations = translationsOf(published);
  return published
    .filter((item) => item.language === language)
    .map((item): ResearchModel => researchModel(raw, item, translations))
    .sort((a, b) => b.year - a.year || byTitle(a, b));
}

function researchModel(
  raw: RawContent,
  item: ContentItem<Research>,
  translations: ReadonlyMap<string, readonly string[]>,
): ResearchModel {
  const { kind, year, authors, venue, doi, file } = item.data;
  const filePath = file && item.media.find((path) => path.endsWith(`/${file}`));
  return {
    ...itemBase(raw, item, translations),
    kind,
    year,
    authors,
    venue,
    ...(doi && { doi }),
    ...(filePath && { file: filePath }),
  };
}

/** The CV of the language, or the first other language that has one, in the order the site declares. */
export function cvFor(raw: RawContent, language: string, research: readonly ResearchModel[]): CvModel | null {
  const shown = [language, ...raw.site.languages.filter((other) => other !== language)].find((code) => raw.cv[code]);
  const cv = shown ? raw.cv[shown] : undefined;
  return shown && cv ? cvModel(cv, shown, shown !== language, research) : null;
}

function cvModel(cv: Cv, language: string, fallback: boolean, research: readonly ResearchModel[]): CvModel {
  const { label, summary, email, location, profiles } = cv.basics;
  return {
    language,
    fallback,
    basics: { label, summary, email, location, profiles },
    work: cv.work.map(({ highlights, ...entry }) => ({ ...entry, highlights: highlights ?? [] })),
    education: cv.education,
    skills: cv.skills,
    languages: cv.languages,
    publications: (cv.publications ?? []).flatMap(({ research: id }) =>
      research.filter((item) => item.id === id).map(({ slug, title, year }) => ({ id, slug, title, year })),
    ),
  };
}

export function profileFor(raw: RawContent, language: string): ProfileModel | null {
  const about = raw.about[language];
  if (!about) {
    return null;
  }
  const { role, lines, location, photoAlt, now, intro } = about;
  return {
    author: raw.site.author,
    role,
    title: `${raw.site.author} — ${role}`,
    description: lines.join(' '),
    lines,
    location,
    photo: raw.photo,
    photoAlt,
    intro: intro ?? null,
    now,
  };
}

/** Applies every content rule for one language. */
export function buildModel(raw: RawContent, language: string): SiteModel {
  const research = researchFor(raw, language);
  const posts = postsFor(raw, language);
  const projects = projectsFor(raw, language);
  const email = raw.contact?.email[language as keyof typeof raw.contact.email];
  return {
    language,
    languages: raw.site.languages,
    profile: profileFor(raw, language),
    contact:
      raw.contact && email ? { email, professional: raw.contact.professional, personal: raw.contact.personal } : null,
    categories: raw.categories.categories.map(({ slug }) => categoryName(raw, slug, language)),
    tags: tagSummary([...posts, ...projects, ...research]),
    posts,
    projects,
    research,
    cv: cvFor(raw, language, research),
    reading: raw.reading?.items ?? [],
    music: raw.music && { updated: day(raw.music.updated), period: raw.music.period, artists: raw.music.artists },
    films: raw.films && { updated: day(raw.films.updated), films: raw.films.films },
  };
}
