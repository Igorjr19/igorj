/// <reference lib="dom" />
import { browserStorage } from '../shared/storage.ts';
import { type ItemsView, otherView, readView, saveView } from './view.ts';

function setup(root: HTMLElement): void {
  const storage = browserStorage('localStorage');
  const items = [...root.querySelectorAll<HTMLElement>('.item')];
  const position = document.querySelector('[data-status-position]');
  let view: ItemsView = storage ? readView(storage) : 'list';

  /** The selected item stands out, and the status line says where it is in the list. */
  const select = (item: HTMLElement): void => {
    for (const other of items) {
      other.dataset['selected'] = String(other === item);
    }
    if (position) {
      position.textContent = `${items.indexOf(item) + 1}/${items.length}`;
    }
  };

  root.addEventListener('focusin', (event) => {
    const item = event.target instanceof Element ? event.target.closest<HTMLElement>('.item') : null;
    if (item) {
      select(item);
    }
  });
  document.addEventListener('items:toggle-view', () => {
    view = otherView(view);
    try {
      if (storage) {
        saveView(storage, view);
      }
    } catch {
      // Storage full or blocked: the view lasts until the page closes.
    }
    root.dataset['view'] = view;
  });

  root.dataset['view'] = view;
  if (items[0]) {
    select(items[0]);
  }
}

const root = document.querySelector<HTMLElement>('[data-items]');
if (root) {
  setup(root);
}
