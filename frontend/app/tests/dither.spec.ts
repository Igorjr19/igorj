import { expect, test } from '@playwright/test';

for (const scheme of ['light', 'dark'] as const) {
  test(`a dithered picture shows its ink in the ${scheme} scheme, in every browser`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/en/posts/fixture-post/');
    const figure = page.locator('.prose .dither--figure').first();
    await expect(figure).toBeVisible();
    await figure.scrollIntoViewIfNeeded();
    const inks = await figure.locator('.dither__ink').evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return { color: style.backgroundColor, mask: style.maskImage || style.webkitMaskImage };
      }),
    );
    expect(inks.some((ink) => ink.color !== 'rgba(0, 0, 0, 0)' && ink.mask !== 'none')).toBe(true);
    const withInk = await figure.screenshot();
    await figure.locator('.dither__ink').evaluateAll((nodes) => {
      for (const node of nodes) {
        (node as HTMLElement).style.visibility = 'hidden';
      }
    });
    const without = await figure.screenshot();
    expect(withInk.equals(without)).toBe(false);
  });
}
