import { feedOf, XML_HEADERS } from '#lib/server/feeds.ts';
import { categoryCounts } from '#lib/server/items.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () => {
  const languages = await modelLanguages();
  const models = await Promise.all(languages.map(async (lang) => [lang, await readModel(lang)] as const));
  return models.flatMap(([lang, model]) =>
    model.sections.posts ? categoryCounts(model).map((category) => ({ lang, category: category.slug })) : [],
  );
};

export const GET: RequestHandler = async ({ params }) => {
  const model = await readModel(params.lang);
  const name = model.categories.find((category) => category.slug === params.category)?.name ?? params.category;
  const xml = await feedOf(
    model,
    `categories/${params.category}/`,
    (post) => post.category.slug === params.category,
    name,
  );
  return new Response(xml, { headers: XML_HEADERS });
};
