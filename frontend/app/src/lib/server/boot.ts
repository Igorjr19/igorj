import type { SiteModel } from '../../../../../tools/model/types.ts';
import type { Dictionary } from '../i18n.ts';
import { translate } from '../i18n.ts';
import { languageInfo } from '../languages.ts';
import { bootLines } from '../monitor/boot-lines.ts';
import { systemOf } from './home.ts';

export interface BootData {
  readonly lines: readonly string[];
  readonly skip: string;
}

const made = new Map<string, Promise<BootData>>();

/** What the monitor types while it starts, worded once per language for the whole build. */
export function bootOf(model: SiteModel, dictionary: Dictionary): Promise<BootData> {
  const known = made.get(model.language);
  if (known) {
    return known;
  }
  const locale = languageInfo(model.language).locale;
  const t = (key: string, argument?: Parameters<typeof translate>[3]): string =>
    translate(dictionary, locale, key, argument);
  const next = systemOf(model, new Date()).then((system) => ({ lines: bootLines(system, t), skip: t('bootSkip') }));
  made.set(model.language, next);
  return next;
}
