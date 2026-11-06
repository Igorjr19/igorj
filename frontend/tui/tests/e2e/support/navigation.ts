import type { Page } from '@astral/astral';

const POLL_MS = 50;
const TIMEOUT_MS = 5000;

/** Whether the page has its scripts in place; a document still being replaced counts as not loaded yet. */
async function loaded(page: Page): Promise<boolean> {
  try {
    return await page.evaluate(() => document.readyState === 'complete');
  } catch {
    return false;
  }
}

/** Waits for the page to leave the given path, whether a script or a refresh sends it away, and to load. */
export async function waitToLeave(page: Page, path: string): Promise<void> {
  for (let waited = 0; waited < TIMEOUT_MS; waited += POLL_MS) {
    if (new URL(page.url).pathname !== path && (await loaded(page))) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  throw new Error(`The page never left ${path}`);
}
