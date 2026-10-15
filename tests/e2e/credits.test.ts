/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { parse } from '@std/toml';
import { HOME_EN, HOME_PT } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

interface Entry {
  readonly name: string;
  readonly license: string;
  readonly homepage: string;
}

const manifest = parse(await Deno.readTextFile('data/third-party.toml')) as { entries: Entry[] };

Deno.test('the credits page names every third-party item with its license and link', async (t) => {
  await using session = await Session.start();

  await t.step('each entry of the manifest appears, so a new one cannot be left out', async () => {
    const page = await session.open('/en/credits/', { viewport: WIDE, javascript: false });
    const listed = await page.evaluate(() =>
      [...document.querySelectorAll('.zoom__body .facts > dt')].map((term) => {
        const description = term.nextElementSibling;
        return {
          name: term.textContent?.trim(),
          homepage: description?.querySelector('a')?.getAttribute('href'),
          license: description?.querySelector('.panel__meta')?.textContent?.trim(),
        };
      }),
    );
    assertEquals(
      listed,
      manifest.entries.map(({ name, homepage, license }) => ({ name, homepage, license })),
    );
  });

  await t.step('it links the full license texts, which the build publishes', async () => {
    const page = await session.open('/en/credits/', { viewport: WIDE, javascript: false });
    const href = await page.evaluate(() =>
      document.querySelector('.zoom__body > p:last-child a')?.getAttribute('href'),
    );
    assertEquals(href, '/third-party-licenses.txt');
    const response = await fetch(`${session.url}${href}`);
    const text = await response.text();
    assert(response.ok && text.includes('MIT License'), 'the license texts file is missing or empty');
  });

  await t.step('the system panel of each language links to it', async () => {
    for (const [path, label, target] of [
      [HOME_EN, 'Credits', '/en/credits/'],
      [HOME_PT, 'Créditos', '/pt/credits/'],
    ] as const) {
      const page = await session.open(path, { viewport: WIDE, javascript: false });
      const link = await page.evaluate(() => {
        const anchor = [...document.querySelectorAll('#system dd a')].at(-1);
        return [anchor?.textContent?.trim(), anchor?.getAttribute('href')];
      });
      assertEquals(link, [label, target]);
    }
  });
});
