import { assertEquals } from '@std/assert';
import { missingFiles, requiredFiles, undeclaredCategories } from '../../../tools/content/consistency.ts';

Deno.test('requiredFiles asks for the site and category files and one about file per declared language', () => {
  assertEquals(requiredFiles(['pt', 'en']), [
    'site/site.yaml',
    'categories/categories.yaml',
    'about/about.pt.yaml',
    'about/about.en.yaml',
  ]);
});

Deno.test('missingFiles lists only what is absent', () => {
  assertEquals(missingFiles(['site/site.yaml', 'about/about.en.yaml'], new Set(['site/site.yaml'])), [
    'about/about.en.yaml',
  ]);
});

Deno.test('undeclaredCategories reports a post whose category the categories file does not name', () => {
  const posts = [
    { path: 'posts/a/index.pt.md', categories: ['notes'] },
    { path: 'posts/b/index.pt.md', categories: ['devops'] },
  ];
  assertEquals(undeclaredCategories(posts, new Set(['notes', 'academic'])), [
    'posts/b/index.pt.md: category "devops" is not in categories/categories.yaml',
  ]);
});
