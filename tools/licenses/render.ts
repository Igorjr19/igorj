import type { Notice } from './types.ts';

const SEPARATOR = '-'.repeat(72);

export function renderNotices(notices: readonly Notice[]): string {
  const sections = notices.map(({ name, license, homepage, text }) =>
    [SEPARATOR, `${name} (${license})`, homepage, '', text.trim()].join('\n'),
  );
  return ['Third-party software and data distributed with this site.', '', ...sections, ''].join('\n');
}
