import { assertEquals } from '@std/assert';
import { applyRetro, readRetro, saveRetro } from '../../../src/lib/retro/retro.ts';

function memory(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem'> {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

Deno.test('retro is off until it is turned on, and what is saved is read back', () => {
  const storage = memory();
  assertEquals(readRetro(storage), false);
  saveRetro(storage, true);
  assertEquals(readRetro(storage), true);
  saveRetro(storage, false);
  assertEquals(readRetro(storage), false);
});

Deno.test('anything saved other than on counts as off, so a corrupted value never turns the effect on', () => {
  assertEquals(readRetro(memory({ retro: 'yes' })), false);
});

Deno.test('the attribute is set when retro is on and removed when it is off', () => {
  const attributes = new Set<string>();
  const root = {
    setAttribute: (name: string) => void attributes.add(name),
    removeAttribute: (name: string) => void attributes.delete(name),
  };
  applyRetro(root, true);
  assertEquals([...attributes], ['data-retro']);
  applyRetro(root, false);
  assertEquals([...attributes], []);
});
