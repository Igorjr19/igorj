/** What the interface knows about each language of the content: the locale for `lang` and plural rules, the short tag shown in the switcher and the name used in sentences. */
export interface LanguageInfo {
  readonly locale: string;
  readonly label: string;
  readonly name: string;
}

export const LANGUAGES: Readonly<Record<string, LanguageInfo>> = {
  pt: { locale: 'pt-BR', label: 'pt-br', name: 'Português' },
  en: { locale: 'en', label: 'en-us', name: 'English' },
};

export function languageInfo(language: string): LanguageInfo {
  return LANGUAGES[language] ?? { locale: language, label: language, name: language };
}
