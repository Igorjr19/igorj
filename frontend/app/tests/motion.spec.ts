import { expect, test } from '@playwright/test';
import { visit } from './support.ts';

test('under the mouse a light follows the pointer over the photo, and goes when it leaves', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, '/en/');
  const box = await page.locator('.hero__photo').boundingBox();
  if (!box) {
    throw new Error('no photo');
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 4);
  await page.mouse.move(box.x + box.width / 2 + 4, box.y + box.height / 4 + 4);
  await expect(page.locator('.hero__photo')).toHaveClass(/is-lit/);
  await page.mouse.move(5, 5);
  await expect(page.locator('.hero__photo')).not.toHaveClass(/is-lit/);
});

test('the name swells and stirs under the mouse and goes back to rest when the pointer leaves', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, '/en/');
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(async () => (await page.locator('.hero__ascii').textContent())?.length ?? 0).toBeGreaterThan(100);
  const rest = await page.locator('.hero__ascii').textContent();
  const box = await page.locator('.hero__ascii').boundingBox();
  if (!box) {
    throw new Error('no name');
  }
  await page.mouse.move(box.x + box.width / 3, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width / 3 + 6, box.y + box.height / 2 + 3);
  await expect.poll(async () => await page.locator('.hero__ascii').textContent()).not.toBe(rest);
  await page.mouse.move(5, 5);
  await expect.poll(async () => await page.locator('.hero__ascii').textContent()).toBe(rest);
});

test('a move between panes runs as a view transition that knows which way it goes', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'view transitions with types are Chromium-only so far');
  await page.addInitScript(() => {
    const calls: string[] = [];
    Object.assign(window, { calls });
    const original = document.startViewTransition?.bind(document);
    if (original) {
      document.startViewTransition = ((update: () => Promise<void>) => {
        const running = original(update);
        const add = running.types.add.bind(running.types);
        running.types.add = (type: string) => {
          calls.push(type);
          return add(type);
        };
        return running;
      }) as typeof document.startViewTransition;
    }
  });
  await visit(page, '/en/');
  await page.keyboard.press('3');
  await expect(page).toHaveURL('/en/posts/');
  // Let the first transition finish, so the second one is not skipped by a transition still running.
  await page.waitForTimeout(600);
  await page.keyboard.press('2');
  await expect(page).toHaveURL('/en/projects/');
  expect(await page.evaluate(() => Reflect.get(window, 'calls'))).toEqual(['forward', 'backward']);
});

test('there is no switch to reduce motion: the pages never ask', async ({ page }) => {
  await visit(page, '/en/');
  await page.keyboard.press('?');
  await expect(page.locator('dialog.help')).toBeVisible();
  await expect(page.locator('dialog.help')).not.toContainText(/motion/i);
  expect(await page.evaluate(() => document.documentElement.dataset['motion'])).toBeUndefined();
});

test('during a page change the window marks it, so the columns do not slide under the page transition', async ({
  page,
}) => {
  await visit(page, '/en/posts/');
  await page.evaluate(() => {
    const app = document.querySelector('.app');
    Object.assign(window, { marked: false });
    new MutationObserver(() => {
      if (app?.classList.contains('is-navigating')) {
        Object.assign(window, { marked: true });
      }
    }).observe(app as Element, { attributes: true, attributeFilter: ['class'] });
  });
  await page.locator('.item__link').first().click();
  await expect(page.locator('.is-zoomed')).toHaveCount(1);
  expect(await page.evaluate(() => Reflect.get(window, 'marked'))).toBe(true);
  await expect(page.locator('.is-navigating')).toHaveCount(0);
});
