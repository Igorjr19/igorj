import { assertEquals } from '@std/assert';
import { browserStorage } from '../../../assets/ts/shared/storage.ts';

Deno.test('browserStorage returns null instead of throwing when the browser blocks site data', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    get: () => {
      throw new DOMException('Access denied', 'SecurityError');
    },
  });
  try {
    assertEquals(browserStorage('sessionStorage'), null);
  } finally {
    if (original) {
      Object.defineProperty(globalThis, 'sessionStorage', original);
    } else {
      Reflect.deleteProperty(globalThis, 'sessionStorage');
    }
  }
});
