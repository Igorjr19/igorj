import type { SectionKey, SiteModel } from '../../../../tools/model/types.ts';

/**
 * Every pane of the window, declared once: the key, the address under the language, the label's text key and
 * whether the content turns it on. The number key of a pane is its position among the panes that are on.
 */
export interface Section {
  readonly key: 'home' | SectionKey;
  readonly path: string;
  readonly label: string;
  /** The model section that switches the pane on and holds the items it counts; the home has none. */
  readonly model?: SectionKey;
  /** Whether the side column shows how many items the pane holds. */
  readonly counts?: boolean;
}

export const SECTIONS: readonly Section[] = [
  { key: 'home', path: '', label: 'paneHome' },
  { key: 'projects', path: 'projects', label: 'paneProjects', model: 'projects', counts: true },
  { key: 'posts', path: 'posts', label: 'panePosts', model: 'posts', counts: true },
  { key: 'research', path: 'research', label: 'paneResearch', model: 'research', counts: true },
  { key: 'cv', path: 'cv', label: 'paneCv', model: 'cv' },
  { key: 'shelf', path: 'shelf', label: 'paneShelf', model: 'shelf' },
];

export interface Pane {
  readonly section: Section;
  readonly href: string;
  readonly number: number;
  readonly count: number | null;
}

export function enabledSections(sections: SiteModel['sections']): Section[] {
  return SECTIONS.filter((section) => section.model === undefined || sections[section.model]);
}

export function panesOf(
  language: string,
  model: Pick<SiteModel, 'sections' | 'projects' | 'posts' | 'research'>,
): Pane[] {
  const counted: Partial<Record<Section['key'], number>> = {
    projects: model.projects.length,
    posts: model.posts.length,
    research: model.research.length,
  };
  return enabledSections(model.sections).map((section, index) => ({
    section,
    href: `/${language}/${section.path ? `${section.path}/` : ''}`,
    number: index + 1,
    count: section.counts ? (counted[section.key] ?? 0) : null,
  }));
}
