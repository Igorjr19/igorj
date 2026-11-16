import type { SystemData } from '../home/types.ts';
import type { Argument } from '../i18n.ts';

export type Translate = (key: string, argument?: Argument) => string;

/** The lines of a power-on self test, made of facts of this very build, worded in the language of the page. */
export function bootLines(system: SystemData, t: Translate): readonly string[] {
  const { counts } = system;
  const content = [
    counts.posts === null ? null : t('bootPosts', counts.posts),
    counts.projects === null ? null : t('bootProjects', counts.projects),
    counts.research === null ? null : t('bootResearch', counts.research),
  ].filter((part): part is string => part !== null);
  return [
    t('bootBios'),
    // biome-ignore lint/style/useNamingConvention: the strings files name their placeholders in capitals
    t('bootBuild', { Commit: system.commit?.slice(0, 7) ?? t('bootLocal'), Built: system.built }),
    ...(content.length > 0 ? [t('bootContent', content.join(' · '))] : []),
    ...(system.sources.length > 0 ? [t('bootData', system.sources.join(' · '))] : []),
    t('bootMemory'),
    t('bootStart'),
  ];
}
