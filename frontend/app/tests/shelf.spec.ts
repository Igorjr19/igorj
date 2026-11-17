import { expect, test } from '@playwright/test';

test('the shelf lists the most listened artists as bars, the films with year and stars, and what is being read', async ({
  page,
}) => {
  await page.goto('/en/shelf/');
  await expect(page.locator('.bars__row').first()).toBeVisible();
  const film = page.locator('.films__row').first();
  await expect(film.locator('.films__title')).toHaveText('Fixture Film');
  await expect(film.locator('.films__title a')).toHaveAttribute('href', 'https://example.com/film');
  await expect(film.locator('.films__year')).toHaveText('2020');
  await expect(film.locator('.stars')).toHaveCSS('--rating', '4.5');
  await expect(film.locator('.sr-only')).toHaveText('4.5 out of 5');
  const reading = page.locator('.films__row--reading');
  await expect(reading).toHaveCount(2);
  await expect(reading.nth(0).locator('.films__title')).toHaveText('Fixture book');
  await expect(reading.nth(1).locator('.films__title a')).toHaveAttribute('href', 'https://example.com/paper');
  await expect(reading.nth(1).locator('.films__authors')).toHaveText('First Author, Second Author');
});

test('the shelf draws no covers, posters or spines: lists, bars and stars only', async ({ page }) => {
  await page.goto('/en/shelf/');
  await expect(page.locator('.bars__row').first()).toBeVisible();
  await expect(page.locator('.shelf img')).toHaveCount(0);
});

test('the track playing now shows above the listening list, with its title and artist, and nothing when none is playing or the endpoint is not there', async ({
  page,
}) => {
  await page.route('**/api/now-playing', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        playing: true,
        title: 'A Song',
        artist: 'A Band',
        url: 'https://www.last.fm/music/A+Band/_/A+Song',
      }),
    }),
  );
  await page.goto('/en/shelf/');
  const now = page.locator('.now');
  await expect(now).toContainText('playing now');
  await expect(now.locator('.now__track a')).toHaveText('A Song');
  await expect(now.locator('.now__artist')).toHaveText('A Band');
});

test('with no track playing, or no endpoint, the shelf shows no "playing now" line at all', async ({ page }) => {
  await page.route('**/api/now-playing', (route) =>
    route.fulfill({ contentType: 'application/json', body: '{"playing":false}' }),
  );
  await page.goto('/en/shelf/');
  await expect(page.locator('.bars__row').first()).toBeVisible();
  await expect(page.locator('.now')).toHaveCount(0);
  await page.unroute('**/api/now-playing');
  await page.route('**/api/now-playing', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{"playing":false}' }),
  );
  await page.reload();
  await expect(page.locator('.bars__row').first()).toBeVisible();
  await expect(page.locator('.now')).toHaveCount(0);
});

test('a playing answer that lacks a title or an artist is not shown, so a broken endpoint never prints half a line', async ({
  page,
}) => {
  await page.route('**/api/now-playing', (route) =>
    route.fulfill({ contentType: 'application/json', body: '{"playing":true,"title":"Only a title"}' }),
  );
  await page.goto('/en/shelf/');
  await expect(page.locator('.bars__row').first()).toBeVisible();
  await expect(page.locator('.now')).toHaveCount(0);
});
