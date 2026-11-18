import { expect, test } from '@playwright/test';
import { visit } from './support.ts';

test('a click on the dark around the search or the help closes it, and a click inside does not', async ({ page }) => {
  await visit(page, '/en/');
  await page.keyboard.press('f');
  const pick = page.locator('dialog.pick');
  await expect(pick).toBeVisible();
  await pick.locator('.pick__input').click();
  await expect(pick).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(pick).toBeHidden();

  await page.keyboard.press('?');
  const help = page.locator('dialog.help');
  await expect(help).toBeVisible();
  await help.locator('h2').click();
  await expect(help).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(help).toBeHidden();
});

test('the search and the theme box have a button that closes them', async ({ page }) => {
  await visit(page, '/en/');
  await page.keyboard.press('f');
  await expect(page.locator('dialog.pick')).toBeVisible();
  await page.locator('dialog.pick .pick__actions .button').click();
  await expect(page.locator('dialog.pick')).toBeHidden();
});

test('choosing a theme only previews it; apply keeps it and cancel puts the old one back', async ({ page }) => {
  await visit(page, '/en/');
  const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.keyboard.press('t');
  const pick = page.locator('dialog.pick');
  await expect(pick).toBeVisible();
  const options = pick.locator('.pick__option');
  const count = await options.count();
  expect(count).toBeGreaterThan(2);
  await options.nth(count - 1).click();
  await expect(pick).toBeVisible();
  const previewed = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(previewed).not.toBe(before);
  await pick.getByRole('button', { name: 'cancel' }).click();
  await expect(pick).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(before);

  await page.keyboard.press('t');
  await options.nth(count - 1).click();
  await pick.getByRole('button', { name: 'apply' }).click();
  await expect(pick).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(previewed);
});

test('a theme is shown only while the pointer is on it, and the chosen one is back when it leaves', async ({
  page,
}) => {
  await visit(page, '/en/');
  const root = page.locator('html');
  const before = await root.getAttribute('data-theme');
  await page.keyboard.press('t');
  const pick = page.locator('dialog.pick');
  await expect(pick).toBeVisible();
  const options = pick.locator('.pick__option');
  const last = options.nth((await options.count()) - 1);
  await last.hover();
  await expect.poll(() => root.getAttribute('data-theme')).not.toBe(before);
  await page.mouse.move(5, 5);
  await expect.poll(() => root.getAttribute('data-theme')).toBe(before);
  await last.click();
  await page.mouse.move(5, 5);
  await expect.poll(() => root.getAttribute('data-theme')).not.toBe(before);
});

test('the language switch opens a choice and a click outside closes it', async ({ page }) => {
  await visit(page, '/en/');
  await page.locator('.lang--status').click();
  const menu = page.locator('.lang--status + dialog.lang-menu');
  await expect(menu).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(menu).toBeHidden();
});
