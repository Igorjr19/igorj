import { expect, test } from '@playwright/test';

test('the CV offers its PDF, and what it serves is a PDF', async ({ page, request }) => {
  await page.goto('/en/cv/');
  const link = page.getByRole('link', { name: 'download PDF' });
  await expect(link).toHaveAttribute('href', '/en/cv/cv.pdf');
  await expect(link).toHaveAttribute('download', /-cv-en\.pdf$/);
  const response = await request.get('/en/cv/cv.pdf');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('pdf');
  expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
});
