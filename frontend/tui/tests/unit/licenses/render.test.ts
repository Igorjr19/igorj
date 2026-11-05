import { assert, assertStringIncludes } from '@std/assert';
import { renderNotices } from '../../../tools/licenses/render.ts';

Deno.test('renderNotices includes every name, license, homepage and full text in order', () => {
  const text = renderNotices([
    { name: 'A', license: 'MIT', homepage: 'https://a.example', text: 'Copyright A\n' },
    { name: 'B', license: 'OFL-1.1', homepage: 'https://b.example', text: 'Copyright B' },
  ]);
  assertStringIncludes(text, 'A (MIT)\nhttps://a.example\n\nCopyright A');
  assert(text.indexOf('A (MIT)') < text.indexOf('B (OFL-1.1)'));
});
