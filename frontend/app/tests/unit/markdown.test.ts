import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import type { RenderContext } from '../../src/lib/markdown/render.ts';
import { renderMarkdown, slugify } from '../../src/lib/markdown/render.ts';

const context: RenderContext = {
  mediaBase: 'posts/a-post',
  figures: {
    'posts/a-post/wide.png': {
      src: '/img/figure/posts/a-post/wide.png',
      inverted: '/img/figure/posts/a-post/wide.inverted.png',
      width: 800,
      height: 400,
    },
  },
  colorFigures: {
    'posts/a-post/chart.png': {
      width: 480,
      height: 270,
      layers: [
        { role: 'error', src: '/img/color/chart.error.a.png', inverted: '/img/color/chart.error.inverted.a.png' },
        { role: 'link', src: '/img/color/chart.link.b.png', inverted: '/img/color/chart.link.inverted.b.png' },
      ],
    },
  },
  copyLabel: 'copy',
  openLabel: 'open the original',
};

Deno.test('headings get an address from their text and are listed with their level', () => {
  const { html, headings } = renderMarkdown('## Primeira seção\n\ntext\n\n### Sub item', context);
  assertStringIncludes(html, '<h2 id="primeira-secao">');
  assertEquals(headings, [
    { id: 'primeira-secao', text: 'Primeira seção', level: 2 },
    { id: 'sub-item', text: 'Sub item', level: 3 },
  ]);
});

Deno.test('an image of the item becomes a button that opens its original, holding a dithered figure and describing it for screen readers', () => {
  const { html } = renderMarkdown('![A wide chart](wide.png)', context);
  assertStringIncludes(html, '<button type="button" class="figure" data-original="/media/posts/a-post/wide.png"');
  assertStringIncludes(html, 'aria-label="A wide chart (open the original)"');
  assertStringIncludes(html, "--dither: url('/img/figure/posts/a-post/wide.png')");
});

Deno.test('a picture asked for in color has a pair of layers for each role, each inked with the color of that role', () => {
  const { html } = renderMarkdown('![Five colors](chart.png#color)', context);
  assertStringIncludes(html, "--dither: url('/img/color/chart.error.a.png'); --dither-ink: var(--color-error)");
  assertStringIncludes(
    html,
    "--dither-inverted: url('/img/color/chart.link.inverted.b.png'); --dither-ink: var(--color-link)",
  );
  assert(!html.includes('#color'));
  assertStringIncludes(html, 'data-original="/media/posts/a-post/chart.png"');
});

Deno.test('the color mark on a picture the build did not color leaves the ordinary dithered figure', () => {
  const { html } = renderMarkdown('![A wide chart](wide.png#color)', context);
  assertStringIncludes(html, "--dither: url('/img/figure/posts/a-post/wide.png')");
  assert(!html.includes('--dither-ink'));
});

Deno.test('a picture that was not dithered is the original itself, served from /media/, and one of another site is left alone', () => {
  assertStringIncludes(
    renderMarkdown('![x](diagram.svg)', context).html,
    '<img src="/media/posts/a-post/diagram.svg" alt="" loading="lazy">',
  );
  assertStringIncludes(
    renderMarkdown('![x](https://example.org/a.svg)', context).html,
    '<img src="https://example.org/a.svg" alt="x">',
  );
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

Deno.test('a picture larger than the screen opens its smaller copy and keeps the way to the original, so it loads quickly', () => {
  const { html } = renderMarkdown('![A wide chart](wide.png)', {
    ...context,
    webCopies: { 'posts/a-post/wide.png': '/img/web/posts/a-post/wide.abc.png' },
  });
  assertStringIncludes(html, 'data-original="/img/web/posts/a-post/wide.abc.png"');
  assertStringIncludes(html, 'data-full="/media/posts/a-post/wide.png"');
});

Deno.test('a picture with no smaller copy opens its original and names no other', () => {
  const { html } = renderMarkdown('![A wide chart](wide.png)', context);
  assertStringIncludes(html, 'data-original="/media/posts/a-post/wide.png"');
  assert(!html.includes('data-full'));
});
