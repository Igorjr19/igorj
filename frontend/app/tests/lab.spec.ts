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

test('the boot prototype lands on the monitor on skip and shows the live page on its screen, or takes the window without WebGL', async ({
  page,
}) => {
  await page.goto('/lab/boot/');
  await page.getByRole('button', { name: 'skip' }).click();
  await expect(page.locator('.lab__monitor-window iframe, iframe.lab__takeover').first()).toHaveAttribute(
    'src',
    '/en/',
  );
});

test('once the boot has landed the room stands still: no frame is drawn, whatever the pointer does', async ({
  page,
}) => {
  await page.goto('/lab/boot/');
  const stage = page.locator('.lab__stage');
  await page.getByRole('button', { name: 'skip' }).click();
  test.skip((await page.locator('canvas.lab__canvas').count()) === 0, 'no WebGL here');
  await expect(page.locator('.lab__monitor-window')).toBeVisible();
  const frames = await stage.getAttribute('data-frames');
  await page.mouse.move(40, 40);
  await page.mouse.move(1300, 800);
  await page.waitForTimeout(400);
  expect(await stage.getAttribute('data-frames')).toBe(frames);
});
