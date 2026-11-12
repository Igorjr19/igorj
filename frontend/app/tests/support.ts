import type { Page } from '@playwright/test';

/** Opens a page and waits until the app has taken it over, so the keys and the buttons are alive. */
export async function visit(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForSelector('.app[data-ready="true"]');
}
