import type { TerminalData } from '../terminal/commands.ts';
import type { PickIndex } from './entries.ts';

/** What `site.json` holds: what the quick-pick box and the terminal both read, once per language. */
export type SiteIndex = PickIndex & TerminalData;

const loaded = new Map<string, Promise<SiteIndex>>();

/** Fetches the index of a language the first time it is asked for; later asks share the same answer. */
export function loadIndex(language: string): Promise<SiteIndex> {
  let promise = loaded.get(language);
  if (!promise) {
    promise = fetch(`/${language}/site.json`).then((response) => response.json() as Promise<SiteIndex>);
    promise.catch(() => loaded.delete(language));
    loaded.set(language, promise);
  }
  return promise;
}
