import { expect, test } from '@playwright/test';

test('moving between panes keeps the same window: no new document, the side column stays', async ({ page }) => {
  await page.goto('/en/');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-marker', 'same-document');
    document.querySelector('.side')?.setAttribute('data-marker', 'same-side');
  });
  await page.getByRole('link', { name: /Projects/ }).click();
  await expect(page).toHaveURL('/en/projects/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects');
  const kept = await page.evaluate(() => [
    document.documentElement.getAttribute('data-marker'),
    document.querySelector('.side')?.getAttribute('data-marker'),
  ]);
  expect(kept).toEqual(['same-document', 'same-side']);
});

test('the side column marks the current pane and lists only the panes the content turns on', async ({ page }) => {
  await page.goto('/en/projects/');
  await expect(page.locator('.side__panes a[aria-current="page"] .side__label')).toHaveText('Projects');
  const keys = await page.locator('.side__panes .side__key').allTextContents();
  expect(keys).toEqual(keys.map((_, index) => String(index + 1)));
});

test('the switcher shows the other language by its code and keeps the addresses in English', async ({ page }) => {
  await page.goto('/en/');
  const link = page.locator('.win__languages a');
  await expect(link).toHaveText('pt-br');
  await expect(link).toHaveAttribute('href', '/pt/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await link.click();
  await expect(page).toHaveURL('/pt/');
  await expect(page.locator('.side__panes .side__label').nth(1)).toHaveText('Projetos');
});

test('the root address leads to the saved language, else to the browser language', async ({ browser }) => {
  const portuguese = await browser.newContext({ locale: 'pt-BR' });
  const first = await portuguese.newPage();
  await first.goto('/');
  await expect(first).toHaveURL('/pt/');
  await first.evaluate(() => localStorage.setItem('language', 'en'));
  await first.goto('/');
  await expect(first).toHaveURL('/en/');
  await portuguese.close();
});

test('a saved theme applies before the first paint', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', JSON.stringify({ theme: 'catppuccin-latte' })));
  await page.goto('/en/');
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe('rgb(239, 241, 245)');
});

test('a visitor with the dark theme gets the dark colors without choosing anything', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/en/');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(30, 30, 46)');
  await context.close();
});
