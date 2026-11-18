import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('on a phone the panes are a tab bar that stays at the foot while the page scrolls', async ({ page }) => {
  await page.goto('/en/projects/');
  const bar = page.locator('.side');
  await expect(bar).toBeVisible();
  const box = await bar.boundingBox();
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeCloseTo(844, 0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const after = await bar.boundingBox();
  expect((after?.y ?? 0) + (after?.height ?? 0)).toBeCloseTo(844, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('every pane fits in the tab bar and a tap moves to it', async ({ page }) => {
  await page.goto('/en/');
  const tabs = page.locator('.side__panes a');
  const count = await tabs.count();
  for (let index = 0; index < count; index += 1) {
    const box = await tabs.nth(index).boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await tabs.nth(1).tap();
  await expect(page).toHaveURL('/en/projects/');
  await expect(page.locator('.side__panes a[aria-current="page"]')).toHaveCount(1);
});

test('on a phone the photo of the home keeps its shape in the single column', async ({ page }) => {
  await page.goto('/en/');
  const photo = page.locator('.hero__photo');
  await expect(photo).toBeVisible();
  const box = await photo.boundingBox();
  expect(box?.width).toBeGreaterThan(100);
  expect(box?.height).toBeGreaterThan(100);
  const ratio = await photo.evaluate((node) => getComputedStyle(node).getPropertyValue('--dither-ratio'));
  const [width, height] = ratio.split('/').map(Number);
  expect((box?.height ?? 0) / (box?.width ?? 1)).toBeCloseTo((height ?? 1) / (width ?? 1), 1);
});
