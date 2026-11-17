import { expect, type Page, test } from '@playwright/test';
import { visit } from './support.ts';

const today = (): string => new Date().toLocaleDateString('sv-SE');

/** The monitor needs WebGL, which only Chromium runs headless here; the others keep the plain site. */
test.skip(({ browserName }) => browserName !== 'chromium', 'the monitor is checked where WebGL runs');

async function monitorOn(page: Page, bootDay: string | null): Promise<void> {
  await page.addInitScript(
    ([day]) => {
      localStorage.setItem('presentation', 'scene');
      // The boot runs a hundred times slower, so it does not end by itself while the test is still looking at it.
      localStorage.setItem('boot-slowdown', '100');
      if (day) {
        localStorage.setItem('boot-day', day);
      }
    },
    [bootDay],
  );
}

test('an automated browser gets the plain site, with no monitor and no room', async ({ page }) => {
  await visit(page, '/en/');
  await expect(page.locator('html')).not.toHaveAttribute('data-monitor', '');
  await expect(page.locator('.monitor')).toHaveCount(0);
});

test('on a wide window the site is the screen: 80% of the view, in the 16:10 of the screen, with the room behind', async ({
  page,
}) => {
  await monitorOn(page, today());
  await page.setViewportSize({ width: 1400, height: 850 });
  await visit(page, '/en/');
  await expect(page.locator('html')).toHaveAttribute('data-monitor', '');
  await expect(page.locator('html')).not.toHaveAttribute('data-boot', '');
  await expect(page.locator('.monitor[data-on] canvas')).toHaveCount(1);
  const box = await page.locator('body').boundingBox();
  expect(box?.height).toBeCloseTo(850 * 0.8, 0);
  expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo(1.6, 1);
  expect((box?.x ?? 0) * 2 + (box?.width ?? 0)).toBeCloseTo(1400, 0);
});

test('a window too narrow or too short for the screen keeps the plain site', async ({ page }) => {
  await monitorOn(page, today());
  await page.setViewportSize({ width: 1000, height: 850 });
  await visit(page, '/en/');
  await expect(page.locator('html')).not.toHaveAttribute('data-monitor', '');
  await page.setViewportSize({ width: 1400, height: 600 });
  await page.reload();
  await expect(page.locator('html')).not.toHaveAttribute('data-monitor', '');
});

test('once landed the room stands still: no frame is drawn whatever the pointer does', async ({ page }) => {
  await monitorOn(page, today());
  await visit(page, '/en/');
  const room = page.locator('.monitor[data-on]');
  await expect(room).toHaveCount(1);
  const frames = await room.getAttribute('data-frames');
  await page.mouse.move(40, 40);
  await page.mouse.move(900, 500);
  await page.waitForTimeout(400);
  expect(await room.getAttribute('data-frames')).toBe(frames);
});

test('the room is drawn again when the window changes size', async ({ page }) => {
  await monitorOn(page, today());
  await visit(page, '/en/');
  const room = page.locator('.monitor[data-on]');
  const frames = Number(await room.getAttribute('data-frames'));
  await page.setViewportSize({ width: 1500, height: 900 });
  await expect.poll(async () => Number(await room.getAttribute('data-frames'))).toBeGreaterThan(frames);
});

test('the first visit of the day boots with the site hidden until any key skips it, and the same day does not boot again', async ({
  page,
}) => {
  await monitorOn(page, null);
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('data-boot', '');
  await expect(page.locator('body')).toBeHidden();
  await expect(page.locator('.monitor')).toHaveCount(1);
  // The room is on view while the boot runs, since the boot is typed on its screen.
  await expect(page.locator('.monitor[data-on]')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('data-boot', '');
  await page.keyboard.press('f');
  await expect(page.locator('html')).not.toHaveAttribute('data-boot', '');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('boot-day'))).toBe(today());
  await page.goto('/pt/');
  await expect(page.locator('html')).not.toHaveAttribute('data-boot', '');
});

test('a reload boots again even on the same day, and moving inside the site never does', async ({ page }) => {
  await monitorOn(page, today());
  await visit(page, '/en/');
  await page.getByRole('link', { name: 'Projects' }).first().click();
  await expect(page).toHaveURL(/projects/);
  await expect(page.locator('html')).not.toHaveAttribute('data-boot', '');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-boot', '');
  await expect(page.locator('.monitor')).toHaveCount(1);
  await page.mouse.click(300, 300);
  await expect(page.locator('html')).not.toHaveAttribute('data-boot', '');
});
