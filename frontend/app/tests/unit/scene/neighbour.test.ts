import { assertEquals } from '@std/assert';
import { type Anchor, neighbour } from '../../../src/lib/scene/neighbour.ts';

const anchors: Record<string, Anchor> = {
  window: { x: -0.5, y: 0.4 },
  posters: { x: 0.2, y: 0.5 },
  monitor: { x: 0, y: 0 },
  music: { x: -0.5, y: -0.1 },
  books: { x: 0.5, y: -0.1 },
};

Deno.test('an arrow goes to the object on that side, straight ahead before one off to the side', () => {
  assertEquals(neighbour('monitor', anchors, 'ArrowUp'), 'posters');
  assertEquals(neighbour('monitor', anchors, 'ArrowLeft'), 'music');
  assertEquals(neighbour('monitor', anchors, 'ArrowRight'), 'books');
  assertEquals(neighbour('music', anchors, 'ArrowUp'), 'window');
  assertEquals(neighbour('books', anchors, 'ArrowUp'), 'monitor');
});

Deno.test('where nothing lies that way, or the starting point is unknown, there is nowhere to go', () => {
  assertEquals(neighbour('window', anchors, 'ArrowLeft'), null);
  assertEquals(neighbour('missing', anchors, 'ArrowUp'), null);
  assertEquals(neighbour('monitor', { monitor: { x: 0, y: 0 } }, 'ArrowDown'), null);
});
