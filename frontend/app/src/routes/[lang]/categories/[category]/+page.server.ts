import { categoryCounts, rowsOf, termAlternates } from '#lib/server/items.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () => {
  const languages = await modelLanguages();
  const models = await Promise.all(languages.map(async (lang) => [lang, await readModel(lang)] as const));
  return models.flatMap(([lang, model]) =>
    model.sections.posts ? categoryCounts(model).map((category) => ({ lang, category: category.slug })) : [],
  );
};

export const load: PageServerLoad = async ({ params }) => {
  const model = await readModel(params.lang);
  const rows = await rowsOf(model, 'posts');
  const category = model.categories.find((candidate) => candidate.slug === params.category);
  return {
    name: category?.name ?? params.category,
    slug: params.category,
    // A category lists only the posts written in the page language; the blog lists every post the model gives it.
    items: rows.filter((row) => row.language === params.lang && row.category?.slug === params.category),
    categories: categoryCounts(model),
    alternates: await termAlternates('categories', params.category, params.lang),
  };
};
