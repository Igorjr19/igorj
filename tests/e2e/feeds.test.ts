/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { HOME_EN, POST_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

function itemTitles(xml: string): string[] {
  return [...xml.matchAll(/<item><title>(.*?)<\/title>/g)].map((match) => match[1] ?? '');
}

Deno.test('feeds carry posts only, for the whole blog and for each category', async (t) => {
  await using session = await Session.start();

  const fetchText = async (path: string) => {
    const response = await fetch(`${session.url}${path}`);
    const text = await response.text();
    return { status: response.status, text };
  };

  await t.step('the home feed lists the posts and leaves the projects out', async () => {
    const feed = await fetchText('/en/index.xml');
    assertEquals(feed.status, 200);
    assert(itemTitles(feed.text).includes('Fixture post'));
    assert(!itemTitles(feed.text).includes('Fixture project'));
  });

  await t.step('each language has its own feed', async () => {
    const feed = await fetchText('/pt/index.xml');
    assertEquals(itemTitles(feed.text).includes('Post de teste'), true);
    assert(feed.text.includes('<language>pt-BR</language>'));
  });

  await t.step('a category feed holds the posts of that category with its name in the title', async () => {
    const feed = await fetchText('/en/categories/testing/index.xml');
    assertEquals(feed.status, 200);
    assertEquals(itemTitles(feed.text), ['Fixture post']);
    assert(feed.text.includes('<title>Ígor José Rodrigues — Testing</title>'));
  });

  await t.step('lists and sections publish no feed of their own', async () => {
    assertEquals((await fetchText('/en/projects/index.xml')).status, 404);
    assertEquals((await fetchText('/en/posts/index.xml')).status, 404);
  });

  await t.step('pages announce the feeds to readers and browsers', async () => {
    const links = () =>
      [...document.querySelectorAll('link[type="application/rss+xml"]')].map((link) => link.getAttribute('href'));
    const home = await session.open(HOME_EN, { javascript: false });
    assertEquals(await home.evaluate(links), ['https://igorj.dev/en/index.xml']);
    const post = await session.open(POST_EN, { javascript: false });
    assertEquals(await post.evaluate(links), ['https://igorj.dev/en/index.xml']);
    const category = await session.open('/en/categories/testing/', { javascript: false });
    assertEquals(await category.evaluate(links), [
      'https://igorj.dev/en/index.xml',
      'https://igorj.dev/en/categories/testing/index.xml',
    ]);
  });
});
