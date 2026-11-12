import { getContext, setContext } from 'svelte';
import type { ContactModel } from '../../../../tools/model/types.ts';
import { type Argument, type Dictionary, translate } from './i18n.ts';
import { languageInfo } from './languages.ts';
import type { Pane } from './sections.ts';

/** What every page of a language shares: who the site is about, the panes that are on, the interface text. */
export interface ShellData {
  readonly language: string;
  readonly languages: readonly string[];
  readonly host: string;
  readonly author: string;
  readonly role: string;
  readonly contact: ContactModel | null;
  readonly panes: readonly Pane[];
  readonly dictionary: Dictionary;
}

export class Shell {
  readonly #data: () => ShellData;

  constructor(data: () => ShellData) {
    this.#data = data;
  }

  get language(): string {
    return this.#data().language;
  }

  get languages(): readonly string[] {
    return this.#data().languages;
  }

  get host(): string {
    return this.#data().host;
  }

  get author(): string {
    return this.#data().author;
  }

  get role(): string {
    return this.#data().role;
  }

  get contact(): ContactModel | null {
    return this.#data().contact;
  }

  get panes(): readonly Pane[] {
    return this.#data().panes;
  }

  get locale(): string {
    return languageInfo(this.language).locale;
  }

  t = (key: string, argument?: Argument): string => translate(this.#data().dictionary, this.locale, key, argument);

  /** The label of a first address segment such as `posts`, or the segment itself when the interface has no word for it. */
  sectionLabel = (segment: string): string => {
    const key = `section${segment.charAt(0).toUpperCase()}${segment.slice(1)}`;
    return key in this.#data().dictionary ? this.t(key) : segment;
  };
}

const KEY = Symbol('shell');

export function provideShell(data: () => ShellData): Shell {
  const shell = new Shell(data);
  setContext(KEY, shell);
  return shell;
}

export function useShell(): Shell {
  return getContext<Shell>(KEY);
}
