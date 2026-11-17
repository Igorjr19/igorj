import { buildSceneInput } from '#lib/scene/input.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () => (await modelLanguages()).map((lang) => ({ lang }));

// Read when the room starts, so no page carries it and the plain site never loads it.
export const GET: RequestHandler = async ({ params }) => {
  const { music, films, reading } = await readModel(params.lang);
  return new Response(JSON.stringify(buildSceneInput({ music: music ?? null, films: films ?? null, reading })), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
