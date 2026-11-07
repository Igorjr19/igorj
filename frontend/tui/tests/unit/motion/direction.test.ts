import { assertEquals } from '@std/assert';
import { direction, motionReduced } from '../../../assets/ts/motion/direction.ts';

Deno.test('going to a pane further down the list, or deeper into one, is forward; back is backward', () => {
  assertEquals(direction('/en/', '/en/posts/'), 'forward');
  assertEquals(direction('/en/shelf/', '/en/projects/'), 'backward');
  assertEquals(direction('/en/posts/', '/en/posts/a-post/'), 'forward');
  assertEquals(direction('/en/posts/a-post/', '/en/posts/'), 'backward');
  assertEquals(direction('/en/categories/notes/', '/en/research/'), 'forward');
});

Deno.test('pages outside the panes, and the same page, have no direction', () => {
  assertEquals(direction('/en/tags/go/', '/en/posts/'), null);
  assertEquals(direction('/en/posts/', '/en/posts/'), null);
});

Deno.test('motion is reduced only by the choice made on the site, not by the system setting', () => {
  assertEquals([motionReduced('reduced'), motionReduced(null), motionReduced('full')], [true, false, false]);
});
