import { expect, test } from '@playwright/test';
import { visit } from './support.ts';

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

test('the dither masks keep their shape in the alpha channel, which Safari reads, not in the luminance', async ({
  page,
  request,
}) => {
  await page.goto('/en/posts/fixture-post/');
  const address = await page
    .locator('.prose .dither--figure')
    .first()
    .evaluate((node) => getComputedStyle(node.querySelector('.dither__ink') as Element).maskImage);
  const mask = await request.get(address.slice(5, -2));
  const png = new Uint8Array(await mask.body());
  expect(png[25]).toBe(6);
  expect(address).toMatch(/\.[0-9a-f]{10}\.png/);
  await page.goto('/en/posts/');
  const thumbAddress = await page
    .locator('.item__image .dither__ink')
    .first()
    .evaluate((node) => getComputedStyle(node).maskImage);
  const thumb = await request.get(thumbAddress.slice(5, -2));
  expect(new DataView((await thumb.body()).buffer.slice(0)).getUint32(16)).toBeLessThanOrEqual(480);
});

test('a preview in a list uses the picture made at its own size, not the large one shrunk', async ({ page }) => {
  await page.goto('/en/posts/');
  const mask = await page
    .locator('.item__image:not(.item__image--none) .dither__ink')
    .first()
    .evaluate((node) => getComputedStyle(node).maskImage);
  expect(mask).toContain('/img/thumb/');
});

test('the period of a CV entry is at the right edge and the text at the left, and a company with an address is a link', async ({
  page,
}) => {
  await page.goto('/en/cv/');
  const edges = await page
    .locator('.cv__entry')
    .first()
    .evaluate((entry) => {
      const body = (entry.querySelector('.cv__body') as Element).getBoundingClientRect();
      const period = (entry.querySelector('.cv__period') as Element).getBoundingClientRect();
      return {
        bodyBeforePeriod: body.right <= period.left + 1,
        periodAtEnd: Math.abs(period.right - entry.getBoundingClientRect().right) < 2,
      };
    });
  expect(edges).toEqual({ bodyBeforePeriod: true, periodAtEnd: true });
  await expect(page.locator('.cv__org a').first()).toHaveAttribute('href', 'https://example.com/company');
});

test('on paper the CV opens with the name large, then the role and the place, without the page title', async ({
  page,
}) => {
  await page.goto('/en/cv/');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.cv__name')).toBeVisible();
  await expect(page.locator('.zoom__title')).toBeHidden();
  const size = await page.locator('.cv__name').evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
  expect(size).toBeGreaterThan(30);
  await expect(page.locator('.cv__headline')).toContainText('Fixture role');
});

test('an item with no picture shows its initial in the preview, and every preview has the same shape', async ({
  page,
}) => {
  await page.goto('/en/posts/');
  const masks = await page
    .locator('.item__image .dither__ink--on-bright')
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).maskImage));
  expect(masks.length).toBe(4);
  expect(masks.filter((mask) => mask.includes('/img/thumb/placeholder/')).length).toBe(3);
  await expect(page.locator('.item__image--none')).toHaveCount(0);
});

test('every preview in the grid has the same proportion, so the cards line up', async ({ page }) => {
  await visit(page, '/en/posts/');
  await page.keyboard.press('v');
  await expect(page.locator('[data-items]')).toHaveAttribute('data-view', 'grid');
  const shapes = await page.locator('.item__image').evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return Math.round((box.width / box.height) * 100) / 100;
    }),
  );
  expect(shapes.length).toBeGreaterThan(1);
  expect(new Set(shapes).size).toBe(1);
  expect(shapes[0]).toBeCloseTo(16 / 9, 1);
});

test('a picture of a post opens its original in a dialog, which Escape and the button close and which gives the focus back', async ({
  page,
}) => {
  await visit(page, '/en/posts/fixture-post/');
  const figure = page.locator('.prose .figure').first();
  await figure.focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('dialog.lightbox');
  await expect(dialog).toBeVisible();
  const image = dialog.locator('img');
  await expect(image).toHaveAttribute('src', /\/media\/posts\/fixture-post\/wide\.png$/);
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(figure).toBeFocused();
  await figure.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /close/ }).click();
  await expect(dialog).toBeHidden();
});

test('a picture marked #color is drawn in the colors of the theme, one pair of layers per role, and the originals are published', async ({
  page,
  request,
}) => {
  await visit(page, '/en/posts/fixture-post/');
  const chart = page.locator('.prose .figure', { has: page.locator('.dither__ink[style*="--color-"]') });
  await expect(chart).toHaveCount(1);
  const roles = await chart
    .locator('.dither__ink--on-dark')
    .evaluateAll((nodes) =>
      nodes.map((node) => /--dither-ink: var\(--color-(\w+)\)/.exec(node.getAttribute('style') ?? '')?.[1]),
    );
  expect(roles.length).toBeGreaterThanOrEqual(4);
  expect(new Set(roles).size).toBe(roles.length);
  const inks = await chart
    .locator('.dither__ink--on-dark')
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).backgroundColor));
  expect(new Set(inks).size).toBeGreaterThan(1);
  expect((await request.get('/media/posts/fixture-post/chart.png')).ok()).toBe(true);
  expect((await request.get('/media/posts/fixture-post/wide.png')).ok()).toBe(true);
});
