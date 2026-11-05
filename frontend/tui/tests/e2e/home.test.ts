/// <reference lib="dom" />
import { assert, assertAlmostEquals, assertEquals } from '@std/assert';
import { HOME_EN, HOME_PT } from './support/paths.ts';
import { Session } from './support/session.ts';

const PANEL_ORDER = ['about', 'now', 'projects', 'posts', 'reading', 'listening', 'watched', 'system'];
const PROFESSIONAL = ['about', 'now', 'projects', 'posts'];
const COLLAPSIBLE = ['listening', 'watched'];
const WIDE = { width: 1440, height: 900 };
const MEDIUM = { width: 900, height: 900 };
const NARROW = { width: 360, height: 800 };

interface PanelBox {
  readonly id: string;
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly width: number;
}

function readPanels(): { cellHeight: number; columnWidth: number; panels: PanelBox[] } {
  const grid = document.querySelector('.grid') as Element;
  const columns = getComputedStyle(grid).gridTemplateColumns.split(' ');
  return {
    cellHeight: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-height')),
    columnWidth: Number.parseFloat(columns[0] ?? '0'),
    panels: [...grid.children].map((panel) => {
      const box = panel.getBoundingClientRect();
      return { id: panel.id, top: box.top, bottom: box.bottom, left: box.left, width: box.width };
    }),
  };
}

function panel(panels: PanelBox[], id: string): PanelBox {
  const found = panels.find((candidate) => candidate.id === id);
  assert(found, `no panel #${id}`);
  return found;
}

Deno.test('home shows every panel in a fixed order, numbered for its shortcut', async (t) => {
  await using session = await Session.start();

  for (const path of [HOME_EN, HOME_PT]) {
    await t.step(`${path}: the eight panels follow the reading order with shortcuts 1 to 8`, async () => {
      const page = await session.open(path);
      const panels = await page.evaluate(() =>
        [...document.querySelectorAll('.grid > .panel')].map((element) => ({
          id: element.id,
          shortcut: element.querySelector('.panel__shortcut')?.textContent,
        })),
      );
      assertEquals(
        panels.map(({ id }) => id),
        PANEL_ORDER,
      );
      assertEquals(
        panels.map(({ shortcut }) => shortcut),
        ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸'],
      );
    });
  }
});

Deno.test('home layout puts professional panels on top and personal ones below', async (t) => {
  await using session = await Session.start();

  await t.step('wide: professional panels in two rows of two, the other four in one row', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    const { columnWidth, panels } = await page.evaluate(readPanels);
    for (const id of PROFESSIONAL) {
      assertAlmostEquals(panel(panels, id).width, 2 * columnWidth, 0.5, `#${id} should span two columns`);
    }
    assertEquals(panel(panels, 'about').top, panel(panels, 'now').top);
    assertEquals(panel(panels, 'projects').top, panel(panels, 'posts').top);
    const lastRow = ['reading', 'listening', 'watched', 'system'].map((id) => panel(panels, id).top);
    assertEquals(new Set(lastRow).size, 1, 'the four smaller panels share one row');
    assert(lastRow[0] !== undefined && lastRow[0] > panel(panels, 'projects').top);
  });

  await t.step('medium: two equal columns, with the smaller panels in two rows of two', async () => {
    const page = await session.open(HOME_EN, { viewport: MEDIUM });
    const { panels } = await page.evaluate(readPanels);
    assertEquals(new Set(panels.map(({ width }) => width)).size, 1);
    assertEquals(panel(panels, 'reading').top, panel(panels, 'listening').top);
    assertEquals(panel(panels, 'watched').top, panel(panels, 'system').top);
  });

  await t.step('borders of neighbouring panels are one cell apart, across and down', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    const gaps = await page.evaluate(() => {
      const border = (id: string) => {
        const element = document.getElementById(id) as Element;
        const box = element.getBoundingClientRect();
        const frame = getComputedStyle(element, '::before');
        const insetX = (box.width - Number.parseFloat(frame.width)) / 2;
        const insetY = (box.height - Number.parseFloat(frame.height)) / 2;
        return {
          top: box.top + insetY,
          bottom: box.bottom - insetY,
          left: box.left + insetX,
          right: box.right - insetX,
        };
      };
      const root = getComputedStyle(document.documentElement);
      return {
        cellWidth: Number.parseFloat(root.getPropertyValue('--cell-width')),
        cellHeight: Number.parseFloat(root.getPropertyValue('--cell-height')),
        down: border('projects').top - border('about').bottom,
        across: border('now').left - border('about').right,
      };
    });
    assertAlmostEquals(gaps.down, gaps.cellHeight, 3);
    assertAlmostEquals(gaps.across, gaps.cellWidth, 3);
  });
});

Deno.test('music and film panels collapse to a summary line only on narrow screens', async (t) => {
  await using session = await Session.start();

  const state = () =>
    ['listening', 'watched', 'reading'].map((id) => {
      const section = document.getElementById(id) as HTMLElement;
      return {
        id,
        summaryVisible: section.querySelector('summary')?.checkVisibility() ?? false,
        listVisible: section.querySelector('ul, ol')?.checkVisibility() ?? false,
      };
    });

  await t.step('narrow: music and films show only their summary; reading stays open', async () => {
    const page = await session.open(HOME_EN, { viewport: NARROW });
    assertEquals(await page.evaluate(state), [
      { id: 'listening', summaryVisible: true, listVisible: false },
      { id: 'watched', summaryVisible: true, listVisible: false },
      { id: 'reading', summaryVisible: false, listVisible: true },
    ]);
  });

  await t.step('narrow: activating the summary expands the panel', async () => {
    const page = await session.open(HOME_EN, { viewport: NARROW });
    await page.locator('#listening summary').click();
    const [listening] = await page.evaluate(state);
    assertEquals(listening?.listVisible, true);
  });

  await t.step('narrow: works without JavaScript, since details is native', async () => {
    const page = await session.open(HOME_EN, { viewport: NARROW, javascript: false });
    const [listening] = await page.evaluate(state);
    assertEquals(listening, { id: 'listening', summaryVisible: true, listVisible: false });
  });

  for (const viewport of [MEDIUM, WIDE]) {
    await t.step(`${viewport.width}px: every list is visible and no toggle is shown`, async () => {
      const page = await session.open(HOME_EN, { viewport });
      for (const { id, summaryVisible, listVisible } of await page.evaluate(state)) {
        assertEquals(listVisible, true, `#${id} list`);
        assertEquals(summaryVisible, false, `#${id} summary`);
      }
    });
  }

  await t.step('the summary names the first item of the panel', async () => {
    const page = await session.open(HOME_EN, { viewport: NARROW });
    const summaries = await page.evaluate(
      (ids: string[]) => ids.map((id) => document.querySelector(`#${id} summary`)?.textContent?.trim()),
      { args: [COLLAPSIBLE] },
    );
    assertEquals(summaries, ['Fixture Artist', 'Fixture Film']);
  });
});
