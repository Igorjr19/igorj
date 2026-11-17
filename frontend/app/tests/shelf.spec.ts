import { expect, type Page, test } from '@playwright/test';

/** A small PNG, standing in for a cover or a poster, so no test depends on the services that serve them. It is big enough to keep a width after a dense screen halves it. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAYCAIAAAB8wupbAAAAHUlEQVR4nGOsqFjAQApgIkn1qIZRDaMaRjWQrAEAnXkBwGVeWIoAAAAASUVORK5CYII=',
  'base64',
);
const SERVICES = ['**/lastfm-img.freetls.fastly.net/**', '**/a.ltrbxd.com/**'];

async function servePictures(page: Page): Promise<void> {
  for (const pattern of SERVICES) {
    await page.route(pattern, (route) => route.fulfill({ contentType: 'image/png', body: PIXEL }));
  }
}

async function failPictures(page: Page): Promise<void> {
  for (const pattern of SERVICES) {
    await page.route(pattern, (route) => route.abort());
  }
}

test('the album of the week turns as a record with its cover on the label, and says what it is', async ({ page }) => {
  await servePictures(page);
  await page.goto('/en/shelf/');
  const record = page.locator('.record');
  await expect(record.locator('.record__title')).toContainText('Fixture Album');
  await expect(record.locator('.record__artist')).toHaveText('Fixture Artist');
  await expect(record.locator('.record__title a')).toHaveAttribute('href', 'https://example.com/album');
  const cover = record.locator('.record__cover');
  await expect.poll(() => cover.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
  await expect(cover).toHaveAttribute('referrerpolicy', 'no-referrer');
  expect(await record.locator('.record__disc').evaluate((node) => getComputedStyle(node).animationName)).toBe(
    'record-spin',
  );
});

test('a poster shows over a card with the title, and carries the year and the rating on its stub', async ({ page }) => {
  await servePictures(page);
  await page.goto('/en/shelf/');
  const poster = page.locator('.poster').first();
  await expect(poster.locator('.poster__title')).toHaveText('Fixture Film');
  // The pictures load when they come into view, which is below the fold in some browsers.
  await poster.scrollIntoViewIfNeeded();
  const image = poster.locator('.poster__image');
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
  await expect(image).toHaveAttribute('src', /-0-230-0-345-crop/);
  await expect(image).toHaveAttribute('srcset', /460w/);
  await expect(poster.locator('.poster__stub')).toContainText('2020');
  await expect(poster.locator('.poster__stub .sr-only')).toContainText('4.5');
  await expect(poster.locator('a.poster__art')).toHaveAttribute('href', 'https://example.com/film');
});

test('when the services cannot be reached the picture goes and the card with the title stays, and a film with no poster has only the card', async ({
  page,
}) => {
  await failPictures(page);
  await page.goto('/en/shelf/');
  await expect(page.locator('.poster__image').first()).toBeHidden();
  await expect(page.locator('.poster').first().locator('.poster__title')).toBeVisible();
  await expect(page.locator('.record__cover')).toBeHidden();
  await expect(page.locator('.record__label')).toHaveAttribute('data-initial', 'F');
  const second = page.locator('.poster').nth(1);
  await expect(second.locator('.poster__image')).toHaveCount(0);
  await expect(second.locator('.poster__title')).toHaveText('Unrated Film');
});

test('the reading list stands as spines, each in a color role of the theme, with the author readable and a link where there is one', async ({
  page,
}) => {
  await page.goto('/en/shelf/');
  const spines = page.locator('.spine');
  await expect(spines).toHaveCount(2);
  const inks = await spines.evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLElement).style.getPropertyValue('--spine-ink')),
  );
  expect(inks.every((ink) => /^var\(--color-(accent|link|success|warning|error|text)\)$/.test(ink))).toBe(true);
  await expect(spines.nth(1).locator('a.spine__body')).toHaveAttribute('href', 'https://example.com/paper');
  await expect(spines.nth(1).locator('.sr-only')).toContainText('First Author, Second Author');
  await expect(spines.nth(0).locator('.spine__title')).toHaveText('Fixture book');
});

test('the track playing now shows above the record, with its title and artist, and nothing when none is playing or the endpoint is not there', async ({
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
  await expect(page.locator('.record')).toBeVisible();
  await expect(page.locator('.now')).toHaveCount(0);
  await page.unroute('**/api/now-playing');
  await page.route('**/api/now-playing', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{"playing":false}' }),
  );
  await page.reload();
  await expect(page.locator('.record')).toBeVisible();
  await expect(page.locator('.now')).toHaveCount(0);
});

test('a playing answer that lacks a title or an artist is not shown, so a broken endpoint never prints half a line', async ({
  page,
}) => {
  await page.route('**/api/now-playing', (route) =>
    route.fulfill({ contentType: 'application/json', body: '{"playing":true,"title":"Only a title"}' }),
  );
  await page.goto('/en/shelf/');
  await expect(page.locator('.record')).toBeVisible();
  await expect(page.locator('.now')).toHaveCount(0);
});
