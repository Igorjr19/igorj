import { translate } from '#lib/i18n.ts';
import { languageInfo } from '#lib/languages.ts';
import { buildSceneInput, SCENE_STRING_KEYS } from '#lib/scene/input.ts';
import { readDictionary } from '#lib/server/i18n.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () => (await modelLanguages()).map((lang) => ({ lang }));

// Read when the room starts, so no page carries it and the plain site never loads it.
export const GET: RequestHandler = async ({ params }) => {
  const { music, films, reading } = await readModel(params.lang);
  const dictionary = await readDictionary(params.lang);
  const { locale } = languageInfo(params.lang);
  const strings = Object.fromEntries(SCENE_STRING_KEYS.map((key) => [key, translate(dictionary, locale, key)]));
  return new Response(
    JSON.stringify(buildSceneInput({ music: music ?? null, films: films ?? null, reading }, strings)),
    {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    },
  );
};
