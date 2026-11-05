export const LANGUAGE_STORAGE_KEY = 'language';
export const SITE_LANGUAGES = ['pt', 'en'] as const;
export type SiteLanguage = (typeof SITE_LANGUAGES)[number];

const DEFAULT_LANGUAGE: SiteLanguage = 'en';

/** "pt-BR" and "pt" are both Portuguese; anything the site is not written in has no match. */
export function siteLanguageOf(tag: string | null): SiteLanguage | null {
  const primary = tag?.toLowerCase().split('-')[0];
  return SITE_LANGUAGES.find((language) => language === primary) ?? null;
}

/** A language chosen earlier wins; otherwise the first browser preference the site is written in, else English. */
export function chooseLanguage(saved: string | null, browserLanguages: readonly string[]): SiteLanguage {
  const chosen = siteLanguageOf(saved);
  if (chosen) {
    return chosen;
  }
  for (const tag of browserLanguages) {
    const match = siteLanguageOf(tag);
    if (match) {
      return match;
    }
  }
  return DEFAULT_LANGUAGE;
}
