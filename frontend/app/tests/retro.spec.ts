import { expect, test } from '@playwright/test';
import { visit } from './support.ts';

test('retro mode is off by default and the terminal switches it, on, off and back', async ({ page }) => {
  await visit(page, '/en/');
  await expect(page.locator('html')).not.toHaveAttribute('data-retro', '');
  await page.keyboard.press(':');
  const input = page.locator('.term__input');
  await input.fill('retro');
  await input.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-retro', '');
  await expect(page.locator('.term__log')).toContainText('retro mode on');
  await input.fill('retro off');
  await input.press('Enter');
  await expect(page.locator('html')).not.toHaveAttribute('data-retro', '');
  await input.fill('retro maybe');
  await input.press('Enter');
  await expect(page.locator('.term__log')).toContainText('usage: retro [on|off]');
});

test('the command box and the theme box both offer the switch, and the choice is kept for the next visit', async ({
  page,
}) => {
  await visit(page, '/en/');
  await page.keyboard.press('f');
  await page.locator('.pick__input').fill('>retro');
  await expect(page.locator('.pick__option').first()).toContainText('retro mode: turn on');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-retro', '');
  expect(await page.evaluate(() => localStorage.getItem('retro'))).toBe('on');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-retro', '');
  await page.keyboard.press('t');
  await expect(page.locator('.pick__option').first()).toContainText('retro mode: turn off');
  await page.locator('.pick__option').first().click();
  await expect(page.locator('html')).not.toHaveAttribute('data-retro', '');
  expect(await page.evaluate(() => localStorage.getItem('retro'))).toBe('off');
});

test('a saved retro mode is on in the HTML before any script of the app runs, so it never flashes', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('retro', 'on'));
  await page.goto('/en/', { waitUntil: 'commit' });
  await page.waitForFunction(
    () => document.readyState !== 'loading' || document.documentElement.hasAttribute('data-retro'),
  );
  await expect(page.locator('html')).toHaveAttribute('data-retro', '');
});

test('the switch in the theme box does not keep the theme being previewed', async ({ page }) => {
  await visit(page, '/en/');
  const before = await page.evaluate(
    () =>
      document.documentElement.getAttribute('data-theme') ?? document.documentElement.getAttribute('data-theme-family'),
  );
  await page.keyboard.press('t');
  await expect(page.locator('.pick__option').first()).toContainText('retro mode');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.locator('.pick__option').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-retro', '');
  expect(
    await page.evaluate(
      () =>
        document.documentElement.getAttribute('data-theme') ??
        document.documentElement.getAttribute('data-theme-family'),
    ),
  ).toBe(before);
});
