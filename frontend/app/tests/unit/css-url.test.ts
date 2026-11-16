import { assertEquals } from '@std/assert';
import { cssUrl } from '../../src/lib/css-url.ts';

Deno.test('an inlined SVG with single quotes of its own stays one url(), which the old quoting broke', () => {
  const svg = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'%3e%3c/svg%3e";
  assertEquals(cssUrl(svg), `url("${svg}")`);
});

Deno.test('a plain path becomes a quoted url()', () => {
  assertEquals(cssUrl('/img/a.png'), 'url("/img/a.png")');
});
