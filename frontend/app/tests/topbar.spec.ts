import { expect, test } from '@playwright/test';
import { visit } from './support.ts';

test('the tools in the top bar are icons that name themselves with the key, on hover and on focus', async ({
  page,
}) => {
  await visit(page, '/en/');
  const search = page.getByRole('button', { name: 'search' });
  await expect(search).toHaveText('');
  await expect(search).toHaveAttribute('data-tip', 'search · f');
  await expect(search).toHaveAttribute('aria-keyshortcuts', 'f');
  await search.hover();
  const shown = await search.evaluate((node) => getComputedStyle(node, '::after').opacity);
  await expect
    .poll(async () => Number(await search.evaluate((node) => getComputedStyle(node, '::after').opacity)))
    .toBe(1);
  expect(shown).toBeDefined();
});

test('every tool of the top bar opens what its key opens', async ({ page }) => {
  await visit(page, '/en/');
  await page.getByRole('button', { name: 'help' }).click();
  await expect(page.locator('dialog.help')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'terminal' }).click();
  await expect(page.locator('#terminal-input')).toBeFocused();
});
