export const RETRO_STORAGE_KEY = 'retro';

export function readRetro(storage: Pick<Storage, 'getItem'>): boolean {
  return storage.getItem(RETRO_STORAGE_KEY) === 'on';
}

export function saveRetro(storage: Pick<Storage, 'setItem'>, on: boolean): void {
  storage.setItem(RETRO_STORAGE_KEY, on ? 'on' : 'off');
}

/** The styles of the retro mode hang from this attribute, which the head script sets before the first paint. */
export function applyRetro(root: Pick<HTMLElement, 'setAttribute' | 'removeAttribute'>, on: boolean): void {
  if (on) {
    root.setAttribute('data-retro', '');
  } else {
    root.removeAttribute('data-retro');
  }
}
