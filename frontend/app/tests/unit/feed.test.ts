import { assertEquals, assertStringIncludes } from '@std/assert';
import { renderFeed, rfc822 } from '../../src/lib/feed.ts';
import { renderSitemap } from '../../src/lib/sitemap.ts';

const feed = {
  title: 'Author & Co',
  link: 'https://example.org/en/',
  self: 'https://example.org/en/index.xml',
  description: 'Posts',
  locale: 'en',
  items: [
    {
      title: 'Old',
      link: 'https://example.org/en/posts/old/',
      date: '2026-01-02',
      summary: 'a < b',
      categories: ['Notes'],
    },
    { title: 'New', link: 'https://example.org/en/posts/new/', date: '2026-03-04', summary: 'fresh', categories: [] },
  ],
};

Deno.test('a day becomes an RFC 822 date at midnight UTC', () => {
  assertEquals(rfc822('2026-03-04'), 'Wed, 04 Mar 2026 00:00:00 +0000');
});

Deno.test('the feed lists the newest post first and dates the channel by it', () => {
  const xml = renderFeed(feed);
  assertEquals(xml.indexOf('<title>New</title>') < xml.indexOf('<title>Old</title>'), true);
  assertStringIncludes(xml, '<lastBuildDate>Wed, 04 Mar 2026 00:00:00 +0000</lastBuildDate>');
});

Deno.test('text in a feed is escaped, so a title or summary cannot break the XML', () => {
  const xml = renderFeed(feed);
  assertStringIncludes(xml, '<title>Author &amp; Co</title>');
  assertStringIncludes(xml, '<description>a &lt; b</description>');
});

Deno.test('a feed with no posts still has a channel, and no build date', () => {
  const xml = renderFeed({ ...feed, items: [] });
  assertStringIncludes(xml, '<channel>');
  assertEquals(xml.includes('lastBuildDate'), false);
});

Deno.test('the sitemap pairs each page with its translations', () => {
  const xml = renderSitemap([
    {
      loc: 'https://example.org/en/',
      alternates: { en: 'https://example.org/en/', 'pt-BR': 'https://example.org/pt/' },
    },
  ]);
  assertStringIncludes(xml, '<xhtml:link rel="alternate" hreflang="pt-BR" href="https://example.org/pt/" />');
});
