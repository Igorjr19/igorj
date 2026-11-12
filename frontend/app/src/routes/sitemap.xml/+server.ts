import { XML_HEADERS } from '#lib/server/feeds.ts';
import { sitemapUrls } from '#lib/server/pages.ts';
import { renderSitemap } from '#lib/sitemap.ts';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = async () =>
  new Response(renderSitemap(await sitemapUrls()), { headers: XML_HEADERS });
