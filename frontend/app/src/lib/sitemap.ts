export interface SitemapUrl {
  readonly loc: string;
  readonly lastmod?: string | undefined;
  /** The same page in every language it exists in, itself included, by locale. */
  readonly alternates: Readonly<Record<string, string>>;
}

const escapeXml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** One sitemap for every page, each with its language alternates so search engines pair the translations. */
export function renderSitemap(urls: readonly SitemapUrl[]): string {
  const entries = urls
    .map((url) => {
      const links = Object.entries(url.alternates)
        .map(
          ([locale, href]) =>
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(href)}" />\n`,
        )
        .join('');
      const lastmod = url.lastmod ? `    <lastmod>${escapeXml(url.lastmod)}</lastmod>\n` : '';
      return `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n${lastmod}${links}  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;
}
