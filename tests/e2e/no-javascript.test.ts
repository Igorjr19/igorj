/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { HOME_EN, POST_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

Deno.test('content is readable with JavaScript disabled', async (t) => {
  await using session = await Session.start();

  await t.step('the home lists the sections and their items', async () => {
    const page = await session.open(HOME_EN, { javascript: false });
    const links = await page.evaluate(() =>
      [...document.querySelectorAll('.panel a')].map((link) => link.textContent?.trim()),
    );
    assert(links.includes('Fixture post'), `missing post link in ${JSON.stringify(links)}`);
  });

  await t.step('a post shows its title and full text', async () => {
    const page = await session.open(POST_EN, { javascript: false });
    const { title, text } = await page.evaluate(() => ({
      title: document.querySelector('h1')?.textContent?.trim(),
      text: document.querySelector('.prose')?.textContent ?? '',
    }));
    assertEquals(title, 'Fixture post');
    assert(text.includes('A short quote.'));
  });
});
