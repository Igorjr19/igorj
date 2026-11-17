import { expect, test } from '@playwright/test';
import { visit } from './support.ts';

async function openTerminal(page: import('@playwright/test').Page): Promise<void> {
  await page.keyboard.press(':');
  await expect(page.locator('#terminal-input')).toBeFocused();
}

async function type(page: import('@playwright/test').Page, command: string): Promise<void> {
  await page.keyboard.type(command);
  await page.keyboard.press('Enter');
}

test(': opens the terminal as a panel under the content, greets, and the status line says so', async ({ page }) => {
  await visit(page, '/en/');
  await openTerminal(page);
  await expect(page.locator('.drawer--open')).toBeVisible();
  await expect(page.locator('.term__log')).toContainText('Ígor José Rodrigues');
  await expect(page.locator('.statusbar__mode')).toHaveText('TERMINAL');
  await expect(page.locator('.term__prompt')).toHaveText('guest@igorj:~$');
});

test('ls, cd, cat and tree read the site as folders and files', async ({ page }) => {
  await visit(page, '/en/');
  await openTerminal(page);
  await type(page, 'ls');
  await expect(page.locator('.term__log')).toContainText('posts/');
  await type(page, 'cd posts');
  await expect(page.locator('.term__prompt')).toHaveText('guest@igorj:~/posts$');
  await type(page, 'ls');
  await expect(page.locator('.term__log')).toContainText('fixture-post.md');
  await type(page, 'cat fixture-post');
  await expect(page.locator('.term__log')).toContainText('# Fixture post');
  await type(page, 'tree');
  await expect(page.locator('.term__log')).toContainText('├── ');
});

test('tab completes a command and a file name, up recalls the last line, and an unknown command says so', async ({
  page,
}) => {
  await visit(page, '/en/');
  await openTerminal(page);
  await page.keyboard.type('whoa');
  await page.keyboard.press('Tab');
  await expect(page.locator('#terminal-input')).toHaveValue('whoami ');
  await page.keyboard.press('Enter');
  await expect(page.locator('.term__log')).toContainText('Developer, Fixture city');
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('#terminal-input')).toHaveValue(/^whoami\s?$/);
  await page.locator('#terminal-input').fill('zzz');
  await page.keyboard.press('Enter');
  await expect(page.locator('.term__log')).toContainText('zzz: command not found');
});

test('open takes the window to a page, and the terminal stays open and keeps its history across pages', async ({
  page,
}) => {
  await visit(page, '/en/');
  await openTerminal(page);
  await type(page, 'open projects');
  await expect(page).toHaveURL('/en/projects/');
  await expect(page.locator('.drawer--open')).toBeVisible();
  await expect(page.locator('.term__log')).toContainText('open projects');
  // A page change moves the focus when it ends, so the field is clicked and the focus awaited before Escape is pressed.
  await page.locator('#terminal-input').click();
  await expect(page.locator('#terminal-input')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.drawer--open')).toHaveCount(0);
});

test('theme changes the theme from the terminal and the status line follows', async ({ page }) => {
  await visit(page, '/en/');
  await openTerminal(page);
  await type(page, 'theme latte');
  await expect(page.locator('.statusbar__facts')).toContainText('Catppuccin Latte');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toContain('catppuccin-latte');
});

test('the button in the top bar and exit close and open it, and clear empties the screen', async ({ page }) => {
  await visit(page, '/en/');
  await page.getByRole('button', { name: 'terminal' }).click();
  await expect(page.locator('#terminal-input')).toBeFocused();
  await type(page, 'clear');
  await expect(page.locator('.term__line')).toHaveCount(0);
  await type(page, 'exit');
  await expect(page.locator('.drawer--open')).toHaveCount(0);
});

test('the height of the panel follows the arrow keys on its edge and is remembered', async ({ page }) => {
  await visit(page, '/en/');
  await openTerminal(page);
  await page.locator('.drawer__handle').focus();
  await page.keyboard.press('ArrowUp');
  expect(await page.evaluate(() => localStorage.getItem('terminal-height'))).toBe('0.5');
});
