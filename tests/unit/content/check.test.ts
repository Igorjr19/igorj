import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { checkContentFile } from '../../../tools/content/check.ts';

const CV = `
basics:
  name: Someone
  label: Developer
  summary: Short summary.
  email: someone@example.com
  url: https://example.com
  location: Somewhere
  profiles:
    - network: GitHub
      url: https://github.com/example
work:
  - name: A company
    position: Developer
    startDate: 2024-02
education:
  - institution: A university
    studyType: Bachelor
    area: Computer Science
skills:
  - name: Backend
    keywords: [Go]
languages:
  - language: English
    fluency: Fluent
`;

Deno.test('checkContentFile reads unquoted YAML dates in front matter as valid dates', () => {
  const post = '---\ntitle: A\nsummary: B\ndate: 2026-10-05\ncategories: [notes]\n---\n\nBody\n';
  assertEquals(checkContentFile('posts/a/index.pt.md', post), null);
});

Deno.test('checkContentFile validates YAML data files as a whole, using JSON Resume keys for the CV', () => {
  assertEquals(checkContentFile('cv/cv.pt.yaml', CV), null);
  const problem = checkContentFile('cv/cv.pt.yaml', CV.replace('basics:', 'basico:'));
  assert(problem !== null);
  assertStringIncludes(problem, '"basico"');
});

Deno.test('checkContentFile reports a Markdown file without front matter instead of skipping it', () => {
  assertStringIncludes(checkContentFile('posts/a/index.pt.md', 'Just a body\n') ?? '', 'Missing front matter');
});

Deno.test('checkContentFile reports broken YAML with the parser message', () => {
  assertStringIncludes(checkContentFile('contact/contact.yaml', 'email: [unclosed\n') ?? '', 'Invalid YAML');
});

Deno.test('checkContentFile reports files outside the known structure, so they do not go unvalidated', () => {
  assertStringIncludes(checkContentFile('notes/today.md', '---\ntitle: A\n---\n') ?? '', 'No content type');
});
