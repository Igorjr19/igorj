import { expect, test } from '@playwright/test';
import { visit } from './support.ts';

test('f opens the search, typing finds a page, and enter opens it', async ({ page }) => {
  await visit(page, '/en/');
  await page.keyboard.press('f');
  await expect(page.locator('dialog.pick')).toBeVisible();
  await expect(page.locator('.pick__input')).toBeFocused();
  await page.keyboard.type('second fixture p');
  await expect(page.locator('.pick__option').first()).toContainText('Second fixture post');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/en/posts/second-post/');
  await expect(page.locator('dialog.pick')).toBeHidden();
});

test('escape closes the search and arrows move the selection', async ({ page }) => {
  await visit(page, '/en/');
  await page.keyboard.press('f');
  await expect(page.locator('.pick__option[aria-selected="true"]')).toHaveCount(1);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#pick-option-1')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.pick')).toBeHidden();
});

test('a > lists the commands, finishes the word with tab and runs it', async ({ page }) => {
  await visit(page, '/en/projects/');
  await page.keyboard.press('f');
  await expect(page.locator('.pick__input')).toBeFocused();
  await page.keyboard.type('>side');
  await expect(page.locator('.pick__ghost')).toContainText('side column: hide or show');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('.win__side-toggle')).toHaveAttribute('aria-pressed', 'false');
});

test('the list or grid command is offered on a list and switches the view', async ({ page }) => {
  await visit(page, '/en/projects/');
  await page.keyboard.press('f');
  await expect(page.locator('.pick__input')).toBeFocused();
  await page.keyboard.type('>list or grid');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-items]')).toHaveAttribute('data-view', 'grid');
});

test('the commands for shortcuts and motion are gone, as those choices are', async ({ page }) => {
  await visit(page, '/en/');
  await page.keyboard.press('f');
  await expect(page.locator('.pick__input')).toBeFocused();
  await page.keyboard.type('>');
  const labels = await page.locator('.pick__option .pick__label').allTextContents();
  expect(labels.some((label) => /shortcuts|motion/.test(label))).toBe(false);
});

test('t previews each theme as the selection moves and enter keeps the one chosen', async ({ page }) => {
  await visit(page, '/en/');
  await page.keyboard.press('t');
  await expect(page.locator('dialog.pick')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  const preview = await page.evaluate(
    () => document.documentElement.dataset['theme'] ?? document.documentElement.dataset['themeFamily'],
  );
  expect(preview).toBeTruthy();
  await page.keyboard.press('Enter');
  const saved = await page.evaluate(() => localStorage.getItem('theme'));
  expect(saved).toContain('catppuccin');
});

test('escape in the themes goes back to the theme the visitor had', async ({ page }) => {
  await visit(page, '/en/');
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.keyboard.press('t');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(before);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
});

test('an accent can be picked with the arrows and with the swatches', async ({ page }) => {
  await visit(page, '/en/');
  await page.keyboard.press('t');
  const label = page.locator('.pick__accents-label');
  const first = await label.textContent();
  await page.keyboard.press('ArrowRight');
  expect(await label.textContent()).not.toBe(first);
  await page.locator('.pick__accent').nth(2).click();
  await expect(page.locator('.pick__accent[aria-pressed="true"]')).toHaveCount(1);
});

test('# opens the filter with the categories and tags, and choosing a category goes to its page', async ({ page }) => {
  await visit(page, '/en/posts/');
  await page.keyboard.press('#');
  await expect(page.locator('.pick__input')).toBeFocused();
  await expect(page.locator('.pick__option').first()).toContainText('all posts');
  await page.keyboard.type('notes');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/en/categories/notes/');
});

test('the buttons in the top bar open the search and the themes', async ({ page }) => {
  await visit(page, '/en/');
  await page.locator('.win__button', { hasText: 'search' }).click();
  await expect(page.locator('dialog.pick')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.win__button', { hasText: 'theme' }).click();
  await expect(page.locator('.pick__accents')).toBeVisible();
});
