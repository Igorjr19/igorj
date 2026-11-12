import { enabledSections } from '#lib/sections.ts';
import { modelLanguages, readModel } from '#lib/server/model.ts';
import type { EntryGenerator } from './$types';

// These panes have pages of their own.
const DEDICATED = ['projects', 'posts', 'research', 'cv'];

export const entries: EntryGenerator = async () => {
  const languages = await modelLanguages();
  const models = await Promise.all(languages.map(async (lang) => [lang, await readModel(lang)] as const));
  return models.flatMap(([lang, model]) =>
    enabledSections(model.sections)
      .filter((section) => section.path !== '' && !DEDICATED.includes(section.path))
      .map((section) => ({ lang, section: section.path })),
  );
};
