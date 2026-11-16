import { readFile } from 'node:fs/promises';
import type { SiteModel } from '../../../../../tools/model/types.ts';
import { translate } from '../i18n.ts';
import { languageInfo } from '../languages.ts';
import { plainText } from '../markdown/render.ts';
import type { ThemeIndex } from '../pick/entries.ts';
import { itemHref } from '../routes.ts';
import { panesOf } from '../sections.ts';
import { readDictionary } from './i18n.ts';
import { categoryCounts } from './items.ts';
import { SITE_URL } from './site.ts';

const BUILD_INFO = process.env['BUILD_INFO'] ?? '../../generated/data/build.json';
const THEMES = process.env['THEMES_MANIFEST'] ?? '../../generated/data/themes.json';

/** The interface text the quick-pick box needs, so the box loads without the whole dictionary. */
const STRING_PREFIXES = ['pick', 'cmd', 'term', 'now', 'mode'];

function dictionaryText(
  dictionary: Awaited<ReturnType<typeof readDictionary>>,
  locale: string,
  key: string,
  count: number,
): string {
  return translate(dictionary, locale, key, count);
}

/** The short commit and the day of the build, as the terminal's `fetch` shows them. */
async function readBuild(): Promise<{ commit: string; date: string }> {
  let commit = '';
  try {
    commit = ((JSON.parse(await readFile(BUILD_INFO, 'utf8')) as { commit?: string }).commit ?? '').slice(0, 7);
  } catch {
    // No build info: the terminal shows the date alone.
  }
  return { commit, date: new Date().toISOString().slice(0, 10) };
}

function researchKind(dictionary: Awaited<ReturnType<typeof readDictionary>>, kind: string): string {
  const entry = dictionary[`research${kind.charAt(0).toUpperCase()}${kind.slice(1)}`];
  return typeof entry === 'string' ? entry : kind;
}

function itemsOf(model: SiteModel, dictionary: Awaited<ReturnType<typeof readDictionary>>) {
  const posts = model.posts.map((post) => ({
    name: `${post.id}.md`,
    summary: post.summary,
    text: plainText(post.body),
    title: post.title,
    facts: `${post.category.name} · ${post.date}`,
    url: itemHref('posts', post),
  }));
  const projects = model.projects.map((project) => ({
    name: `${project.id}.md`,
    summary: project.summary,
    text: plainText(project.body),
    title: project.title,
    facts: project.tags.map((tag) => tag.name).join(', '),
    url: itemHref('projects', project),
  }));
  const research = model.research.map((item) => ({
    name: `${item.id}.md`,
    summary: '',
    text: plainText(item.body),
    title: item.title,
    facts: `${researchKind(dictionary, item.kind)} · ${item.year} · ${item.venue}`,
    url: itemHref('research', item),
  }));
  return {
    ...(model.sections.posts && { posts }),
    ...(model.sections.projects && { projects }),
    ...(model.sections.research && { research }),
  };
}

function contentSummary(model: SiteModel, dictionary: Awaited<ReturnType<typeof readDictionary>>): string {
  const locale = languageInfo(model.language).locale;
  return [
    model.sections.posts && dictionaryText(dictionary, locale, 'countPosts', model.posts.length),
    model.sections.projects && dictionaryText(dictionary, locale, 'countProjects', model.projects.length),
    model.sections.research && dictionaryText(dictionary, locale, 'countResearch', model.research.length),
  ]
    .filter(Boolean)
    .join(' · ');
}

/** What the quick-pick box and the terminal read, in the page language: the same model the pages show, as plain text. */
export async function buildSiteIndex(model: SiteModel) {
  const dictionary = await readDictionary(model.language);
  const panes = panesOf(model.language, model).map((pane) => {
    const label = dictionary[pane.section.label];
    return { key: pane.section.key, label: typeof label === 'string' ? label : pane.section.key, url: pane.href };
  });
  const themes = JSON.parse(await readFile(THEMES, 'utf8')) as ThemeIndex;
  return {
    profile: model.profile,
    contact: model.contact,
    music: model.music ?? {},
    films: model.films ?? {},
    reading: model.reading,
    themes: themes.families.flatMap((family) =>
      family.themes.map((theme) => ({ id: theme.id, name: theme.name, family: family.name })),
    ),
    build: await readBuild(),
    host: new URL(SITE_URL).host,
    contentSummary: contentSummary(model, dictionary),
    panes,
    items: itemsOf(model, dictionary),
    categories: categoryCounts(model).map((category) => ({
      slug: category.slug,
      name: category.name,
      url: `/${model.language}/categories/${category.slug}/`,
      count: category.count,
    })),
    tags: model.tags.map((tag) => ({
      slug: tag.slug,
      name: tag.name,
      names: tag.names,
      count: tag.count,
      url: `/${model.language}/tags/${tag.slug}/`,
    })),
    postsUrl: `/${model.language}/posts/`,
    accents: themes.accents?.options.map((option) => option.name) ?? [],
    themeIndex: themes,
    strings: {
      ...Object.fromEntries(
        Object.entries(dictionary).filter(
          (entry): entry is [string, string] =>
            typeof entry[1] === 'string' && STRING_PREFIXES.some((prefix) => entry[0].startsWith(prefix)),
        ),
      ),
      contentSummary: contentSummary(model, dictionary),
    },
  };
}
