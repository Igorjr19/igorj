import { modelLanguages, readModel } from '#lib/server/model.ts';
import { buildSiteIndex } from '#lib/server/site-index.ts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () => (await modelLanguages()).map((lang) => ({ lang }));

// Read on first use by the quick-pick box, so no page carries it.
export const GET: RequestHandler = async ({ params }) =>
  new Response(JSON.stringify(await buildSiteIndex(await readModel(params.lang))), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
