import { expect, test } from '@playwright/test';
import { visit } from './support.ts';

// The reason for the move to a client-side app: opening a pane used to take 400 to 630 ms, a whole document each time.
const BUDGET_MS = 300;

test('opening a pane is a client-side move that takes well under the old page loads', async ({ page }) => {
  await visit(page, '/en/');
  const timings: number[] = [];
  for (const [key, url] of [
    ['2', '/en/projects/'],
    ['3', '/en/posts/'],
    ['5', '/en/cv/'],
  ] as const) {
    const start = Date.now();
    await page.keyboard.press(key);
    await page.waitForURL(url);
    await page.waitForSelector('.pane h1');
    timings.push(Date.now() - start);
  }
  expect(Math.max(...timings)).toBeLessThan(BUDGET_MS);
});
