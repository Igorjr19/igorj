import { expect, test } from '@playwright/test';
import { visit } from './support.ts';

test('a tag page opened from a project goes back to that project, not to a fixed list', async ({ page }) => {
  await visit(page, '/en/projects/fixture-project/');
  await page.locator('.zoom__tags .chip').first().click();
  await expect(page).toHaveURL(/\/en\/tags\//);
  await page.locator('.back a').click();
  await expect(page).toHaveURL('/en/projects/fixture-project/');
});

test('a page opened afresh has a back link that leads to its list', async ({ page }) => {
  await visit(page, '/en/posts/fixture-post/');
  await expect(page.locator('.back a')).toHaveAttribute('href', '/en/posts/');
});

test('a category goes back to the blog when it was the first page opened', async ({ page }) => {
  await visit(page, '/en/categories/notes/');
  await expect(page.locator('.back a')).toHaveAttribute('href', '/en/posts/');
});
