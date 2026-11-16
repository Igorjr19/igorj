import { expect, test } from '@playwright/test';
import { visit } from './support.ts';

test('links to other sites open in a new tab and links within the site do not', async ({ page }) => {
  await visit(page, '/en/');
  const github = page.locator('.side__links a', { hasText: 'GitHub' });
  await expect(github).toHaveAttribute('target', '_blank');
  await expect(github).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.locator('.side__panes a').first()).not.toHaveAttribute('target', '_blank');
});

test('a link inside a post that leads to another site is marked in the HTML itself, before any script', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/en/projects/fixture-project/');
  const external = page.locator('.prose a[href^="http"]');
  if ((await external.count()) > 0) {
    await expect(external.first()).toHaveAttribute('target', '_blank');
  }
  await context.close();
});
