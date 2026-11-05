/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { HOME_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

Deno.test('network links carry their brand icon in the link color, hidden from screen readers', async () => {
  await using session = await Session.start();
  const page = await session.open(HOME_EN, { viewport: WIDE, javascript: false });
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('#system dd a[href^="http"]:not(:has(code))')].map((link) => {
      const icon = link.querySelector('svg.icon');
      return {
        name: link.textContent?.trim(),
        hidden: icon?.getAttribute('aria-hidden'),
        sameColor: icon ? getComputedStyle(icon).color === getComputedStyle(link).color : false,
        inked: icon?.querySelector('path')?.getAttribute('fill'),
      };
    }),
  );
  assertEquals(links, [
    { name: 'GitHub', hidden: 'true', sameColor: true, inked: 'currentColor' },
    { name: 'Last.fm', hidden: 'true', sameColor: true, inked: 'currentColor' },
  ]);
});
