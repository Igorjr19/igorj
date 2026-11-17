import { expect, test } from '@playwright/test';
import { visit } from './support.ts';

/** The room needs WebGL, which only Chromium runs headless here. */
test.skip(({ browserName }) => browserName !== 'chromium', 'the room is checked where WebGL runs');

test('on a small window the site is plain and offers no choice of presentation', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await visit(page, '/en/');
  await expect(page.locator('html')).toHaveAttribute('data-presentation', 'simple');
  await expect(page.locator('.presentation')).toHaveCount(0);
});

test('on a wide window an automated browser is plain, and the menu offers the scene and the simple site', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 850 });
  await visit(page, '/en/');
  await expect(page.locator('html')).toHaveAttribute('data-presentation', 'simple');
  await page.getByRole('button', { name: 'Presentation', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Simple', exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Scene', exact: true })).not.toBeChecked();
});

test('choosing the scene is remembered and shows the monitor, and choosing simple again goes back to the plain site', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('boot-slowdown', '100'));
  await page.setViewportSize({ width: 1400, height: 850 });
  await visit(page, '/en/');
  await page.getByRole('button', { name: 'Presentation', exact: true }).click();
  await page.getByRole('radio', { name: 'Scene', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-presentation', 'scene');
  expect(await page.evaluate(() => localStorage.getItem('presentation'))).toBe('scene');
  await expect(page.locator('.monitor[data-on]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Presentation', exact: true }).click();
  await page.getByRole('radio', { name: 'Simple', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-presentation', 'simple');
  await expect(page.locator('.monitor')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('presentation'))).toBe('simple');
});

test('escape closes the menu and gives the focus back to its button', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 850 });
  await visit(page, '/en/');
  const button = page.getByRole('button', { name: 'Presentation', exact: true });
  await button.click();
  await expect(page.locator('#presentation-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#presentation-menu')).toHaveCount(0);
  await expect(button).toBeFocused();
});
