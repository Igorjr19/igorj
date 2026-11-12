import type { ItemSection } from '#lib/routes.ts';
import { readImages } from '#lib/server/images.ts';
import { rowOf } from '#lib/server/items.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () => {
  const languages = await modelLanguages();
  const models = await Promise.all(languages.map(async (lang) => [lang, await readModel(lang)] as const));
  return models.flatMap(([lang, model]) => model.tags.map((tag) => ({ lang, tag: tag.slug })));
};

const SECTIONS: readonly ItemSection[] = ['posts', 'projects', 'research'];

export const load: PageServerLoad = async ({ params }) => {
  const model = await readModel(params.lang);
  const images = await readImages();
  const tag = model.tags.find((candidate) => candidate.slug === params.tag);
  // A tag lists everything that carries it in the page language: posts, projects and research, each as its section shows it.
  const items = SECTIONS.flatMap((section) =>
    model[section]
      .filter((item) => item.language === params.lang && item.tags.some((candidate) => candidate.slug === params.tag))
      .map((item) => rowOf(section, item, images)),
  );
  return { name: tag?.name ?? params.tag, items };
};
