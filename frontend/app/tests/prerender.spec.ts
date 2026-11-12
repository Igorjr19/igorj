import { expect, test } from '@playwright/test';

for (const language of ['pt', 'en']) {
  test(`/${language}/ arrives prerendered from the model, before any script runs`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`/${language}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ígor José Rodrigues');
    await expect(page.locator('.side__role')).toHaveText('Developer');
    await expect(page.locator('.side__panes a')).not.toHaveCount(0);
    await context.close();
  });
}
