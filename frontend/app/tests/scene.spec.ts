import { expect, type Page, test } from '@playwright/test';
import { visit } from './support.ts';

const today = (): string => new Date().toLocaleDateString('sv-SE');

/** The monitor needs WebGL, which only Chromium runs headless here; the others keep the plain site. */
test.skip(({ browserName }) => browserName !== 'chromium', 'the scene is checked where WebGL runs');

async function sceneOn(page: Page, bootDay: string | null): Promise<void> {
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
  await expect(page.locator('html')).toHaveAttribute('data-presentation', 'simple');
  await expect(page.locator('.scene')).toHaveCount(0);
});

test('on a wide window the site is the screen: 80% of the view, in the 16:10 of the screen, with the room behind', async ({
  page,
}) => {
  await sceneOn(page, today());
  await page.setViewportSize({ width: 1400, height: 850 });
  await visit(page, '/en/');
  await expect(page.locator('html')).toHaveAttribute('data-presentation', 'scene');
  await expect(page.locator('html')).not.toHaveAttribute('data-boot', '');
  await expect(page.locator('.scene[data-on] canvas')).toHaveCount(1);
  const box = await page.locator('body').boundingBox();
  expect(box?.height).toBeCloseTo(850 * 0.8, 0);
  expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo(1.6, 1);
  expect((box?.x ?? 0) * 2 + (box?.width ?? 0)).toBeCloseTo(1400, 0);
});

test('a window too narrow or too short for the screen keeps the plain site', async ({ page }) => {
  await sceneOn(page, today());
  await page.setViewportSize({ width: 1000, height: 850 });
  await visit(page, '/en/');
  await expect(page.locator('html')).toHaveAttribute('data-presentation', 'simple');
  await page.setViewportSize({ width: 1400, height: 600 });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-presentation', 'simple');
});

test('once landed the room stands still: no frame is drawn whatever the pointer does', async ({ page }) => {
  await sceneOn(page, today());
  await visit(page, '/en/');
  const room = page.locator('.scene[data-on]');
  await expect(room).toHaveCount(1);
  const frames = await room.getAttribute('data-frames');
  await page.mouse.move(40, 40);
  await page.mouse.move(900, 500);
  await page.waitForTimeout(400);
  expect(await room.getAttribute('data-frames')).toBe(frames);
});

test('the room is drawn again when the window changes size', async ({ page }) => {
  await sceneOn(page, today());
  await visit(page, '/en/');
  const room = page.locator('.scene[data-on]');
  const frames = Number(await room.getAttribute('data-frames'));
  await page.setViewportSize({ width: 1500, height: 900 });
  await expect.poll(async () => Number(await room.getAttribute('data-frames'))).toBeGreaterThan(frames);
});

test('the first visit of the day boots with the site hidden until any key skips it, and the same day does not boot again', async ({
  page,
}) => {
  await sceneOn(page, null);
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('data-boot', '');
  await expect(page.locator('body')).toBeHidden();
  await expect(page.locator('.scene')).toHaveCount(1);
  // The room is on view while the boot runs, since the boot is typed on its screen.
  await expect(page.locator('.scene[data-on]')).toHaveCount(1);
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
  await sceneOn(page, today());
  await visit(page, '/en/');
  await page.getByRole('link', { name: 'Projects' }).first().click();
  await expect(page).toHaveURL(/projects/);
  await expect(page.locator('html')).not.toHaveAttribute('data-boot', '');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-boot', '');
  await expect(page.locator('.scene')).toHaveCount(1);
  await page.mouse.click(300, 300);
  await expect(page.locator('html')).not.toHaveAttribute('data-boot', '');
});

test('when the theme turns dark the hours of the window turn on to midnight, and back to light they go on to the next noon, never back', async ({
  page,
}) => {
  await sceneOn(page, today());
  await visit(page, '/en/');
  const room = page.locator('.scene[data-on]');
  await expect(room).toHaveCount(1);
  const phase = async (): Promise<number> => Number(await room.getAttribute('data-phase'));
  expect(await phase()).toBe(0);
  await page.evaluate(() => {
    document.documentElement.dataset['theme'] = 'catppuccin-mocha';
  });
  await expect.poll(phase, { timeout: 15000 }).toBe(0.5);
  await page.evaluate(() => {
    document.documentElement.dataset['theme'] = 'catppuccin-latte';
  });
  await expect.poll(phase, { timeout: 15000 }).toBe(1);
});

test('a click on the room around the screen steps back to see the room, the site steps aside, and the monitor takes the visitor back in', async ({
  page,
}) => {
  await sceneOn(page, today());
  await page.setViewportSize({ width: 1400, height: 850 });
  await visit(page, '/en/');
  await expect(page.locator('.scene[data-on]')).toHaveCount(1);
  const view = page.locator('html');
  await page.mouse.click(30, 425);
  await expect(view).toHaveAttribute('data-view', 'room', { timeout: 15000 });
  await expect(page.locator('body')).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(view).toHaveAttribute('data-view', 'monitor', { timeout: 15000 });
  await expect(page.locator('body')).toBeVisible();
});

test('escape leaves the monitor for the room, unless a box of the page is open and takes it first', async ({
  page,
}) => {
  await sceneOn(page, today());
  await visit(page, '/en/');
  await expect(page.locator('.scene[data-on]')).toHaveCount(1);
  await page.keyboard.press('?');
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-view', 'room');
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'room', { timeout: 15000 });
});

test('the iPod asks what is playing only while the room is in view', async ({ page }) => {
  let asked = 0;
  await page.route('**/api/now-playing', (route) => {
    asked += 1;
    return route.fulfill({ contentType: 'application/json', body: '{"playing":false}' });
  });
  await sceneOn(page, today());
  await page.setViewportSize({ width: 1400, height: 850 });
  await visit(page, '/en/');
  await expect(page.locator('.scene[data-on]')).toHaveCount(1);
  await page.waitForTimeout(1500);
  expect(asked).toBe(0);
  await page.mouse.click(30, 425);
  await expect(page.locator('html')).toHaveAttribute('data-view', 'room', { timeout: 15000 });
  await expect.poll(() => asked, { timeout: 5000 }).toBeGreaterThan(0);
});

test('in the room an arrow chooses an object and says what it is, enter goes close to it, and escape steps back', async ({
  page,
}) => {
  await sceneOn(page, today());
  await visit(page, '/en/');
  await expect(page.locator('.scene[data-on]')).toHaveCount(1);
  await page.mouse.click(30, 425);
  await expect(page.locator('html')).toHaveAttribute('data-view', 'room', { timeout: 15000 });
  await expect(page.locator('.scene__caption')).toBeHidden();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.scene__caption')).toContainText('Monitor');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.scene__caption')).toContainText('iPod');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'focus', { timeout: 15000 });
  await expect(page.locator('.scene__caption')).toContainText('The most listened this week');
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'room', { timeout: 15000 });
});

test('the objects of the room are buttons for the keyboard, reached only while the room is in view', async ({
  page,
}) => {
  await sceneOn(page, today());
  await visit(page, '/en/');
  await expect(page.locator('.scene[data-on]')).toHaveCount(1);
  await expect(page.locator('.scene__index')).toHaveJSProperty('inert', true);
  await page.mouse.click(30, 425);
  await expect(page.locator('html')).toHaveAttribute('data-view', 'room', { timeout: 15000 });
  await expect(page.locator('.scene__index')).toHaveJSProperty('inert', false);
  await page.getByRole('button', { name: 'Cork board' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'focus', { timeout: 15000 });
  await expect(page.locator('.scene__caption')).toContainText('Cork board');
});
