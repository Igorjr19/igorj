import { languageInfo } from '#lib/languages.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () => {
  const languages = await modelLanguages();
  const models = await Promise.all(languages.map(async (lang) => [lang, await readModel(lang)] as const));
  return models.filter(([, model]) => model.sections.cv).map(([lang]) => ({ lang }));
};

export const load: PageServerLoad = async ({ params }) => {
  const { cv } = await readModel(params.lang);
  return { cv, shownIn: cv?.fallback ? languageInfo(cv.language).name : null };
};
