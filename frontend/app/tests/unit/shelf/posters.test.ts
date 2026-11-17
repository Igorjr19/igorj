import { assertEquals } from '@std/assert';
import { posterAt, posterSources } from '../../../src/lib/shelf/posters.ts';

const FULL =
  'https://a.ltrbxd.com/resized/film-poster/1/1/6/7/1/5/1/1167151-verity-2026-0-600-0-900-crop.jpg?v=3169444893';

Deno.test('a poster address is asked for at another size by changing the size in its name, keeping the 2:3 and the version', () => {
  assertEquals(
    posterAt(FULL, 230),
    'https://a.ltrbxd.com/resized/film-poster/1/1/6/7/1/5/1/1167151-verity-2026-0-230-0-345-crop.jpg?v=3169444893',
  );
  assertEquals(posterAt(FULL, 460).includes('-0-460-0-690-crop'), true);
});

Deno.test('an address that does not carry a size is left as it is, so the picture still shows, only larger', () => {
  const plain = 'https://a.ltrbxd.com/some/other/poster.jpg';
  assertEquals(posterAt(plain, 230), plain);
});

Deno.test('the sources give the small poster and a set with the double size for dense screens', () => {
  const { src, srcset } = posterSources(FULL);
  assertEquals(src.includes('-0-230-0-345-crop'), true);
  assertEquals(
    srcset.split(', ').map((part) => part.split(' ')[1]),
    ['230w', '460w'],
  );
});
