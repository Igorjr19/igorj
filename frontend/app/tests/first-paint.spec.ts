import { expect, test } from '@playwright/test';

for (const [name, size] of [
  ['a desktop', { width: 1440, height: 900 }],
  ['a phone', { width: 390, height: 844 }],
] as const) {
  test(`on ${name} the room kept for the name is the room the drawn name takes, so the page does not move`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto('/en/');
    await expect(page.locator('.hero__ascii')).not.toHaveText('');
    const { art, block } = await page.evaluate(() => ({
      art: (document.querySelector('.hero__ascii') as HTMLElement).getBoundingClientRect().height,
      block: (document.querySelector('.hero__name-block') as HTMLElement).getBoundingClientRect().height,
    }));
    // The block is as tall as the room reserved or as the drawing, whichever is taller; they stay within a tenth.
    expect(Math.abs(block - art) / art).toBeLessThan(0.1);
  });
}

test('the home does not shift while it loads on a slow connection', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'throttling the network needs the Chromium protocol');
  const session = await page.context().newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (400 * 1024) / 8,
    uploadThroughput: (400 * 1024) / 8,
  });
  await page.addInitScript(() => {
    Reflect.set(window, 'shift', 0);
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const value = Reflect.get(entry, 'value');
        if (!Reflect.get(entry, 'hadRecentInput') && typeof value === 'number') {
          Reflect.set(window, 'shift', Number(Reflect.get(window, 'shift')) + value);
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/en/');
  await expect(page.locator('.hero__ascii')).not.toHaveText('');
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => Number(Reflect.get(window, 'shift')))).toBeLessThan(0.05);
});
