import { assertEquals } from '@std/assert';
import { brandOf } from '../../src/lib/brand.ts';

Deno.test('an edition on a subdomain carries the name of the main site, so the corner never changes between editions', () => {
  assertEquals(brandOf('pro.igorj.dev'), 'igorj.dev');
  assertEquals(brandOf('igorj.dev'), 'igorj.dev');
  assertEquals(brandOf('localhost:4173'), 'localhost:4173');
});
