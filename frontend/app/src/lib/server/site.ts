import { modelLanguages, readModel } from './model.ts';

const FALLBACK = 'https://igorj.dev/';

/** Where the edition being built lives: the address it declares, or `SITE_URL` for a site that declares none. */
async function siteUrl(): Promise<string> {
  const [language] = await modelLanguages();
  const declared = language ? (await readModel(language)).edition.url : null;
  return declared ?? process.env['SITE_URL'] ?? FALLBACK;
}

export const SITE_URL = await siteUrl();

/** The absolute address of a path of the site. */
export function absolute(path: string): string {
  return new URL(path, SITE_URL).href;
}
