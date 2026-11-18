import type { Page } from '@playwright/test';

/** Opens a page and waits until the app has taken it over, so the keys and the buttons are alive. */
export async function visit(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForSelector('.app[data-ready="true"]');
}

/** Records which elements are animated by script, so a test can ask whether something moved without racing the clock. */
export async function recordAnimations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const animated: string[] = [];
    Reflect.set(window, 'animated', animated);
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<Element['animate']>) {
      animated.push(this.className.toString());
      return original.apply(this, args);
    };
  });
}

/** The class names of the elements animated by script so far. */
export async function animatedSoFar(page: Page): Promise<string[]> {
  return await page.evaluate(() => (Reflect.get(window, 'animated') as string[] | undefined) ?? []);
}
