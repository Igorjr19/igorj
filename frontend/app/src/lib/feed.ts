export interface FeedItem {
  readonly title: string;
  readonly link: string;
  /** YYYY-MM-DD, as the content gives it. */
  readonly date: string;
  readonly summary: string;
  readonly categories: readonly string[];
}

export interface Feed {
  readonly title: string;
  readonly link: string;
  readonly self: string;
  readonly description: string;
  readonly locale: string;
  readonly items: readonly FeedItem[];
}

const escapeXml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** An RFC 822 date at midnight UTC, which is what a feed reader expects of a day the content only dates. */
export function rfc822(day: string): string {
  return new Date(`${day}T00:00:00Z`).toUTCString().replace('GMT', '+0000');
}

/** The feed of the home has every post, a category feed its own posts, a tag feed everything with the tag; newest first. */
export function renderFeed(feed: Feed): string {
  const items = [...feed.items].sort((a, b) => b.date.localeCompare(a.date));
  const newest = items[0];
  const body = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <pubDate>${rfc822(item.date)}</pubDate>
      <guid>${escapeXml(item.link)}</guid>
      <description>${escapeXml(item.summary)}</description>
${item.categories.map((category) => `      <category>${escapeXml(category)}</category>\n`).join('')}    </item>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feed.title)}</title>
    <link>${escapeXml(feed.link)}</link>
    <description>${escapeXml(feed.description)}</description>
    <language>${escapeXml(feed.locale)}</language>
${newest ? `    <lastBuildDate>${rfc822(newest.date)}</lastBuildDate>\n` : ''}    <atom:link href="${escapeXml(feed.self)}" rel="self" type="application/rss+xml" />
${body}
  </channel>
</rss>
`;
}
