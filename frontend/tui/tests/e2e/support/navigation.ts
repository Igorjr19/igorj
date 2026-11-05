import type { Page } from '@astral/astral';

const POLL_MS = 50;
const TIMEOUT_MS = 5000;

/** Waits for the page to leave the given path, whether a script or a refresh sends it away. */
export async function waitToLeave(page: Page, path: string): Promise<void> {
  for (let waited = 0; waited < TIMEOUT_MS; waited += POLL_MS) {
    if (new URL(page.url).pathname !== path) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  throw new Error(`The page never left ${path}`);
}
