import type { Film, FilmsSummary } from './types.ts';

export function diaryFeedUrl(user: string): string {
  return `https://letterboxd.com/${encodeURIComponent(user)}/rss/`;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(text: string): string {
  return text
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
      if (name.startsWith('#x') || name.startsWith('#X')) {
        return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
      }
      if (name.startsWith('#')) {
        return String.fromCodePoint(Number(name.slice(1)));
      }
      return ENTITIES[name.toLowerCase()] ?? entity;
    })
    .trim();
}

function tag(item: string, name: string): string | null {
  const match = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match?.[1] === undefined ? null : decode(match[1]);
}

function filmOf(item: string): Film | null {
  const title = tag(item, 'letterboxd:filmTitle');
  const year = Number(tag(item, 'letterboxd:filmYear'));
  if (!(title && Number.isInteger(year) && year > 0)) {
    return null;
  }
  const rating = Number(tag(item, 'letterboxd:memberRating'));
  const url = tag(item, 'link');
  return { title, year, ...(rating > 0 && { rating }), ...(url && { url }) };
}

/**
 * Lists the films of the diary feed, newest first, once each. The feed also carries watch dates,
 * lists and review text; only title, year, rating and link are kept.
 */
export function parseDiaryFeed(xml: string, updated: string, limit = 5): FilmsSummary {
  const seen = new Set<string>();
  const films: Film[] = [];
  for (const [item] of xml.matchAll(/<item>[\s\S]*?<\/item>/g)) {
    const film = filmOf(item);
    const key = film && `${film.title}|${film.year}`;
    if (film && key && !seen.has(key) && films.length < limit) {
      seen.add(key);
      films.push(film);
    }
  }
  return { updated, films };
}
