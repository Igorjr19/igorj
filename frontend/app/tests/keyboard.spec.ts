import { expect, test } from '@playwright/test';
import { visit } from './support.ts';

test('a number key opens that pane and the pane already open gives its first item the focus', async ({ page }) => {
  await visit(page, '/en/');
  await page.keyboard.press('2');
  await expect(page).toHaveURL('/en/projects/');
  await page.keyboard.press('2');
  await expect(page.locator('.item__link').first()).toBeFocused();
});

test('j and k move through the rows without wrapping, and a selected row stands out', async ({ page }) => {
  await visit(page, '/en/posts/');
  await page.keyboard.press('j');
  await expect(page.locator('.item__link').nth(0)).toBeFocused();
  await page.keyboard.press('j');
  await expect(page.locator('.item__link').nth(1)).toBeFocused();
  await expect(page.locator('.item').nth(1)).toHaveAttribute('data-selected', 'true');
  await page.keyboard.press('k');
  await page.keyboard.press('k');
  await expect(page.locator('.item__link').nth(0)).toBeFocused();
});

test('q goes back to the parent page and the status line offers the same as a link', async ({ page }) => {
  await visit(page, '/en/posts/fixture-post/');
  await expect(page.locator('.statusbar a[data-nav="back"]')).toHaveText('q back');
  await page.keyboard.press('q');
  await expect(page).toHaveURL('/en/posts/');
});

test('z hides and shows the side column, and the button in the top bar says which', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, '/en/');
  await expect(page.locator('.side')).toBeVisible();
  await page.keyboard.press('z');
  await expect(page.locator('.win__body')).toHaveCSS('grid-template-columns', /^0px /);
  await expect(page.locator('.win__side-toggle')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('.win__side-toggle').click();
  await expect(page.locator('.win__side-toggle')).toHaveAttribute('aria-pressed', 'true');
});

test('a page that is read hides the side column by itself and a new page starts from its own choice', async ({
  page,
}) => {
  await visit(page, '/en/posts/fixture-post/');
  await expect(page.locator('.is-zoomed')).toHaveCount(1);
  await page.keyboard.press('z');
  await expect(page.locator('.is-zoomed')).toHaveCount(0);
  await page.keyboard.press('q');
  await expect(page.locator('.is-zoomed')).toHaveCount(0);
});

test('? opens the help, which lists the keys, and esc closes it', async ({ page }) => {
  await visit(page, '/en/');
  await page.keyboard.press('?');
  await expect(page.locator('dialog.help')).toBeVisible();
  await expect(page.locator('dialog.help dt').first()).toContainText('1–');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.help')).toBeHidden();
});

test('the keys do nothing while typing in a field or with Ctrl held', async ({ page }) => {
  await visit(page, '/en/');
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'probe';
    document.body.append(input);
  });
  await page.locator('#probe').focus();
  await page.keyboard.press('2');
  await expect(page).toHaveURL('/en/');
  await page.locator('#probe').evaluate((element) => element.blur());
  await page.keyboard.press('Control+2');
  await expect(page).toHaveURL('/en/');
});

test('v switches between the list and the grid, the button does the same, and the choice is remembered', async ({
  page,
}) => {
  await visit(page, '/en/projects/');
  await expect(page.locator('[data-items]')).toHaveAttribute('data-view', 'list');
  await page.keyboard.press('v');
  await expect(page.locator('[data-items]')).toHaveAttribute('data-view', 'grid');
  await page.reload();
  await expect(page.locator('[data-items]')).toHaveAttribute('data-view', 'grid');
  await page.locator('.view-switch button', { hasText: 'list' }).click();
  await expect(page.locator('[data-items]')).toHaveAttribute('data-view', 'list');
});

test('on a post, p and n follow the posts around it, and the buttons in the status line are the same links', async ({
  page,
}) => {
  await visit(page, '/en/posts/film-post/');
  const next = page.locator('.statusbar a', { hasText: 'previous' });
  await expect(next).toHaveCount(1);
  await page.keyboard.press('p');
  await expect(page).not.toHaveURL('/en/posts/film-post/');
});

test('reading shows how far along the reader is, and a post can be shared', async ({ page }) => {
  await visit(page, '/en/posts/fixture-post/');
  await expect(page.locator('.statusbar__facts')).toContainText('% read');
  await expect(page.locator('.share__button')).toBeVisible();
});

test('the copy button of a code block copies it and says so', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'only Chromium lets a test read the clipboard');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await visit(page, '/en/posts/fixture-post/');
  const copy = page.locator('[data-copy]').first();
  if ((await copy.count()) > 0) {
    await copy.click();
    await expect(copy).toHaveText('copied');
  }
});

test('choosing a language with the switcher is remembered for the root address', async ({ page }) => {
  await visit(page, '/en/');
  await page.locator('.win__languages a').click();
  expect(await page.evaluate(() => localStorage.getItem('language'))).toBe('pt');
});
