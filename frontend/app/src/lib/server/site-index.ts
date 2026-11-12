import { readFile } from 'node:fs/promises';
import type { SiteModel } from '../../../../../tools/model/types.ts';
import type { ThemeIndex } from '../pick/entries.ts';
import { itemHref } from '../routes.ts';
import { panesOf } from '../sections.ts';
import { readDictionary } from './i18n.ts';
import { categoryCounts } from './items.ts';

const THEMES = process.env['THEMES_MANIFEST'] ?? '../../generated/data/themes.json';

/** The interface text the quick-pick box needs, so the box loads without the whole dictionary. */
const STRING_PREFIXES = ['pick', 'cmd'];

function researchKind(dictionary: Awaited<ReturnType<typeof readDictionary>>, kind: string): string {
  const entry = dictionary[`research${kind.charAt(0).toUpperCase()}${kind.slice(1)}`];
  return typeof entry === 'string' ? entry : kind;
}

/** What the quick-pick box reads, in the page language: the same model the pages show, as plain text. */
export async function buildSiteIndex(model: SiteModel) {
  const dictionary = await readDictionary(model.language);
  const panes = panesOf(model.language, model).map((pane) => {
    const label = dictionary[pane.section.label];
    return { key: pane.section.key, label: typeof label === 'string' ? label : pane.section.key, url: pane.href };
  });
  const posts = model.posts.map((post) => ({
    title: post.title,
    facts: `${post.category.name} · ${post.date}`,
    url: itemHref('posts', post),
  }));
  const projects = model.projects.map((project) => ({
    title: project.title,
    facts: project.tags.map((tag) => tag.name).join(', '),
    url: itemHref('projects', project),
  }));
  const research = model.research.map((item) => ({
    title: item.title,
    facts: `${researchKind(dictionary, item.kind)} · ${item.year} · ${item.venue}`,
    url: itemHref('research', item),
  }));
  const themes = JSON.parse(await readFile(THEMES, 'utf8')) as ThemeIndex;
  return {
    panes,
    items: {
      ...(model.sections.posts && { posts }),
      ...(model.sections.projects && { projects }),
      ...(model.sections.research && { research }),
    },
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
    strings: Object.fromEntries(
      Object.entries(dictionary).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === 'string' && STRING_PREFIXES.some((prefix) => entry[0].startsWith(prefix)),
      ),
    ),
  };
}
