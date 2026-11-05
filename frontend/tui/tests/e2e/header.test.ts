/// <reference lib="dom" />
import { assertAlmostEquals, assertEquals } from '@std/assert';
import { HOME_EN, HOME_PT, POST_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const NAME = 'Ígor José Rodrigues';

function readHeader() {
  const role = document.querySelector('.site-header__role') as Element;
  const cursor = role.querySelector('.cursor') as Element;
  const style = getComputedStyle(cursor);
  return {
    heading: document.querySelector('header h1')?.textContent?.trim() ?? null,
    nameLink: document.querySelector('.site-header__name a')?.textContent?.trim() ?? null,
    role: role.textContent?.trim(),
    cursorIsLast: role.lastElementChild === cursor && cursor.nextSibling === null,
    cursorHidden: cursor.getAttribute('aria-hidden'),
    cursorWidth: cursor.getBoundingClientRect().width,
    cellWidth: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-width')),
    animation: style.animationName,
    title: document.title,
  };
}

Deno.test('header shows the name and role with a block cursor after the role', async (t) => {
  await using session = await Session.start();

  for (const path of [HOME_EN, HOME_PT]) {
    await t.step(`${path}: the name is the page heading, followed by the role and a blinking cursor`, async () => {
      const page = await session.open(path);
      const header = await page.evaluate(readHeader);
      assertEquals(header.heading, NAME);
      assertEquals(header.role, 'Developer');
      assertEquals(header.cursorIsLast, true);
      assertEquals(header.cursorHidden, 'true');
      assertAlmostEquals(header.cursorWidth, header.cellWidth, 0.01);
      assertEquals(header.animation, 'cursor-blink');
      assertEquals(header.title, `${NAME} — Developer`);
    });
  }

  await t.step('the cursor stands still when the visitor asks for reduced motion', async () => {
    const page = await session.open(HOME_EN, { reducedMotion: true });
    assertEquals((await page.evaluate(readHeader)).animation, 'none');
  });

  await t.step('inner pages link the name home and leave the heading to the page title', async () => {
    const page = await session.open(POST_EN);
    const header = await page.evaluate(readHeader);
    assertEquals(header.heading, null);
    assertEquals(header.nameLink, NAME);
  });

  await t.step('page titles keep their capitalisation; only home panel names are lowercase', async () => {
    const page = await session.open(POST_EN);
    const transform = await page.evaluate(
      () => getComputedStyle(document.querySelector('h1') as Element).textTransform,
    );
    assertEquals(transform, 'none');
  });
});
