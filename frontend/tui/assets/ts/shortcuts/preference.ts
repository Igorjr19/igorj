export const SHORTCUTS_STORAGE_KEY = 'shortcuts';
const DISABLED = 'off';

export function readShortcutsEnabled(storage: Pick<Storage, 'getItem'>): boolean {
  return storage.getItem(SHORTCUTS_STORAGE_KEY) !== DISABLED;
}

export function saveShortcutsEnabled(storage: Pick<Storage, 'setItem' | 'removeItem'>, enabled: boolean): void {
  if (enabled) {
    storage.removeItem(SHORTCUTS_STORAGE_KEY);
  } else {
    storage.setItem(SHORTCUTS_STORAGE_KEY, DISABLED);
  }
}
