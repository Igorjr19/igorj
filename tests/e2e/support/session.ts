import type { Browser, Page } from '@astral/astral';
import { launchBrowser } from './browser.ts';
import { type StaticServer, serveSite } from './server.ts';

export type ColorScheme = 'light' | 'dark';

export interface PageOptions {
  readonly viewport?: { readonly width: number; readonly height: number };
  readonly colorScheme?: ColorScheme;
  /** Set to false to check what visitors and crawlers without JavaScript get. */
  readonly javascript?: boolean;
}

/** One browser, one page and one static server shared by the steps of a test. */
export class Session implements AsyncDisposable {
  private page: Page | undefined;

  private constructor(
    private readonly browser: Browser,
    private readonly server: StaticServer,
  ) {}

  get url(): string {
    return this.server.url;
  }

  static async start(): Promise<Session> {
    return new Session(await launchBrowser(), serveSite());
  }

  /** Opens a fresh page, closing the previous one so emulated settings never leak between steps. */
  async open(path: string, { viewport, colorScheme, javascript = true }: PageOptions = {}): Promise<Page> {
    await this.page?.close();
    const page = await this.browser.newPage();
    this.page = page;
    if (viewport) {
      await page.setViewportSize(viewport);
    }
    if (colorScheme) {
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: colorScheme }]);
    }
    if (!javascript) {
      await page.unsafelyGetCelestialBindings().Emulation.setScriptExecutionDisabled({ value: true });
    }
    await page.goto(`${this.server.url}${path}`, { waitUntil: 'load' });
    return page;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.browser.close();
    await this.server[Symbol.asyncDispose]();
  }
}
