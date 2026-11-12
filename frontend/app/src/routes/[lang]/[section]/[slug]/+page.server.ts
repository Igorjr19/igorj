import { error } from '@sveltejs/kit';
import type { ItemSection } from '#lib/routes.ts';
import { readDictionary } from '#lib/server/i18n.ts';
import { itemAlternates, itemPageOf } from '#lib/server/items.ts';
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
  if (!(section && item)) {
    error(404);
  }
  const copy = (await readDictionary(params.lang))['codeCopy'];
  return {
    item: await itemPageOf(model, section, item, typeof copy === 'string' ? copy : 'copy'),
    alternates: await itemAlternates(section, item.id, params.lang),
  };
};
