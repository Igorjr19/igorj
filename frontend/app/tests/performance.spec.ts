import { expect, type Page, test } from '@playwright/test';
import { visit } from './support.ts';

// The reason for the move to a client-side app: opening a pane used to take a whole document each time, 400 to 630 ms.
// Five of each, and the median, since one move can stall alone. The two are measured side by side, in the same moment on the same machine, so a busy runner slows both alike.
const PANES = [
  ['2', '/en/projects/'],
  ['3', '/en/posts/'],
  ['5', '/en/cv/'],
  ['2', '/en/projects/'],
  ['3', '/en/posts/'],
] as const;

const median = (values: readonly number[]): number =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? Number.POSITIVE_INFINITY;

async function timeOf(page: Page, open: () => Promise<unknown>): Promise<number> {
  const start = Date.now();
  await open();
  await page.waitForSelector('.app[data-ready="true"] .pane h1');
  return Date.now() - start;
}

test('opening a pane is a client-side move that takes well under a whole page load', async ({ page }) => {
  const loads: number[] = [];
  for (const [, url] of PANES) {
    loads.push(await timeOf(page, () => page.goto(url)));
  }
  await visit(page, '/en/');
  const moves: number[] = [];
  for (const [key, url] of PANES) {
    moves.push(
      await timeOf(page, async () => {
        await page.keyboard.press(key);
        await page.waitForURL(url);
      }),
    );
  }
  expect(median(moves)).toBeLessThan(median(loads) * 0.75);
});
