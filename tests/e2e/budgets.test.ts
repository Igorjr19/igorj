/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { parse } from '@std/toml';
import { type BudgetKey, findOverruns, parseBudgets } from '../../tools/quality/budgets.ts';
import { HOME_EN, HOME_PT, POST_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const SITE = 'generated/fixture-site';
const budgets = parseBudgets(parse(await Deno.readTextFile('data/budgets.toml')));

async function gzipSize(path: string): Promise<number> {
  const stream = (await Deno.open(path)).readable.pipeThrough(new CompressionStream('gzip'));
  return (await new Response(stream).arrayBuffer()).byteLength;
}

async function sumGzip(urls: string[]): Promise<number> {
  const sizes = await Promise.all(urls.map((url) => gzipSize(`${SITE}${url}`)));
  return sizes.reduce((total, size) => total + size, 0);
}

Deno.test('pages stay within the size budgets', async (t) => {
  await using session = await Session.start();

  for (const path of [HOME_EN, HOME_PT, POST_EN]) {
    await t.step(path, async () => {
      const page = await session.open(path);
      const loaded = await page.evaluate(async () => {
        await document.fonts.ready;
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return {
          linkedScripts: [...document.querySelectorAll('script[src]')].map(
            (script) => script.getAttribute('src') ?? '',
          ),
          stylesheet: document.querySelector('link[rel=stylesheet]')?.getAttribute('href') ?? '',
          inlineScript: [...document.querySelectorAll('script:not([src])')].reduce(
            (total, script) => total + (script.textContent?.length ?? 0),
            0,
          ),
          fonts: resources
            .filter((entry) => entry.name.endsWith('.woff2'))
            .reduce((total, entry) => total + entry.encodedBodySize, 0),
        };
      });
      const measured: Record<BudgetKey, number> = {
        html: await gzipSize(`${SITE}${path}index.html`),
        css: await gzipSize(`${SITE}${loaded.stylesheet}`),
        inlineScript: loaded.inlineScript,
        linkedScript: await sumGzip(loaded.linkedScripts),
        fonts: loaded.fonts,
      };
      assertEquals(findOverruns(budgets, measured), []);
    });
  }
});
