import { expect, test } from '@playwright/test';

test('the home presents the author: the name as the heading, the photo, the role with the place, the three lines', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/en/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ígor José Rodrigues');
  await expect(page.locator('.hero__photo')).toHaveAttribute('aria-label', 'Fixture photo');
  await expect(page.locator('.hero__role')).toHaveText('Developer · Fixture city');
  await expect(page.locator('.hero__lines li')).toHaveText([
    'Fixture line one.',
    'Fixture line two.',
    'Fixture line three.',
  ]);
  await context.close();
});

test('the role line ends in the block cursor, one cell wide', async ({ page }) => {
  await page.goto('/en/');
  const { last, width, cell } = await page.evaluate(() => {
    const role = document.querySelector('.hero__role') as Element;
    const cursor = role.querySelector('.cursor') as Element;
    return {
      last: role.lastElementChild === cursor,
      width: cursor.getBoundingClientRect().width,
      cell: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-width')),
    };
  });
  expect(last).toBe(true);
  expect(Math.abs(width - cell)).toBeLessThan(0.5);
});

test('recent rows: the latest posts with their category, then the featured projects', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/en/');
  const rows = await page
    .locator('#recent .recent__row')
    .evaluateAll((links) =>
      links.map((link) => [
        link.querySelector('.recent__kind')?.textContent,
        link.querySelector('.recent__title')?.textContent,
      ]),
    );
  expect(rows).toEqual([
    ['Entertainment', 'Film fixture post'],
    ['Notes', 'Post só em português'],
    ['Professional', 'Second fixture post'],
    ['Project', 'Fixture project'],
  ]);
  await context.close();
});

test('a post written only in Portuguese is listed in English, links to its Portuguese page and says its language', async ({
  page,
}) => {
  await page.goto('/en/');
  const row = page.locator('#recent .recent__row', { hasText: 'Post só em português' });
  await expect(row).toHaveAttribute('href', /^\/pt\/posts\//);
  await expect(row).toHaveAttribute('lang', 'pt-BR');
  await row.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Post só em português');
});

test('the boxes are system, code, listening and watched, each titled on its border', async ({ page }) => {
  await page.goto('/en/');
  const boxes = await page
    .locator('.home__widgets > .panel')
    .evaluateAll((items) =>
      items.map((box) => [box.id, box.querySelector(':scope > .panel__title')?.textContent?.trim()]),
    );
  expect(boxes).toEqual([
    ['system', 'system'],
    ['code', 'code'],
    ['listening', 'listening'],
    ['watched', 'watched'],
  ]);
});

test('the listening box sums the week and scales each bar to the most played artist', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('#listening .panel__meta').first()).toHaveText('17 plays this week');
  const bars = await page.locator('#listening .bars__row').evaluateAll((rows) =>
    rows.map((row) => {
      const track = row.querySelector('.bars__track') as Element;
      const fill = row.querySelector('.bars__fill') as Element;
      return [
        row.querySelector('.bars__name')?.textContent?.trim(),
        Math.round((fill.getBoundingClientRect().width / track.getBoundingClientRect().width) * 100),
        row.querySelector('.bars__count')?.textContent,
      ];
    }),
  );
  expect(bars).toEqual([
    ['Fixture Artist', 100, '12 plays'],
    ['Second Artist', 42, '5 plays'],
  ]);
});

test('with scripts the name is drawn in characters, hidden from screen readers, and stays the heading', async ({
  page,
}) => {
  await page.goto('/en/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.hero__ascii')).toHaveAttribute('aria-hidden', 'true');
  await expect
    .poll(async () => (await page.locator('.hero__ascii').textContent())?.split('\n').length ?? 0)
    .toBeGreaterThan(4);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ígor José Rodrigues');
  await expect(page.getByRole('heading', { level: 1 })).toHaveClass(/sr-only/);
});

test('the photo reaches from the top of the name to the foot of the three lines', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en/');
  await page.evaluate(() => document.fonts.ready);
  const edges = await page.evaluate(() => {
    const photo = (document.querySelector('.hero__photo') as Element).getBoundingClientRect();
    const text = (document.querySelector('.hero__text') as Element).getBoundingClientRect();
    const lines = [...document.querySelectorAll('.hero__lines li')].at(-1)?.getBoundingClientRect();
    return { top: photo.top - text.top, bottom: photo.bottom - (lines?.bottom ?? 0) };
  });
  expect(Math.abs(edges.top)).toBeLessThan(2);
  expect(Math.abs(edges.bottom)).toBeLessThan(2);
});
