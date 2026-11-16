import { assertEquals } from '@std/assert';
import { bootLines } from '../../../src/lib/lab/boot.ts';

const system = {
  commit: '78d88501bb7296b01a3df6dc47816e9940a679d3',
  built: '2026-11-16',
  counts: { posts: 2, projects: 3, research: null },
  sources: ['Last.fm'],
  updated: null,
};

Deno.test('the boot lines state the build facts, the commit short, and leave out a section the site does not have', () => {
  const lines = bootLines(system);
  assertEquals(lines[1], 'build 78d8850 2026-11-16');
  assertEquals(lines[2], 'content 2 posts · 3 projects');
  assertEquals(lines[3], 'data Last.fm');
});

Deno.test('a build without a commit says it is local, and without sources the data line is dropped', () => {
  const lines = bootLines({ ...system, commit: null, sources: [] });
  assertEquals(lines[1], 'build local 2026-11-16');
  assertEquals(
    lines.some((line) => line.startsWith('data')),
    false,
  );
});
