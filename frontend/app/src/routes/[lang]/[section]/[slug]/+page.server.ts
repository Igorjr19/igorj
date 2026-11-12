import { error } from '@sveltejs/kit';
import type { ItemSection } from '#lib/routes.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

const ITEM_SECTIONS: readonly ItemSection[] = ['posts', 'projects', 'research'];

export const entries: EntryGenerator = async () => {
  const languages = await modelLanguages();
  const pages = await Promise.all(
    languages.map(async (lang) => {
      const model = await readModel(lang);
      return ITEM_SECTIONS.flatMap((section) =>
        model[section].filter((item) => item.language === lang).map((item) => ({ lang, section, slug: item.slug })),
      );
    }),
  );
  return pages.flat();
};

export const load: PageServerLoad = async ({ params }) => {
  const model = await readModel(params.lang);
  const section = ITEM_SECTIONS.find((candidate) => candidate === params.section);
  const item = section ? model[section].find((candidate) => candidate.slug === params.slug) : undefined;
  if (!item) {
    error(404);
  }
  return { title: item.title };
};
