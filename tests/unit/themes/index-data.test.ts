import { assertEquals } from '@std/assert';
import { groupFamilies } from '../../../tools/themes/families.ts';
import { describeThemes } from '../../../tools/themes/index-data.ts';
import { resolvedTheme } from './fixtures.ts';

Deno.test('describeThemes lists each family with its light theme first, and names the default family', () => {
  const families = groupFamilies([
    resolvedTheme('one-dark', 'one', 'dark', '#000000'),
    resolvedTheme('one-light', 'one', 'light', '#ffffff'),
  ]);
  assertEquals(describeThemes(families, 'one'), {
    defaultFamily: 'one',
    families: [
      {
        name: 'one',
        label: 'One',
        themes: [
          { id: 'one-light', name: 'one-light', variant: 'light' },
          { id: 'one-dark', name: 'one-dark', variant: 'dark' },
        ],
      },
    ],
  });
});
