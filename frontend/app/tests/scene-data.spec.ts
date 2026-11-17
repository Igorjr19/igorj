import { expect, test } from '@playwright/test';

test('the room reads what it shows from one small file per language, with the album, the posters and the books', async ({
  request,
}) => {
  const response = await request.get('/en/scene.json');
  expect(response.ok()).toBe(true);
  const input = await response.json();
  expect(input.music.artists.length).toBeGreaterThan(0);
  expect(input.music.album).toEqual({
    title: 'Fixture Album',
    artist: 'Fixture Artist',
    cover: expect.stringMatching(/^https:\/\/lastfm-img\.freetls\.fastly\.net\//),
  });
  expect(input.films[0]).toEqual({
    title: 'Fixture Film',
    year: 2020,
    rating: 4.5,
    poster: expect.stringMatching(/^https:\/\/a\.ltrbxd\.com\//),
  });
  expect(input.books.map((book: { title: string }) => book.title)).toContain('Fixture book');
});

test('no page carries the data of the room, so the plain site does not pay for it', async ({ page }) => {
  await page.goto('/en/shelf/');
  const html = await page.content();
  expect(html).not.toContain('scene.json');
});
