import { categoryCounts, rowsOf } from '#lib/server/items.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () => {
  const languages = await modelLanguages();
  const models = await Promise.all(languages.map(async (lang) => [lang, await readModel(lang)] as const));
  return models.filter(([, model]) => model.sections.posts).map(([lang]) => ({ lang }));
};

export const load: PageServerLoad = async ({ params }) => {
  const model = await readModel(params.lang);
  return { items: await rowsOf(model, 'posts'), categories: categoryCounts(model) };
};
