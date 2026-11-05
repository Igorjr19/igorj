import { assertEquals } from '@std/assert';
import { ORIGIN_STORAGE_KEY, saveOrigin, shouldRestoreFocus, takeOrigin } from '../../../assets/ts/home/origin.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & { readonly map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}

Deno.test('the origin is handed back once, so a later visit does not jump to an old place', () => {
  const storage = memoryStorage();
  saveOrigin(storage, { panel: 'posts', href: '/en/posts/a/' });
  assertEquals(takeOrigin(storage), { panel: 'posts', href: '/en/posts/a/' });
  assertEquals(takeOrigin(storage), null);
});

Deno.test('a damaged or foreign saved value is ignored instead of breaking the home', () => {
  for (const saved of ['not json', '{"panel":1,"href":"/x"}', '[]', '{"panel":"posts"}']) {
    const storage = memoryStorage();
    storage.map.set(ORIGIN_STORAGE_KEY, saved);
    assertEquals(takeOrigin(storage), null);
    assertEquals(storage.map.size, 0);
  }
});

Deno.test('focus returns after coming back from the site, never after a reload or a fresh visit', () => {
  assertEquals(shouldRestoreFocus('navigate', true), true);
  assertEquals(shouldRestoreFocus('back_forward', false), true);
  assertEquals(shouldRestoreFocus('navigate', false), false);
  assertEquals(shouldRestoreFocus('reload', true), false);
});
