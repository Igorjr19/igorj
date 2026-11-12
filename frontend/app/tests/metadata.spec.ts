import { expect, test } from '@playwright/test';

test('the home tells search engines and link previews who it is: canonical, languages, picture and the person', async ({
  page,
}) => {
  await page.goto('/en/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://igorj.dev/en/');
  const alternates = await page
    .locator('link[rel="alternate"][hreflang]')
    .evaluateAll((links) => links.map((link) => [link.getAttribute('hreflang'), link.getAttribute('href')]));
  expect(alternates).toEqual([
    ['pt-BR', 'https://igorj.dev/pt/'],
    ['en', 'https://igorj.dev/en/'],
  ]);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://igorj.dev/share/en/default.jpg',
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Fixture/);
  const person = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect([person['@type'], person.name]).toEqual(['Person', 'Ígor José Rodrigues']);
});

test('a post is an article with its own picture, date and translation', async ({ page }) => {
  await page.goto('/en/posts/fixture-post/');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://igorj.dev/share/en/posts/fixture-post.jpg',
  );
  await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
    'content',
    /^\d{4}-\d{2}-\d{2}$/,
  );
  await expect(page.locator('.win__languages a')).toHaveAttribute('href', '/pt/posts/fixture-post/');
});

test('a post that exists in one language only has no translation to switch to, so the switch leads to the home', async ({
  page,
}) => {
  await page.goto('/pt/posts/pt-only-post/');
  await expect(page.locator('.win__languages a')).toHaveAttribute('href', '/en/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0);
});

test('the favicons follow the browser theme and the share pictures exist', async ({ page, request }) => {
  await page.goto('/en/');
  await expect(page.locator('link[rel="icon"][media="(prefers-color-scheme: dark)"]')).toHaveAttribute(
    'href',
    /\/icons\/favicon-light\.png$/,
  );
  expect((await request.get('/share/en/default.jpg')).ok()).toBe(true);
  expect((await request.get('/icons/favicon-180.png')).ok()).toBe(true);
});

test('the feeds list posts newest first, escaped, for the home, a category and a tag', async ({ request }) => {
  const home = await (await request.get('/en/index.xml')).text();
  expect(home).toContain('<rss version="2.0"');
  expect(home.indexOf('Film fixture post')).toBeGreaterThan(-1);
  const category = await (await request.get('/en/categories/notes/index.xml')).text();
  expect(category).toContain('<title>Ígor José Rodrigues — Notes</title>');
  expect(category).not.toContain('Film fixture post');
  expect((await request.get('/en/tags/hugo/index.xml')).ok()).toBe(true);
});

test('the sitemap pairs the translations and robots.txt points to it', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('<loc>https://igorj.dev/en/posts/fixture-post/</loc>');
  expect(sitemap).toContain('hreflang="pt-BR" href="https://igorj.dev/pt/posts/fixture-post/"');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://igorj.dev/sitemap.xml');
});
