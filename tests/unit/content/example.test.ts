import { assertEquals } from '@std/assert';
import { containsExampleContent, isCheckedContentFile } from '../../../tools/content/example.ts';

Deno.test('containsExampleContent detects the front matter flag and the text marker', () => {
  assertEquals(containsExampleContent('---\nexample: true\n---\n'), true);
  assertEquals(containsExampleContent('Intro [EXAMPLE] text'), true);
});

Deno.test('containsExampleContent ignores real content and explicit example: false', () => {
  assertEquals(containsExampleContent('---\nexample: false\ntitle: Real\n---\n'), false);
});

Deno.test('isCheckedContentFile reads Markdown, YAML and JSON inside the content folders only', () => {
  assertEquals(isCheckedContentFile('posts/a/index.pt.md'), true);
  assertEquals(isCheckedContentFile('cv/cv.en.yaml'), true);
  assertEquals(isCheckedContentFile('external/music.json'), true);
  assertEquals(isCheckedContentFile('posts/a/cover.png'), false);
});

Deno.test('isCheckedContentFile skips what sits beside the content, so tooling in the content repository is not read as content', () => {
  for (const path of ['README.md', 'deno.json', 'biome.json', '.github/workflows/check.yml', 'tools/data.json']) {
    assertEquals(isCheckedContentFile(path), false, path);
  }
});

Deno.test('containsExampleContent also detects the flag in JSON written by the daily data job', () => {
  assertEquals(containsExampleContent('{\n  "example": true,\n  "updated": "2026-10-10"\n}'), true);
  assertEquals(containsExampleContent('{\n  "example": false\n}'), false);
});
