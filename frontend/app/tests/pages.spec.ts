import { expect, test } from '@playwright/test';

test('the blog lists every post the language has, with a category filter and the language of a foreign post', async ({
  page,
}) => {
  await page.goto('/en/posts/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Posts');
  const titles = await page.locator('.item__title').allTextContents();
  expect(titles).toEqual(['Film fixture post', 'Post só em português', 'Second fixture post', 'Fixture post']);
  await expect(page.locator('.filter [aria-current="page"]')).toHaveText('all');
  await expect(page.locator('.item__link[lang="pt-BR"] .item__meta')).toContainText('pt-br');
});

test('a category lists only the posts written in the page language', async ({ page }) => {
  await page.goto('/en/categories/notes/');
  await expect(page.locator('.item__title')).toHaveText(['Fixture post']);
  await expect(page.locator('.filter [aria-current="page"]')).toHaveText('Notes');
});

test('a tag lists posts, projects and research that carry it, each as its section shows it', async ({ page }) => {
  await page.goto('/en/tags/machine-learning/');
  await expect(page.locator('.item__title')).toHaveText(['Fixture post', 'Fixture research']);
});

test('the projects list rows with the first tag as their fact', async ({ page }) => {
  await page.goto('/en/projects/');
  await expect(page.locator('.item__title')).toHaveText(['Second fixture project', 'Fixture project']);
  await expect(page.locator('.item__meta').first()).toHaveText('Go');
});

test('a post opens as one article: date and category, tags, its text and the way to the posts around it', async ({
  page,
}) => {
  await page.goto('/en/posts/fixture-post/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fixture post');
  await expect(page.locator('.panel__meta').first()).toContainText('Notes');
  await expect(page.locator('.zoom__tags .chip')).toHaveText(['Hugo', 'machine learning']);
  await expect(page.locator('.prose img, .prose .dither').first()).toBeVisible();
  await expect(page.locator('.pager a')).not.toHaveCount(0);
  await expect(page.locator('.is-zoomed .side')).toBeHidden();
});

test('a project opens with its name and its tags as chips', async ({ page }) => {
  await page.goto('/en/projects/fixture-project/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fixture project');
  await expect(page.locator('.zoom__tags .chip')).toHaveCount(2);
});

test('the CV is a timeline: the period of each entry beside its role and company', async ({ page }) => {
  await page.goto('/en/cv/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('CV');
  await expect(page.locator('.cv__entry .cv__role').first()).toHaveText('Fixture Developer');
  const columns = await page
    .locator('.cv__entry')
    .first()
    .evaluate((entry) => getComputedStyle(entry).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(2);
  await expect(page.locator('.cv__skills dt').first()).toHaveText('Languages');
});

test('running text is justified and hyphenated while the facts around it stay mono and flush left', async ({
  page,
}) => {
  await page.goto('/en/posts/fixture-post/');
  const look = await page.evaluate(() => {
    const text = getComputedStyle(document.querySelector('.prose > p:not(.panel__meta)') as Element);
    const meta = getComputedStyle(document.querySelector('.prose .panel__meta') as Element);
    return {
      align: text.textAlign,
      hyphens: text.hyphens,
      textFont: text.fontFamily,
      metaFont: meta.fontFamily,
      metaAlign: meta.textAlign,
    };
  });
  expect(look.align).toBe('justify');
  expect(look.hyphens).toBe('auto');
  expect(look.textFont).toContain('Fira Sans');
  expect(look.metaFont).toContain('Fira Code');
  expect(look.metaAlign).toBe('start');
});
