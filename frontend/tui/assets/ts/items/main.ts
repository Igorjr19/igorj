/// <reference lib="dom" />
import { browserStorage } from '../shared/storage.ts';
import { type ItemsView, otherView, readView, saveView } from './view.ts';

/** Shows the selected item in full beside the rows; it copies the item's own details, so nothing new is fetched. */
function renderPreview(preview: HTMLElement, item: HTMLElement, hint: string): void {
  const link = item.querySelector<HTMLAnchorElement>('.item__link');
  const meta = document.createElement('p');
  meta.className = 'items__preview-meta';
  meta.textContent = item.querySelector('.item__meta')?.textContent ?? '';
  const title = document.createElement('h2');
  title.className = 'items__preview-title';
  title.textContent = item.querySelector('.item__title')?.textContent ?? '';
  const open = document.createElement('p');
  open.className = 'items__preview-hint';
  open.textContent = hint;
  const detail = item.querySelector('.item__detail')?.cloneNode(true) as HTMLElement | undefined;
  detail?.classList.replace('item__detail', 'items__preview-detail');
  preview.style.setProperty('--item-color', item.style.getPropertyValue('--item-color'));
  preview.replaceChildren(meta, title, ...(detail ? [detail] : []), open);
  preview.dataset['href'] = link?.href ?? '';
}

function setup(root: HTMLElement): void {
  const storage = browserStorage('localStorage');
  const items = [...root.querySelectorAll<HTMLElement>('.item')];
  const preview = document.createElement('aside');
  preview.className = 'items__preview';
  preview.setAttribute('aria-label', root.dataset['previewLabel'] ?? '');
  root.append(preview);
  const hint = root.dataset['openHint'] ?? '';
  let view: ItemsView = storage ? readView(storage) : 'list';

  const select = (item: HTMLElement): void => {
    for (const other of items) {
      other.dataset['selected'] = String(other === item);
    }
    renderPreview(preview, item, hint);
  };
  const apply = (): void => {
    root.dataset['view'] = view;
    preview.hidden = view !== 'list';
  };

  root.addEventListener('focusin', (event) => {
    const item = event.target instanceof Element ? event.target.closest<HTMLElement>('.item') : null;
    if (item) {
      select(item);
    }
  });
  root.addEventListener('mouseover', (event) => {
    const item = event.target instanceof Element ? event.target.closest<HTMLElement>('.item') : null;
    if (item && view === 'list' && item.dataset['selected'] !== 'true') {
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
    apply();
  });

  apply();
  if (items[0]) {
    select(items[0]);
  }
}

const root = document.querySelector<HTMLElement>('[data-items]');
if (root) {
  setup(root);
}
