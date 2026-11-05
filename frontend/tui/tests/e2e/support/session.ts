import type { Browser, Page } from '@astral/astral';
import { launchBrowser } from './browser.ts';
import { type StaticServer, serveSite } from './server.ts';

export type ColorScheme = 'light' | 'dark';

export interface PageOptions {
  readonly viewport?: { readonly width: number; readonly height: number };
  readonly colorScheme?: ColorScheme;
  readonly reducedMotion?: boolean;
  /** Set to false to check what visitors and crawlers without JavaScript get. */
  readonly javascript?: boolean;
  /** The browser's language preference, as an Accept-Language value such as "pt-BR,pt;q=0.9". */
  readonly acceptLanguage?: string;
  /** Values already saved in the site's local storage by an earlier visit. */
  readonly savedStorage?: Readonly<Record<string, string>>;
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
  async open(
    path: string,
    { viewport, colorScheme, reducedMotion, javascript = true, acceptLanguage, savedStorage }: PageOptions = {},
  ): Promise<Page> {
    await this.page?.close();
    const page = await this.browser.newPage();
    this.page = page;
    if (viewport) {
      await page.setViewportSize(viewport);
    }
    const features = [
      ...(colorScheme ? [{ name: 'prefers-color-scheme', value: colorScheme }] : []),
      ...(reducedMotion ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : []),
    ];
    if (features.length > 0) {
      await page.emulateMediaFeatures(features);
    }
    if (!javascript) {
      await page.unsafelyGetCelestialBindings().Emulation.setScriptExecutionDisabled({ value: true });
    }
    if (acceptLanguage) {
      const userAgent = await page.evaluate(() => navigator.userAgent);
      await page.unsafelyGetCelestialBindings().Emulation.setUserAgentOverride({ userAgent, acceptLanguage });
    }
    if (savedStorage) {
      await page.goto(`${this.server.url}/robots.txt`, { waitUntil: 'load' });
      await page.evaluate(
        (entries: Record<string, string>) => {
          for (const [key, value] of Object.entries(entries)) {
            localStorage.setItem(key, value);
          }
        },
        { args: [savedStorage] },
      );
    }
    await page.goto(`${this.server.url}${path}`, { waitUntil: 'load' });
    return page;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.browser.close();
    await this.server[Symbol.asyncDispose]();
  }
}
