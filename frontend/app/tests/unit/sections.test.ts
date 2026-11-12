import { assertEquals } from '@std/assert';
import { panesOf } from '../../src/lib/sections.ts';

const model = {
  sections: { projects: true, posts: true, research: false, cv: true, shelf: true },
  projects: [1, 2],
  posts: [1, 2, 3],
  research: [],
} as never;

Deno.test('a pane the content turns off is not there, and the number keys follow the panes that are', () => {
  const panes = panesOf('en', model);
  assertEquals(
    panes.map((pane) => [pane.number, pane.section.key]),
    [
      [1, 'home'],
      [2, 'projects'],
      [3, 'posts'],
      [4, 'cv'],
      [5, 'shelf'],
    ],
  );
});

Deno.test('lists show how many items they hold and the other panes show nothing', () => {
  const panes = panesOf('en', model);
  assertEquals(
    panes.map((pane) => pane.count),
    [null, 2, 3, null, null],
  );
});

Deno.test('every pane opens under its language', () => {
  assertEquals(
    panesOf('pt', model).map((pane) => pane.href),
    ['/pt/', '/pt/projects/', '/pt/posts/', '/pt/cv/', '/pt/shelf/'],
  );
});
