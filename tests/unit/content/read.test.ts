import { assertEquals, assertThrows } from '@std/assert';
import { readContent } from '../../../tools/content/read.ts';

const SITE = { path: 'site/site.yaml', text: 'author: Someone\nlanguages: [pt, en]\n' };
const CATEGORIES = {
  path: 'categories/categories.yaml',
  text: 'categories:\n  - slug: notes\n    name: { pt: Notas, en: Notes }\n',
};
const POST = {
  path: 'posts/hello/index.en.md',
  text: '---\ntitle: Hello\nsummary: One.\ndate: 2026-01-01\ncategories: [notes]\n---\n\nBody with ![image](figure.png).\n',
};

Deno.test('readContent keeps each item with its folder, language, body and the files beside it', () => {
  const paths = ['site/site.yaml', 'categories/categories.yaml', 'posts/hello/index.en.md', 'posts/hello/figure.png'];
  const content = readContent([SITE, CATEGORIES, POST], paths);
  const [hello] = content.posts;
  assertEquals([hello?.folder, hello?.language, hello?.data.title], ['hello', 'en', 'Hello']);
  assertEquals(hello?.body, '\nBody with ![image](figure.png).\n');
  assertEquals(hello?.media, ['posts/hello/figure.png']);
});

Deno.test('readContent finds the photo and leaves missing optional files as null', () => {
  const content = readContent([SITE, CATEGORIES], ['about/photo.jpg']);
  assertEquals([content.photo, content.contact, content.music], ['about/photo.jpg', null, null]);
});

Deno.test('readContent refuses content without the site file, which the content check would also refuse', () => {
  assertThrows(() => readContent([CATEGORIES], []), Error, 'site/site.yaml');
});
