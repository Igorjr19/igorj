import { assertEquals } from '@std/assert';
import { colorImages, isExternal, mediaPath } from '../../../tools/image/references.ts';

Deno.test('a path is resolved from the folder of the item, through dots and parent folders', () => {
  assertEquals(mediaPath('posts/one', 'a.png'), 'posts/one/a.png');
  assertEquals(mediaPath('posts/one', './img/../a.png'), 'posts/one/a.png');
  assertEquals(mediaPath('posts/one', '../shared/a.png'), 'posts/shared/a.png');
});

Deno.test('addresses of other sites and absolute paths are external', () => {
  assertEquals([isExternal('https://x.dev/a.png'), isExternal('/a.png'), isExternal('a.png')], [true, true, false]);
});

Deno.test('only the images marked #color are asked for in color, resolved, and a mark on an external image is ignored', () => {
  const body = [
    '![plain](plain.png)',
    '![chart](charts/chart.png#color)',
    '![titled](titled.png#color "A title")',
    '![remote](https://x.dev/r.png#color)',
    'text ![inline](inline.png#color) more',
  ].join('\n');
  assertEquals([...colorImages(body, 'posts/one')].sort(), [
    'posts/one/charts/chart.png',
    'posts/one/inline.png',
    'posts/one/titled.png',
  ]);
});
