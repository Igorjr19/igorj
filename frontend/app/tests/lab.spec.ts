import { expect, test } from '@playwright/test';

test('the lab lists the three monitor prototypes, stays out of search engines and out of robots.txt', async ({
  page,
  request,
}) => {
  await page.goto('/lab/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('.lab__index li')).toHaveCount(3);
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /lab/');
});

test('the pattern prototype paints cells behind a window that holds the real page', async ({ page }) => {
  await page.goto('/lab/pattern/');
  await expect(page.locator('iframe.lab__window')).toHaveAttribute('src', '/en/');
  await expect
    .poll(() =>
      page.locator('canvas.lab__pattern').evaluate((canvas: HTMLCanvasElement) => {
        const context = canvas.getContext('2d');
        const { data } = context?.getImageData(0, 0, canvas.width, canvas.height) ?? { data: new Uint8ClampedArray() };
        const first = `${data[0]},${data[1]},${data[2]}`;
        for (let at = 4; at < data.length; at += 4) {
          if (`${data[at]},${data[at + 1]},${data[at + 2]}` !== first) {
            return true;
          }
        }
        return false;
      }),
    )
    .toBe(true);
});

test('the monitor prototype shows its 3D room or says WebGL is missing, never nothing', async ({ page }) => {
  await page.goto('/lab/monitor/');
  await expect(page.locator('.lab__stage canvas, .lab__note').first()).toBeVisible();
});

test('the boot prototype hands over to the live page on skip', async ({ page }) => {
  await page.goto('/lab/boot/');
  await page.getByRole('button', { name: 'skip' }).click();
  await expect(page.locator('iframe.lab__takeover')).toHaveAttribute('src', '/en/');
});
