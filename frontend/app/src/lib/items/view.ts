export type ItemsView = 'list' | 'grid';

export const VIEW_STORAGE_KEY = 'items-view';

/** The list is the default; only an explicit grid choice is remembered as such. */
export function readView(storage: Pick<Storage, 'getItem'>): ItemsView {
  return storage.getItem(VIEW_STORAGE_KEY) === 'grid' ? 'grid' : 'list';
}

export function otherView(view: ItemsView): ItemsView {
  return view === 'list' ? 'grid' : 'list';
}

export function saveView(storage: Pick<Storage, 'setItem'>, view: ItemsView): void {
  storage.setItem(VIEW_STORAGE_KEY, view);
}
