import { expect, test } from '@playwright/test';

for (const [language, role] of [
  ['pt', 'Developer · Cidade de teste'],
  ['en', 'Developer · Fixture city'],
] as const) {
  test(`/${language}/ arrives prerendered from the model, before any script runs`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`/${language}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ígor José Rodrigues');
    await expect(page.getByText(role)).toBeVisible();
    await context.close();
  });
}
