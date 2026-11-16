import { assertEquals } from '@std/assert';
import { isExternal } from '../../src/lib/external-links.ts';

const ORIGIN = 'https://igorj.dev';

Deno.test('a link to another site is external, and a link within the site, relative or absolute, is not', () => {
  assertEquals(isExternal('https://github.com/x', ORIGIN), true);
  assertEquals(isExternal('/en/posts/', ORIGIN), false);
  assertEquals(isExternal('https://igorj.dev/en/', ORIGIN), false);
  assertEquals(isExternal('mailto:a@b.c', ORIGIN), true);
});

Deno.test('a link nobody can read as an address is left alone', () => {
  assertEquals(isExternal('http://', ORIGIN), false);
});
