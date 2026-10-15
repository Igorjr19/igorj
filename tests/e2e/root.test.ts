/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { waitToLeave } from './support/navigation.ts';
import { HOME_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

Deno.test('the root page sends visitors to a language home on the same host, even in previews', async () => {
  await using session = await Session.start();
  const page = await session.open('/', { acceptLanguage: 'en-US' });
  await waitToLeave(page, '/');
  const { host, pathname } = await page.evaluate(() => ({ host: location.host, pathname: location.pathname }));
  assertEquals(pathname, HOME_EN);
  assertEquals(host, new URL(session.url).host);
});
