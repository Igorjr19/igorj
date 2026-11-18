import { assertEquals } from '@std/assert';
import { webKind, webSize } from '../../../tools/image/web.ts';

Deno.test('a picture no wider than the limit needs no copy, so a small one is served as it is', () => {
  assertEquals(webSize(800, 400, 1600), null);
  assertEquals(webSize(1600, 400, 1600), null);
});

Deno.test('a wider picture is scaled to the limit in its own proportions', () => {
  assertEquals(webSize(3200, 1800, 1600), { width: 1600, height: 900 });
  assertEquals(webSize(2000, 1001, 1600), { width: 1600, height: 801 });
});

Deno.test('a PNG stays a PNG, which keeps drawings sharp, and any other picture becomes a JPEG, which keeps photographs small', () => {
  assertEquals(webKind('posts/a/chart.PNG'), 'png');
  assertEquals(webKind('posts/a/photo.jpg'), 'jpg');
  assertEquals(webKind('posts/a/photo.webp'), 'jpg');
});
