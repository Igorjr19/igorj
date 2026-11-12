import type { ItemModel, SiteModel } from '../../../../../tools/model/types.ts';
import { type ItemSection, itemHref } from '../routes.ts';

/** Data a week old or more says when it was saved, so a stalled daily job does not pass as fresh. */
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export function isStale(updated: string, now: Date): boolean {
  return now.getTime() - new Date(updated).getTime() >= STALE_AFTER_MS;
}

/** Minutes as hours and minutes, "12h 30m", or only minutes under an hour. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = String(minutes % 60).padStart(2, '0');
  return hours > 0 ? `${hours}h ${rest}m` : `${minutes}m`;
}

export interface RecentRow {
  readonly href: string;
  /** Set when the item is written in another language than the page that lists it. */
  readonly lang: string | null;
  readonly kind: string | null;
  readonly title: string;
  readonly date: string | null;
  readonly sub: string;
  readonly color: string;
}

const POSTS_SHOWN = 3;
const PROJECTS_SHOWN = 2;

function rowOf(section: ItemSection, item: ItemModel, language: string): Pick<RecentRow, 'href' | 'lang' | 'title'> {
  return { href: itemHref(section, item), lang: item.language === language ? null : item.language, title: item.title };
}

/** The latest posts and the featured projects, as one list of rows. */
export function recentRows(model: Pick<SiteModel, 'posts' | 'projects'>, language: string): RecentRow[] {
  const posts = model.posts.slice(0, POSTS_SHOWN).map((post) => ({
    ...rowOf('posts', post, language),
    kind: post.category.name,
    date: post.date,
    sub: post.summary,
    color: `var(--color-category-${post.category.slug})`,
  }));
  const projects = model.projects
    .filter((project) => project.featured)
    .slice(0, PROJECTS_SHOWN)
    .map((project) => ({
      ...rowOf('projects', project, language),
      kind: null,
      date: null,
      sub: project.tags.map((tag) => tag.name).join(' · '),
      color: 'var(--color-link)',
    }));
  return [...posts, ...projects];
}

export interface DataSource {
  readonly name: string;
  readonly model: 'music' | 'films' | 'github' | 'codetime';
  readonly what: string;
}

/** The services that have data in the model, and when the freshest of them was saved. */
export function systemSources(
  model: Pick<SiteModel, 'music' | 'films' | 'github' | 'codetime'>,
  sources: readonly DataSource[],
): { names: string[]; updated: string | null } {
  const present = sources.filter((source) => model[source.model]);
  const dates = present.map((source) => model[source.model]?.updated ?? '');
  return { names: present.map((source) => source.name), updated: dates.sort().at(-1) ?? null };
}

export interface BarArtist {
  readonly name: string;
  readonly url: string | null;
  readonly plays: number;
  readonly percent: number;
}

const ARTISTS_SHOWN = 3;

/** The week's artists with each bar scaled to the most played one. */
export function listeningBars(
  artists: NonNullable<SiteModel['music']>['artists'],
  shown = ARTISTS_SHOWN,
): {
  total: number;
  bars: BarArtist[];
} {
  const total = artists.reduce((sum, artist) => sum + artist.plays, 0);
  const max = Math.max(1, ...artists.map((artist) => artist.plays));
  return {
    total,
    bars: artists.slice(0, shown).map((artist) => ({
      name: artist.name,
      url: artist.url ?? null,
      plays: artist.plays,
      percent: (artist.plays * 100) / max,
    })),
  };
}
