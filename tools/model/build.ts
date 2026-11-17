import { type Edition, inEdition } from '../content/editions.ts';
import type { Cv, Post, Project, Research } from '../content/schema.ts';
import type { ContentItem, RawContent } from '../content/types.ts';
import type {
  CategoryModel,
  CodetimeModel,
  CvModel,
  GithubModel,
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

/** Whether an item is on the site: drafts and archived items are not. */
function shown(item: ContentItem<{ draft?: boolean | undefined; archived?: boolean | undefined }>): boolean {
  return !(item.data.draft || item.data.archived);
}

/** Posts of the language, plus those that exist only in another one, newest first; drafts and archived posts never appear. */
export function postsFor(raw: RawContent, language: string): PostModel[] {
  const published = raw.posts.filter(shown);
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

/** Projects of the language: a lower weight first, those without one after, then by title; archived ones never appear. */
export function projectsFor(raw: RawContent, language: string): ProjectModel[] {
  const current = raw.projects.filter(shown);
  const translations = translationsOf(current);
  const weight = (project: ContentItem<Project>) => project.data.weight ?? Number.POSITIVE_INFINITY;
  return current
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

/** Research of the language, newest year first; drafts and archived works never appear. */
export function researchFor(raw: RawContent, language: string): ResearchModel[] {
  const published = raw.research.filter(shown);
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
    academic: cv.academic ?? [],
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

/** How busy a day is, from 0 for none to 4 for the busiest, relative to the busiest day shown. */
export function activityLevel(count: number, busiest: number): number {
  return count <= 0 || busiest <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((4 * count) / busiest)));
}

export function githubFor(raw: RawContent): GithubModel | null {
  const github = raw.github;
  if (!github) {
    return null;
  }
  const { weeks, total, start } = github.contributions;
  const busiest = Math.max(0, ...weeks.flat());
  return {
    updated: day(github.updated),
    login: github.login,
    url: `https://github.com/${github.login}`,
    total,
    start: day(start),
    weeks,
    levels: weeks.map((week) => week.map((count) => activityLevel(count, busiest))),
    repositories: github.repositories.map((repository) => ({ ...repository, pushed: day(repository.pushed) })),
  };
}

export function codetimeFor(raw: RawContent): CodetimeModel | null {
  const codetime = raw.codetime;
  return (
    codetime && {
      updated: day(codetime.updated),
      weekMinutes: codetime.week.minutes,
      monthMinutes: codetime.month.minutes,
      languages: [...codetime.month.languages].sort((a, b) => b.minutes - a.minutes),
    }
  );
}

/** What the edition leaves out of the content: items it is not in, and posts of categories it does not carry. */
export function forEditionOf(raw: RawContent, edition: Edition): RawContent {
  const carried = (post: ContentItem<Post>): boolean =>
    edition.categories === null || post.data.categories.some((slug) => edition.categories?.includes(slug));
  return {
    ...raw,
    posts: raw.posts.filter((post) => inEdition(post.data, edition.name) && carried(post)),
    projects: raw.projects.filter((project) => inEdition(project.data, edition.name)),
    research: raw.research.filter((work) => inEdition(work.data, edition.name)),
  };
}

/** The contact of the language, without the personal networks where the edition does not show them. */
function contactFor(raw: RawContent, language: string, edition: Edition): SiteModel['contact'] {
  const email = raw.contact?.email[language as keyof typeof raw.contact.email];
  if (!(raw.contact && email)) {
    return null;
  }
  return { email, professional: raw.contact.professional, personal: edition.personal ? raw.contact.personal : [] };
}

/** The data of the shelf and of the boxes of the home page; what an edition has no place for is not in its model at all. */
function dataFor(
  raw: RawContent,
  edition: Edition,
): Pick<SiteModel, 'reading' | 'music' | 'films' | 'github' | 'codetime'> {
  const shown = (box: string) =>
    edition.sections.shelf || edition.boxes.includes(box as (typeof edition.boxes)[number]);
  const code = edition.boxes.includes('code');
  const { music, films } = raw;
  return {
    reading: edition.sections.shelf ? (raw.reading?.items ?? []) : [],
    music:
      music && shown('listening')
        ? { updated: day(music.updated), period: music.period, artists: music.artists }
        : null,
    films: films && shown('watched') ? { updated: day(films.updated), films: films.films } : null,
    github: code ? githubFor(raw) : null,
    codetime: code ? codetimeFor(raw) : null,
  };
}

/** Applies every content rule for one language and one edition. */
export function buildModel(content: RawContent, language: string, edition: Edition): SiteModel {
  const raw = forEditionOf(content, edition);
  const sections = edition.sections;
  const allResearch = researchFor(raw, language);
  const research = sections.research ? allResearch : [];
  const posts = sections.posts ? postsFor(raw, language) : [];
  const projects = sections.projects ? projectsFor(raw, language) : [];
  return {
    edition: { name: edition.name, url: edition.url, index: edition.index, boxes: edition.boxes },
    language,
    languages: raw.site.languages,
    sections,
    profile: profileFor(raw, language),
    contact: contactFor(raw, language, edition),
    categories: raw.categories.categories
      .filter(({ slug }) => edition.categories === null || edition.categories.includes(slug))
      .map(({ slug }) => categoryName(raw, slug, language)),
    tags: tagSummary([...posts, ...projects, ...research]),
    posts,
    projects,
    research,
    // The CV still lists the research when its section is off; it just has no pages to link to.
    cv: sections.cv ? cvFor(raw, language, allResearch) : null,
    ...dataFor(raw, edition),
  };
}
