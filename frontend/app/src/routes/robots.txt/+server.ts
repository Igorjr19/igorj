import { modelLanguages, readModel } from '#lib/server/model.ts';
import { absolute } from '#lib/server/site.ts';
import type { RequestHandler } from './$types';

export const prerender = true;

/** An edition search engines may not list asks them to leave the whole site alone and offers no map of it. */
async function indexed(): Promise<boolean> {
  const [language] = await modelLanguages();
  return language ? (await readModel(language)).edition.index : true;
}

export const GET: RequestHandler = async () =>
  new Response(
    (await indexed())
      ? `User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap.xml')}\n`
      : 'User-agent: *\nDisallow: /\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
