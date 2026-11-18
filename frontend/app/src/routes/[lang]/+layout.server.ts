import { brandOf } from '#lib/brand.ts';
import { panesOf } from '#lib/sections.ts';
import { readFontPreloads } from '#lib/server/fonts.ts';
import { readDictionary } from '#lib/server/i18n.ts';
import { readModel } from '#lib/server/model.ts';
import { SITE_URL } from '#lib/server/site.ts';
import { readThemeNames } from '#lib/server/theme-names.ts';
import type { ShellData } from '#lib/shell.svelte.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }): Promise<{ shell: ShellData }> => {
  const model = await readModel(params.lang);
  return {
    shell: {
      language: params.lang,
      languages: model.languages,
      host: brandOf(new URL(SITE_URL).host),
      siteUrl: SITE_URL,
      indexed: model.edition.index,
      description: model.profile?.description ?? '',
      fontPreloads: await readFontPreloads(),
      themeNames: await readThemeNames(),
      author: model.profile?.author ?? '',
      siteTitle: model.profile?.title ?? '',
      role: model.profile?.role ?? '',
      contact: model.contact,
      panes: panesOf(params.lang, model),
      dictionary: await readDictionary(params.lang),
    },
  };
};
