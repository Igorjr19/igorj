import { assertEquals } from '@std/assert';
import { containsExampleContent, isCheckedContentFile } from '../../../tools/content/example.ts';

Deno.test('containsExampleContent detects the front matter flag and the text marker', () => {
  assertEquals(containsExampleContent('---\nexample: true\n---\n'), true);
  assertEquals(containsExampleContent('Intro [EXAMPLE] text'), true);
});

Deno.test('containsExampleContent ignores real content and explicit example: false', () => {
  assertEquals(containsExampleContent('---\nexample: false\ntitle: Real\n---\n'), false);
});

Deno.test('isCheckedContentFile covers Markdown and YAML, not the repository README', () => {
  assertEquals(isCheckedContentFile('content/posts/a/index.pt.md'), true);
  assertEquals(isCheckedContentFile('content/cv/cv.en.yaml'), true);
  assertEquals(isCheckedContentFile('content/README.md'), false);
  assertEquals(isCheckedContentFile('content/posts/a/cover.png'), false);
});

Deno.test('containsExampleContent also detects the flag in JSON written by the daily data job', () => {
  assertEquals(containsExampleContent('{\n  "example": true,\n  "updated": "2026-10-10"\n}'), true);
  assertEquals(containsExampleContent('{\n  "example": false\n}'), false);
});
