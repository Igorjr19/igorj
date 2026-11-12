import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { renderMarkdown, slugify } from '../../src/lib/markdown/render.ts';

const context = {
  mediaBase: 'posts/a-post',
  figures: {
    'posts/a-post/wide.png': {
      src: '/img/figure/posts/a-post/wide.png',
      inverted: '/img/figure/posts/a-post/wide.inverted.png',
      width: 800,
      height: 400,
    },
  },
  copyLabel: 'copy',
};

Deno.test('headings get an address from their text and are listed with their level', () => {
  const { html, headings } = renderMarkdown('## Primeira seção\n\ntext\n\n### Sub item', context);
  assertStringIncludes(html, '<h2 id="primeira-secao">');
  assertEquals(headings, [
    { id: 'primeira-secao', text: 'Primeira seção', level: 2 },
    { id: 'sub-item', text: 'Sub item', level: 3 },
  ]);
});

Deno.test('an image of the item becomes a dithered figure that keeps its description for screen readers', () => {
  const { html } = renderMarkdown('![A wide chart](wide.png)', context);
  assertStringIncludes(html, 'role="img" aria-label="A wide chart"');
  assertStringIncludes(html, "--dither: url('/img/figure/posts/a-post/wide.png')");
});

Deno.test('an image that was not dithered, or lives elsewhere, stays an ordinary image', () => {
  assertStringIncludes(
    renderMarkdown('![x](https://example.org/a.svg)', context).html,
    '<img src="https://example.org/a.svg" alt="x">',
  );
  assertStringIncludes(renderMarkdown('![x](diagram.svg)', context).html, '<img src="diagram.svg" alt="x">');
});

Deno.test('a code block is highlighted with classes and comes with its copy button', () => {
  const { html } = renderMarkdown('```go\nfunc main() {}\n```', context);
  assertStringIncludes(html, '<span class="hljs-keyword">func</span>');
  assertStringIncludes(html, 'class="code-block__copy" data-copy>copy</button>');
});

Deno.test('code in a language nobody knows is shown as written, escaped', () => {
  const { html } = renderMarkdown('```zzz\n<b>&\n```', context);
  assertStringIncludes(html, '&lt;b&gt;&amp;');
});

Deno.test('raw HTML in the text is shown as text, so a post cannot bring markup of its own', () => {
  assert(!renderMarkdown('<script>alert(1)</script>', context).html.includes('<script>'));
});

Deno.test('slugs drop accents and punctuation', () => {
  assertEquals(slugify('Pare de se PRÉ-ocupar!'), 'pare-de-se-pre-ocupar');
});
