/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { HOME_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

Deno.test('the visitor can turn the motion of the site down, and it stays down', async (t) => {
  await using session = await Session.start();

  const read = () => ({
    motion: document.documentElement.dataset['motion'] ?? null,
    pressed: document.querySelector('[data-motion-toggle]')?.getAttribute('aria-pressed'),
    cursor: getComputedStyle(document.querySelector('.cursor') as Element).animationName,
    panel: getComputedStyle(document.querySelector('.win__body') as Element).transitionDuration,
  });

  await t.step('motion is on by default, and the cursor blinks', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    const state = await page.evaluate(read);
    assertEquals([state.motion, state.pressed, state.cursor], [null, 'false', 'cursor-blink']);
    assert(state.panel !== '0s', 'the terminal panel slides');
  });

  await t.step('the button in the help turns it down, and the choice applies before the next paint', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.press('?');
    await page.locator('.help [data-action="toggle-motion"]').click();
    await page.reload();
    assertEquals(await page.evaluate(read), { motion: 'reduced', pressed: 'true', cursor: 'none', panel: '0s' });
    await page.evaluate(() => localStorage.clear());
  });

  await t.step('the palette has the same switch', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.press('f');
    await page.waitForFunction(() => document.querySelector('dialog.pick[open]') !== null);
    await page.keyboard.type('>motion');
    await page.keyboard.press('Enter');
    assertEquals((await page.evaluate(read)).motion, 'reduced');
    await page.evaluate(() => localStorage.clear());
  });
});
