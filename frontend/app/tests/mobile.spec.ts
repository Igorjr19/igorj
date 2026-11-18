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

test('on a phone the photo of the home has a gentle shape in the single column', async ({ page }) => {
  await page.goto('/en/');
  const photo = page.locator('.hero__photo');
  await expect(photo).toBeVisible();
  const box = await photo.boundingBox();
  expect(box?.width).toBeGreaterThan(100);
  expect((box?.height ?? 0) / (box?.width ?? 1)).toBeCloseTo(4 / 5, 1);
});

test('the language is one control: on a phone it sits in the top line, and the status line does not repeat it', async ({
  page,
}) => {
  await page.goto('/en/');
  await expect(page.locator('.lang--top')).toBeVisible();
  await expect(page.locator('.lang--status')).toBeHidden();
  await expect(page.locator('.lang--top .lang__current')).toHaveText('en-us');
  const box = await page.locator('.lang--top a').boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test('on a phone the controls of the lists and the CV are as tall as a thumb needs, and a CV entry has the whole width', async ({
  page,
}) => {
  await page.goto('/en/projects/');
  for (const button of await page.locator('.view-switch button').all()) {
    expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  }
  await page.goto('/en/cv/');
  const entry = page.locator('.cv__entry').first();
  const period = await entry.locator('.cv__period').boundingBox();
  const body = await entry.locator('.cv__body').boundingBox();
  expect(body?.y).toBeGreaterThan((period?.y ?? 0) + (period?.height ?? 0) - 1);
  expect(body?.width).toBeGreaterThan(300);
});
