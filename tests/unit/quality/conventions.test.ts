import { assertEquals } from '@std/assert';
import { findConventionViolations, shouldCheck } from '../../../tools/quality/conventions.ts';

const rules = (text: string) => findConventionViolations('file.ts', text).map((violation) => violation.rule);

Deno.test('findConventionViolations flags decision ids and planning docs, which readers of the repo cannot see', () => {
  assertEquals(rules('// See D22 for the cell grid.'), ['decision reference']);
  assertEquals(rules('// Replaces H-D43.'), ['decision reference']);
  assertEquals(rules('// Details in docs/03-visual.md'), ['planning docs reference']);
});

Deno.test('findConventionViolations ignores hex colors, identifiers and other paths that look similar', () => {
  assertEquals(rules("const red = '#D20F39';"), []);
  assertEquals(rules('const ID22 = 1; const html5D20 = 2;'), []);
  assertEquals(rules("import x from './my-docs/a.ts';"), []);
});

Deno.test('findConventionViolations reports the line number', () => {
  assertEquals(findConventionViolations('a.ts', 'ok\n// D10\n')[0]?.line, 2);
});

Deno.test('shouldCheck skips the lockfile, the license and binary assets', () => {
  assertEquals(['deno.lock', 'LICENSE', 'a/b.png', 'tools/a.ts'].map(shouldCheck), [false, false, false, true]);
});
