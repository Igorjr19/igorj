import { absolute } from '#lib/server/site.ts';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap.xml')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
