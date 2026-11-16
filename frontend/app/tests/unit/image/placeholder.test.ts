import { assertEquals, assertNotEquals } from '@std/assert';
import { hashOf, placeholderGray } from '../../../tools/image/placeholder.ts';

Deno.test('the same text always draws the same picture, so a build never changes it', () => {
  assertEquals(placeholderGray('posts:a', 40, 20).data, placeholderGray('posts:a', 40, 20).data);
  assertEquals(hashOf('x'), hashOf('x'));
});

Deno.test('different texts draw different pictures', () => {
  assertNotEquals(placeholderGray('posts:a', 40, 20).data, placeholderGray('posts:b', 40, 20).data);
});

Deno.test('the picture uses the whole range softly: values stay between 0 and 1 and are not flat', () => {
  const { data } = placeholderGray('projects:autodep', 120, 60);
  assertEquals(
    data.every((value) => value >= 0 && value <= 1),
    true,
  );
  assertEquals(Math.max(...data) - Math.min(...data) > 0.3, true);
});
