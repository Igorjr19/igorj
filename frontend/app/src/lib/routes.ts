import type { ItemModel } from '../../../../tools/model/types.ts';

export type ItemSection = 'posts' | 'projects' | 'research';

/** An item's page lives under the language it is written in, which may differ from the language of the page that lists it. */
export function itemHref(section: ItemSection, item: Pick<ItemModel, 'language' | 'slug'>): string {
  return `/${item.language}/${section}/${item.slug}/`;
}
