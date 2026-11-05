import { assertEquals } from '@std/assert';
import {
  readShortcutsEnabled,
  SHORTCUTS_STORAGE_KEY,
  saveShortcutsEnabled,
} from '../../../assets/ts/shortcuts/preference.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & { readonly map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}

Deno.test('shortcuts are on until the visitor turns them off', () => {
  assertEquals(readShortcutsEnabled(memoryStorage()), true);
});

Deno.test('turning shortcuts off is remembered, and turning them on again clears the saved value', () => {
  const storage = memoryStorage();
  saveShortcutsEnabled(storage, false);
  assertEquals(readShortcutsEnabled(storage), false);
  saveShortcutsEnabled(storage, true);
  assertEquals(readShortcutsEnabled(storage), true);
  assertEquals(storage.map.has(SHORTCUTS_STORAGE_KEY), false);
});
