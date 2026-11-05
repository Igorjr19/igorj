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

function readSharing() {
  const content = (selector: string) => document.querySelector(selector)?.getAttribute('content') ?? null;
  const structured = document.querySelector('script[type="application/ld+json"]')?.textContent;
  return {
    description: content('meta[name=description]'),
    og: {
      title: content('meta[property="og:title"]'),
      description: content('meta[property="og:description"]'),
      type: content('meta[property="og:type"]'),
      url: content('meta[property="og:url"]'),
      locale: content('meta[property="og:locale"]'),
      alternates: [...document.querySelectorAll('meta[property="og:locale:alternate"]')].map((meta) =>
        meta.getAttribute('content'),
      ),
    },
    published: content('meta[property="article:published_time"]'),
    structured: structured ? JSON.parse(structured) : null,
  };
}

Deno.test('pages describe themselves for link previews and search results', async (t) => {
  await using session = await Session.start();

  await t.step('the home uses the about text and tells search engines who the person is', async () => {
    const page = await session.open(HOME_EN, { javascript: false });
    const sharing = await page.evaluate(readSharing);
    assertEquals(sharing.description, 'Fixture line one. Fixture line two. Fixture line three.');
    assertEquals(sharing.og, {
      title: 'Ígor José Rodrigues — Developer',
      description: sharing.description,
      type: 'website',
      url: 'https://igorj.dev/en/',
      locale: 'en',
      alternates: ['pt_BR'],
    });
    assertEquals(sharing.structured, {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Ígor José Rodrigues',
      jobTitle: 'Developer',
      url: 'https://igorj.dev/en/',
      sameAs: ['https://github.com/example'],
    });
  });

  await t.step('a post is an article described by its summary, without person data', async () => {
    const page = await session.open(POST_EN, { javascript: false });
    const sharing = await page.evaluate(readSharing);
    assertEquals(sharing.description, 'A post used by the end-to-end tests.');
    assertEquals(sharing.og.type, 'article');
    assertEquals(sharing.og.title, 'Fixture post');
    assertEquals(sharing.published, '2026-01-01');
    assertEquals(sharing.structured, null);
  });

  await t.step('the Portuguese home names its own locale and points to the other', async () => {
    const page = await session.open(HOME_PT, { javascript: false });
    const { og } = await page.evaluate(readSharing);
    assertEquals([og.locale, og.alternates], ['pt_BR', ['en']]);
  });
});
