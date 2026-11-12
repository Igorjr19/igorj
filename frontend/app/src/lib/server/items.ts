import type { ItemModel, PostModel, ProjectModel, ResearchModel, SiteModel } from '../../../../../tools/model/types.ts';
import type { ItemPageData, ItemRowData } from '../items/types.ts';
import { renderMarkdown } from '../markdown/render.ts';
import { type ItemSection, itemHref } from '../routes.ts';
import { readImages } from './images.ts';

type Images = Awaited<ReturnType<typeof readImages>>;
type Item = PostModel | ProjectModel | ResearchModel;

function firstImage(item: ItemModel, images: Images): ItemRowData['image'] {
  const media = item.media.find((path) => path in images.figures);
  return media ? (images.figures[media] ?? null) : null;
}

export function rowOf(section: ItemSection, item: Item, images: Images): ItemRowData {
  const post = section === 'posts' ? (item as PostModel) : null;
  const research = section === 'research' ? (item as ResearchModel) : null;
  return {
    section,
    href: itemHref(section, item),
    language: item.language,
    title: item.title,
    summary: research
      ? `${research.authors.join(', ')} · ${research.venue}`
      : ((item as PostModel | ProjectModel).summary ?? ''),
    tags: item.tags.map((tag) => ({ slug: tag.slug, name: tag.name })),
    category: post ? post.category : null,
    date: post ? post.date : null,
    research: research
      ? { kind: research.kind, year: research.year, authors: research.authors, venue: research.venue }
      : null,
    image: firstImage(item, images),
  };
}

export async function rowsOf(model: SiteModel, section: ItemSection): Promise<ItemRowData[]> {
  const images = await readImages();
  return (model[section] as readonly Item[]).map((item) => rowOf(section, item, images));
}

function neighbour(posts: readonly PostModel[], at: number): { href: string; title: string } | null {
  const post = posts[at];
  return post ? { href: itemHref('posts', post), title: post.title } : null;
}

// The posts are listed newest first, so the previous one (published before) comes after this one in the list.
function postOf(model: SiteModel, post: PostModel): NonNullable<ItemPageData['post']> {
  const at = model.posts.findIndex((candidate) => candidate.id === post.id);
  return {
    date: post.date,
    lastmod: post.lastmod ?? null,
    category: post.category,
    previous: neighbour(model.posts, at + 1),
    next: at > 0 ? neighbour(model.posts, at - 1) : null,
  };
}

function researchOf(research: ResearchModel): NonNullable<ItemPageData['research']> {
  return {
    kind: research.kind,
    year: research.year,
    authors: research.authors,
    venue: research.venue,
    doi: research.doi ?? null,
    file: research.file ?? null,
  };
}

export async function itemPageOf(
  model: SiteModel,
  section: ItemSection,
  item: Item,
  copyLabel: string,
): Promise<ItemPageData> {
  const images = await readImages();
  const rendered = renderMarkdown(item.body, {
    mediaBase: `${section}/${item.id}`,
    figures: images.figures,
    copyLabel,
  });
  const project = item as ProjectModel;
  return {
    section,
    title: item.title,
    html: rendered.html,
    headings: rendered.headings,
    tags: item.tags.map((tag) => ({ slug: tag.slug, name: tag.name })),
    source: item.source,
    post: section === 'posts' ? postOf(model, item as PostModel) : null,
    project:
      section === 'projects'
        ? { repository: project.links.repository ?? null, demo: project.links.demo ?? null }
        : null,
    research: section === 'research' ? researchOf(item as ResearchModel) : null,
  };
}

/** The categories of the language with how many of its own posts each holds, in alphabetical order. */
export function categoryCounts(model: SiteModel): { slug: string; name: string; count: number }[] {
  return model.categories
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      count: model.posts.filter((post) => post.language === model.language && post.category.slug === category.slug)
        .length,
    }))
    .filter((category) => category.count > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}
