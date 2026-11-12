import { feedOf, XML_HEADERS } from '#lib/server/feeds.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () => {
  const languages = await modelLanguages();
  const models = await Promise.all(languages.map(async (lang) => [lang, await readModel(lang)] as const));
  return models.flatMap(([lang, model]) => model.tags.map((tag) => ({ lang, tag: tag.slug })));
};

export const GET: RequestHandler = async ({ params }) => {
  const model = await readModel(params.lang);
  const name = model.tags.find((tag) => tag.slug === params.tag)?.name ?? params.tag;
  const xml = await feedOf(
    model,
    `tags/${params.tag}/`,
    (post) => post.tags.some((tag) => tag.slug === params.tag),
    name,
  );
  return new Response(xml, { headers: XML_HEADERS });
};
