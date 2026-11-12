import { feedOf, XML_HEADERS } from '#lib/server/feeds.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () => (await modelLanguages()).map((lang) => ({ lang }));

export const GET: RequestHandler = async ({ params }) =>
  new Response(await feedOf(await readModel(params.lang), '', () => true), { headers: XML_HEADERS });
