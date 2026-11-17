import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { SPINE_ROLES, spineOf } from '../../../src/lib/shelf/spines.ts';

Deno.test('a book has the same spine on every build, whatever else is on the shelf', () => {
  assertEquals(spineOf('Data Science do Zero', 'book'), spineOf('Data Science do Zero', 'book'));
});

Deno.test('a spine takes a theme role, a height of ten to thirteen lines and a thickness of two or three cells', () => {
  for (const title of ['A', 'Data Science do Zero', 'Pare de se pré-ocupar', 'Dom Casmurro', 'Ñ']) {
    const spine = spineOf(title, 'book');
    assert(SPINE_ROLES.includes(spine.role));
    assert(spine.height >= 10 && spine.height <= 13);
    assert(spine.width === 2 || spine.width === 3);
  }
});

Deno.test('different titles do not all look alike', () => {
  const looks = new Set(
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((title) => JSON.stringify(spineOf(title, 'book'))),
  );
  assert(looks.size > 3);
});

Deno.test('a paper is a short spine, whatever its title', () => {
  const spine = spineOf('Some paper', 'paper');
  assertEquals([spine.width, spine.height], [2, 8]);
  assertNotEquals(spine.role, undefined);
});
