import { assertEquals } from '@std/assert';
import { extractFrontMatter } from '../../../tools/content/front-matter.ts';

Deno.test('extractFrontMatter returns the YAML between the dashes, without the body', () => {
  assertEquals(extractFrontMatter('---\ntitle: A\ndate: 2026-01-01\n---\n\nBody\n---\n'), 'title: A\ndate: 2026-01-01');
});

Deno.test('extractFrontMatter accepts Windows line endings, since content may be edited anywhere', () => {
  assertEquals(extractFrontMatter('---\r\ntitle: A\r\n---\r\nBody'), 'title: A');
});

Deno.test('extractFrontMatter returns null when the file does not open with front matter', () => {
  assertEquals(extractFrontMatter('Body\n---\ntitle: A\n---\n'), null);
  assertEquals(extractFrontMatter('---\ntitle: A\n'), null);
});
