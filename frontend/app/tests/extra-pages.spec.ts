import { expect, test } from '@playwright/test';

test('the shelf shows the week of music, the films watched with their ratings and what is being read', async ({
  page,
}) => {
  await page.goto('/en/shelf/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shelf');
  await expect(page.locator('#music-title')).toHaveText('Listening');
  await expect(page.locator('#music-title ~ .panel__meta').first()).toContainText('17 plays this week');
  await expect(page.locator('#films-title')).toHaveText('Watched');
  await expect(page.locator('#films-title ~ .films .films__row').first()).toBeVisible();
  await expect(page.locator('#reading-title')).toHaveText('Reading');
});

test('the credits name the author, the third-party material and the services the data comes from', async ({ page }) => {
  await page.goto('/en/credits/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Credits');
  await expect(page.locator('.zoom__body > p').first()).toContainText('all rights reserved');
  await expect(page.locator('.zoom__body > p a').first()).toHaveAttribute('href', /github\.com/);
  await expect(page.locator('.credits--material dt').first()).toBeVisible();
  await expect(page.locator('.credits--data dt')).not.toHaveCount(0);
  await expect(page.locator('a[href="/third-party-licenses.txt"]')).toBeVisible();
});

test('a page that does not exist says so, as a command not found, and leads to both languages', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.getByText('command not found')).toBeVisible();
  await expect(page.locator('.not-found a')).toHaveText(['~ pt-br', '~ en-us']);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});
