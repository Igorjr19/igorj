/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { HOME_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const SITE = 'generated/fixture-site';

/** The rules of a Cloudflare Pages `_headers` file, as path → header lines. */
function parseHeaders(text: string): Map<string, string[]> {
  const rules = new Map<string, string[]>();
  let path = '';
  for (const line of text.split('\n')) {
    if (line.startsWith('/')) {
      path = line.trim();
      rules.set(path, []);
    } else if (line.trim() && !line.startsWith('#')) {
      rules.get(path)?.push(line.trim());
    }
  }
  return rules;
}

Deno.test('assets are cached as long as their names allow, and the next page loads ahead', async (t) => {
  await t.step(
    'styles and scripts, named by their content, never revalidate; fonts and media keep a week',
    async () => {
      const rules = parseHeaders(await Deno.readTextFile(`${SITE}/_headers`));
      for (const path of ['/css/*', '/ts/*', '/share/*']) {
        assertEquals(rules.get(path), ['Cache-Control: public, max-age=31536000, immutable']);
      }
      for (const path of ['/fonts/*', '/media/*', '/icons/*']) {
        assert(rules.get(path)?.[0]?.includes('max-age=604800'), path);
      }
    },
  );

  await t.step(
    'every page fetches the panes ahead and prerenders the internal page under the pointer, but not feeds or data',
    async () => {
      await using session = await Session.start();
      const page = await session.open(HOME_EN, { viewport: { width: 1440, height: 900 } });
      const rules = await page.evaluate(() =>
        JSON.parse(document.querySelector('script[type="speculationrules"]')?.textContent ?? '{}'),
      );
      const [rule] = rules.prerender;
      assertEquals(rule.eagerness, 'moderate');
      assert(JSON.stringify(rule.where).includes('/*.json'), 'data files stay out');
      const [ahead] = rules.prefetch;
      assertEquals([ahead.eagerness, ahead.where.selector_matches], ['eager', '.side__panes a,.pager a']);
    },
  );
});

Deno.test('every page points to one favicon, drawn in the colors of the default dark theme', async () => {
  for (const file of ['en/index.html', 'pt/posts/index.html', '404.html', 'index.html']) {
    const html = await Deno.readTextFile(`${SITE}/${file}`);
    assert(/<link rel=(?:"icon"|icon) href=(?:"\/icons\/favicon\.svg"|\/icons\/favicon\.svg)/.test(html), file);
  }
  const icon = await Deno.readTextFile(`${SITE}/icons/favicon.svg`);
  const themes = JSON.parse(await Deno.readTextFile('generated/data/themes.json'));
  const family = themes.families.find((each: { name: string }) => each.name === themes.defaultFamily);
  const dark = family.themes.find((theme: { id: string }) => theme.id === family.system.dark);
  assert(icon.includes(`fill="${dark.swatch[0]}"`), 'the background is the dark theme background');
  assert(!icon.includes('{{'), 'the template was filled in');
});
