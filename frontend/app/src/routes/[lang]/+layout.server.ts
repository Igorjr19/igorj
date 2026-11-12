import { panesOf } from '#lib/sections.ts';
import { readFontPreloads } from '#lib/server/fonts.ts';
import { readDictionary } from '#lib/server/i18n.ts';
import { readModel } from '#lib/server/model.ts';
import type { ShellData } from '#lib/shell.svelte.ts';
import type { LayoutServerLoad } from './$types';

const SITE_URL = process.env['SITE_URL'] ?? 'https://igorj.dev/';

export const load: LayoutServerLoad = async ({ params }): Promise<{ shell: ShellData }> => {
  const model = await readModel(params.lang);
  return {
    shell: {
      language: params.lang,
      languages: model.languages,
      host: new URL(SITE_URL).host,
      siteUrl: SITE_URL,
      description: model.profile?.description ?? '',
      fontPreloads: await readFontPreloads(),
      author: model.profile?.author ?? '',
      siteTitle: model.profile?.title ?? '',
      role: model.profile?.role ?? '',
      contact: model.contact,
      panes: panesOf(params.lang, model),
      dictionary: await readDictionary(params.lang),
    },
  };
};
