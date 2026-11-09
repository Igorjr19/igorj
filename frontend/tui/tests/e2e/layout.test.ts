/// <reference lib="dom" />
import { assert, assertAlmostEquals, assertEquals } from '@std/assert';
import { HOME_EN, POST_EN, POSTS_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };
const NARROW = { width: 360, height: 800 };

Deno.test('the window keeps the side column beside the pane on wide screens and folds on narrow ones', async (t) => {
  await using session = await Session.start();

  await t.step('wide: the side column on the left, the pane beside it, both inside the window', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    const boxes = await page.evaluate(() => {
      const box = (selector: string) => {
        const { left, right, top } = (document.querySelector(selector) as HTMLElement).getBoundingClientRect();
        return { left, right, top };
      };
      return { side: box('.side'), pane: box('.pane'), win: box('.win') };
    });
    assert(
      boxes.side.right <= boxes.pane.left + 1,
      `side ends at ${boxes.side.right}, pane starts at ${boxes.pane.left}`,
    );
    assertAlmostEquals(boxes.side.top, boxes.pane.top, 1);
    assert(boxes.pane.right <= boxes.win.right, 'the pane stays inside the window');
  });

  await t.step('wide: the pane scrolls inside the window while the side and status lines stay put', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    const state = await page.evaluate(() => {
      const pane = document.querySelector('.pane') as HTMLElement;
      pane.scrollTop = pane.scrollHeight;
      return {
        pageScroll: document.documentElement.scrollHeight - innerHeight,
        statusVisible:
          (document.querySelector('.statusbar')?.getBoundingClientRect().bottom ?? Number.POSITIVE_INFINITY) <=
          innerHeight,
      };
    });
    assertEquals(state, { pageScroll: 0, statusVisible: true });
  });

  await t.step('narrow: who and the side blocks fold away, the panes wrap into rows above the pane', async () => {
    const page = await session.open(POSTS_EN, { viewport: NARROW });
    const state = await page.evaluate(() => ({
      who: document.querySelector('.side__who')?.checkVisibility(),
      blocks: [...document.querySelectorAll('.side__block')].some((block) => block.checkVisibility()),
      panes: document.querySelector('.side__panes')?.checkVisibility(),
      panesAbovePane:
        (document.querySelector('.side__panes')?.getBoundingClientRect().bottom ?? 0) <=
        (document.querySelector('.pane')?.getBoundingClientRect().top ?? 0) + 1,
    }));
    assertEquals(state, { who: false, blocks: false, panes: true, panesAbovePane: true });
  });
});

Deno.test('the pane shows where it is scrolled on a thin rail instead of a browser bar', async (t) => {
  await using session = await Session.start();

  const read = async () => {
    const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    await frame();
    const rail = document.querySelector('.scroll') as HTMLElement;
    const thumb = (document.querySelector('.scroll__thumb') as HTMLElement).getBoundingClientRect();
    const box = rail.getBoundingClientRect();
    return {
      shown: getComputedStyle(rail).opacity === '1',
      bar: getComputedStyle(document.querySelector('.pane') as HTMLElement).scrollbarWidth,
      atTop: Math.abs(thumb.top - box.top) < 1,
      atBottom: Math.abs(thumb.bottom - box.bottom) < 1,
    };
  };

  await t.step('a pane taller than the window shows the rail, with the thumb following the scroll', async () => {
    const page = await session.open(HOME_EN, { viewport: { width: 1440, height: 600 } });
    assertEquals(await page.evaluate(read), { shown: true, bar: 'none', atTop: true, atBottom: false });
    await page.evaluate(() => {
      const pane = document.querySelector('.pane') as HTMLElement;
      pane.scrollTop = pane.scrollHeight;
    });
    assertEquals(await page.evaluate(read), { shown: true, bar: 'none', atTop: false, atBottom: true });
  });

  await t.step('a pane that fits has nothing to show', async () => {
    const page = await session.open(HOME_EN, { viewport: { width: 1440, height: 4000 } });
    assertEquals((await page.evaluate(read)).shown, false);
  });
});

Deno.test('prose keeps the character grid of the frame', async (t) => {
  await using session = await Session.start();

  await t.step('prose in Fira Sans keeps the cell size measured with Fira Code', async () => {
    const page = await session.open(POST_EN);
    const sizes = await page.evaluate(async () => {
      const rootStyle = getComputedStyle(document.documentElement);
      await document.fonts.load(`${rootStyle.fontSize} 'Fira Code'`);
      await document.fonts.load(`${rootStyle.fontSize} 'Fira Sans'`);
      const paragraph = document.querySelector('.prose p') as Element;

      const ruler = document.createElement('span');
      ruler.style.cssText = `position: absolute; white-space: nowrap; font: ${rootStyle.fontSize} 'Fira Code'`;
      ruler.textContent = '0'.repeat(100);
      document.body.append(ruler);
      const glyphWidth = ruler.getBoundingClientRect().width / 100;
      ruler.remove();

      return {
        rootCell: Number.parseFloat(rootStyle.getPropertyValue('--cell-width')),
        proseCell: Number.parseFloat(getComputedStyle(paragraph).getPropertyValue('--cell-width')),
        proseFont: getComputedStyle(paragraph).fontFamily,
        glyphWidth,
      };
    });
    assert(sizes.proseFont.includes('Fira Sans'));
    assertEquals(sizes.proseCell, sizes.rootCell);
    assertAlmostEquals(sizes.rootCell, sizes.glyphWidth, 0.01);
  });
});

Deno.test('panel boxes are readable by assistive technology', async (t) => {
  await using session = await Session.start();

  for (const path of [HOME_EN, POST_EN]) {
    await t.step(`${path}: borders are CSS, not box-drawing characters in the text`, async () => {
      const page = await session.open(path);
      const hasBoxDrawing = await page.evaluate(() => /[─-▟]/.test(document.body.textContent ?? ''));
      assertEquals(hasBoxDrawing, false);
    });
  }

  await t.step('every box of the home is titled by a heading on its border', async () => {
    const page = await session.open(HOME_EN);
    const untitled = await page.evaluate(
      () =>
        [...document.querySelectorAll('.panel')].filter(
          (panel) => !panel.querySelector(':scope > .panel__title:is(h1, h2, h3, h4, h5, h6)'),
        ).length,
    );
    assertEquals(untitled, 0);
  });
});
