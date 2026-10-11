/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { HOME_EN, HOME_PT, POST_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

Deno.test('pages expose the metadata search engines and scrapers rely on', async (t) => {
  await using session = await Session.start();

  for (const [path, lang] of [
    [HOME_EN, 'en'],
    [HOME_PT, 'pt-BR'],
    [POST_EN, 'en'],
  ] as const) {
    await t.step(path, async () => {
      const page = await session.open(path, { javascript: false });
      const meta = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        title: document.title.trim(),
        canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') ?? '',
        alternates: [...document.querySelectorAll('link[rel=alternate][hreflang]')].map((link) =>
          link.getAttribute('hreflang'),
        ),
      }));
      assertEquals(meta.lang, lang);
      assert(meta.title.length > 0, 'empty <title>');
      assert(meta.canonical.endsWith(path), `canonical ${meta.canonical} does not point to ${path}`);
      assertEquals(meta.alternates.sort(), ['en', 'pt-BR']);
    });
  }
});
