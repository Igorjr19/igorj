import { assertEquals, assertExists, assertThrows } from '@std/assert';
import { groupFamilies } from '../../../tools/themes/families.ts';
import { resolvedTheme } from './fixtures.ts';

Deno.test('groupFamilies pairs the light and dark variants of a family', () => {
  const [family] = groupFamilies([
    resolvedTheme('a-light', 'a', 'light', '#ffffff'),
    resolvedTheme('a-dark', 'a', 'dark', '#000000'),
  ]);
  assertExists(family);
  assertEquals([family.name, family.light.manifest.id, family.dark.manifest.id], ['a', 'a-light', 'a-dark']);
});

Deno.test('groupFamilies rejects a family without both variants', () => {
  assertThrows(
    () => groupFamilies([resolvedTheme('a-light', 'a', 'light', '#ffffff')]),
    Error,
    'needs a light and a dark',
  );
});

Deno.test('groupFamilies follows the system with the variant marked system, and lists the light themes first', () => {
  const [family] = groupFamilies([
    resolvedTheme('a-dim', 'a', 'dark', '#222222'),
    resolvedTheme('a-light', 'a', 'light', '#ffffff'),
    resolvedTheme('a-night', 'a', 'dark', '#000000', true),
  ]);
  assertExists(family);
  assertEquals(family.dark.manifest.id, 'a-night');
  assertEquals(
    family.themes.map((theme) => theme.manifest.id),
    ['a-light', 'a-dim', 'a-night'],
  );
});

Deno.test('groupFamilies rejects two variants of a kind when neither is marked system', () => {
  assertThrows(
    () =>
      groupFamilies([
        resolvedTheme('a-light', 'a', 'light', '#ffffff'),
        resolvedTheme('a-light-2', 'a', 'light', '#eeeeee'),
        resolvedTheme('a-dark', 'a', 'dark', '#000000'),
      ]),
    Error,
    'mark exactly one with system = true',
  );
});
