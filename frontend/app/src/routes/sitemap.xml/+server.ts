import { XML_HEADERS } from '#lib/server/feeds.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import { sitemapUrls } from '#lib/server/pages.ts';
import { renderSitemap } from '#lib/sitemap.ts';
import type { RequestHandler } from './$types';

export const prerender = true;

/** An edition search engines may not list has an empty map. */
async function urls(): ReturnType<typeof sitemapUrls> {
  const [language] = await modelLanguages();
  return language && !(await readModel(language)).edition.index ? [] : sitemapUrls();
}

export const GET: RequestHandler = async () => new Response(renderSitemap(await urls()), { headers: XML_HEADERS });
