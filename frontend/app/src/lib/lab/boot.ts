import type { SystemData } from '../home/types.ts';

/** The lines of a power-on self test, built from facts of this very build. */
export function bootLines(system: SystemData): readonly string[] {
  const counts = system.counts;
  const content = [
    counts.posts === null ? null : `${counts.posts} posts`,
    counts.projects === null ? null : `${counts.projects} projects`,
    counts.research === null ? null : `${counts.research} research`,
  ].filter((part): part is string => part !== null);
  return [
    'IGORJ BIOS v1',
    `build ${system.commit?.slice(0, 7) ?? 'local'} ${system.built}`,
    `content ${content.join(' · ') || 'none'}`,
    ...(system.sources.length > 0 ? [`data ${system.sources.join(' · ')}`] : []),
    'memory test ... ok',
    'starting the window ...',
  ];
}
