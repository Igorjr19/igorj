import { expect, test } from '@playwright/test';

/** These run against the professional edition of the fixtures, served on its own address. */

test('search engines are asked to leave the edition alone, and are given no map of it', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /');
  expect(robots).not.toContain('Sitemap');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain('<loc>');
});

test("every page says it is not to be listed, and its address is the edition's own", async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pro.igorj.dev/en/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/pro\.igorj\.dev\//);
  await page.goto('/en/posts/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('the home shows the boxes of the edition, and not those it leaves out', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('#recent')).toBeVisible();
  await expect(page.locator('#system')).toBeVisible();
  await expect(page.locator('#code')).toBeVisible();
  await expect(page.locator('#listening')).toHaveCount(0);
  await expect(page.locator('#watched')).toHaveCount(0);
});

test('there is no shelf, and no personal network of the contact', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('.side__panes a[href$="/shelf/"]')).toHaveCount(0);
  await expect(page.locator('.side__block a[href*="last.fm"]')).toHaveCount(0);
  await expect(page.locator('.side__block a[href*="github.com"]')).toHaveCount(1);
  expect((await page.request.get('/en/shelf/')).status()).toBe(404);
});

test('the about text is the one made for the edition, and the lists carry only what it carries', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('.side__who')).toContainText('Professional developer');
  await page.goto('/en/posts/');
  await expect(page.getByRole('link', { name: 'Film fixture post' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Second fixture post' })).toBeVisible();
  await page.goto('/en/projects/');
  await expect(page.getByRole('link', { name: 'Second fixture project' })).toHaveCount(0);
});

test('no page points at the complete site', async ({ page }) => {
  for (const path of ['/en/', '/en/posts/', '/en/cv/', '/en/credits/']) {
    await page.goto(path);
    await expect(page.locator('a[href^="https://igorj.dev"], a[href^="http://igorj.dev"]')).toHaveCount(0);
  }
});
