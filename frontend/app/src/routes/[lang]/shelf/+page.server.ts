import { isStale } from '#lib/home/data.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () => {
  const languages = await modelLanguages();
  const models = await Promise.all(languages.map(async (lang) => [lang, await readModel(lang)] as const));
  return models.filter(([, model]) => model.sections.shelf).map(([lang]) => ({ lang }));
};

export const load: PageServerLoad = async ({ params }) => {
  const { music, films, reading } = await readModel(params.lang);
  const now = new Date();
  const late = (updated: string | undefined): string | null => (updated && isStale(updated, now) ? updated : null);
  return {
    music: music && music.artists.length > 0 ? { ...music, updatedLate: late(music.updated) } : null,
    films: films && films.films.length > 0 ? { ...films, updatedLate: late(films.updated) } : null,
    reading,
  };
};
