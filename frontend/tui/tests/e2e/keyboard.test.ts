/// <reference lib="dom" />
import type { Page } from '@astral/astral';
import { assert, assertEquals } from '@std/assert';
import { findAccessibilityViolations } from './support/axe.ts';
import { waitToLeave } from './support/navigation.ts';
import { HOME_EN, POST_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

type Key = Parameters<Page['keyboard']['press']>[0];

const WIDE = { width: 1440, height: 900 };
const NARROW = { width: 360, height: 800 };

function describeFocus() {
  const active = document.activeElement as HTMLElement;
  const row = active.closest('li, dd');
  return {
    text: active.textContent?.trim() ?? '',
    panel: active.closest('.grid > .panel')?.id ?? null,
    rowBackground: row ? getComputedStyle(row).backgroundColor : null,
    selection: getComputedStyle(document.documentElement).getPropertyValue('--color-selection-background').trim(),
  };
}

function toRgb(color: string): string {
  const probe = document.createElement('span');
  probe.style.color = color;
  document.body.append(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  return rgb;
}

Deno.test('single-key shortcuts move focus between panels and items', async (t) => {
  await using session = await Session.start();

  await t.step('a digit focuses the first item of that panel, shown in reverse video', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.press('3');
    const focus = await page.evaluate(describeFocus);
    assertEquals(focus.panel, 'projects');
    assertEquals(focus.text, 'Fixture project');
    assertEquals(focus.rowBackground, await page.evaluate(toRgb, { args: [focus.selection] }));
  });

  await t.step('j and k move within the panel and stop at its ends', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.press('8');
    const visited = [(await page.evaluate(describeFocus)).text];
    for (const key of ['j', 'ArrowDown', 'j', 'j', 'k'] as Key[]) {
      await page.keyboard.press(key);
      visited.push((await page.evaluate(describeFocus)).text);
    }
    assertEquals(visited.slice(1), ['contact@example.com', 'GitHub', 'Last.fm', 'Credits', 'Last.fm']);
  });

  await t.step('a panel without links takes the focus itself', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.press('2');
    assertEquals(await page.evaluate(() => document.activeElement?.id), 'now');
  });

  await t.step('shortcuts ignore modifier combinations and typing in a field', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.down('Control');
    await page.keyboard.press('3');
    await page.keyboard.up('Control');
    assertEquals((await page.evaluate(describeFocus)).panel, null);
    await page.evaluate(() => {
      const field = document.createElement('input');
      document.body.append(field);
      field.focus();
    });
    await page.keyboard.press('3');
    assertEquals(await page.evaluate(() => document.activeElement?.tagName), 'INPUT');
  });

  await t.step('digits do nothing on pages without panels', async () => {
    const page = await session.open(POST_EN, { viewport: WIDE });
    await page.keyboard.press('1');
    assertEquals(await page.evaluate(() => document.activeElement?.tagName), 'BODY');
  });
});

Deno.test('help and the shortcut switch', async (t) => {
  await using session = await Session.start();

  await t.step('? opens the help as a modal dialog and Esc closes it', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.press('?');
    assertEquals(await page.evaluate(() => document.querySelector<HTMLDialogElement>('.help')?.open), true);
    await page.keyboard.press('Escape');
    assertEquals(await page.evaluate(() => document.querySelector<HTMLDialogElement>('.help')?.open), false);
  });

  await t.step('the open help passes the accessibility checks in both color schemes', async () => {
    for (const colorScheme of ['light', 'dark'] as const) {
      const page = await session.open(HOME_EN, { viewport: WIDE, colorScheme });
      await page.keyboard.press('?');
      assertEquals(await findAccessibilityViolations(page), []);
    }
  });

  await t.step('turning shortcuts off stops them and survives a reload', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.locator('.keybar__hints [data-action="toggle-shortcuts"]').click();
    await page.reload();
    await page.keyboard.press('3');
    const state = await page.evaluate(() => ({
      focusedPanel: document.activeElement?.closest('.panel')?.id ?? null,
      pressed: document.querySelector('.keybar [data-shortcuts-toggle]')?.getAttribute('aria-pressed'),
    }));
    assertEquals(state, { focusedPanel: null, pressed: 'false' });
    await page.evaluate(() => localStorage.clear());
  });
});

Deno.test('the key bar follows the screen and the page', async (t) => {
  await using session = await Session.start();

  const visibleControls = () =>
    [...document.querySelectorAll<HTMLElement>('.keybar span, .keybar button')]
      .filter((element) => element.checkVisibility())
      .map((element) => element.textContent?.replace(/\s+/g, ' ').trim());

  await t.step('without JavaScript there is no key bar, since there are no shortcuts', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, javascript: false });
    assertEquals(await page.evaluate(visibleControls), []);
  });

  await t.step('wide home: the keys valid on the page, help and the switch', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    assertEquals(await page.evaluate(visibleControls), [
      '1–8 panels',
      'j k move',
      'enter open',
      't theme',
      '? help',
      'Single-key shortcuts',
    ]);
  });

  await t.step('wide inner page: back, help and the switch', async () => {
    const page = await session.open(POST_EN, { viewport: WIDE });
    assertEquals(await page.evaluate(visibleControls), [
      'q back',
      'p n previous / next post',
      't theme',
      '? help',
      'Single-key shortcuts',
    ]);
  });

  await t.step('narrow home: four buttons tall enough to tap, stuck to the bottom', async () => {
    const page = await session.open(HOME_EN, { viewport: NARROW });
    const bar = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll<HTMLElement>('.keybar__buttons button')];
      return {
        labels: buttons.map((button) => button.textContent?.trim()),
        heights: buttons.map((button) => button.getBoundingClientRect().height),
        bottom: document.querySelector('.keybar')?.getBoundingClientRect().bottom,
      };
    });
    assertEquals(bar.labels, ['‹ previous', 'next ›', 't theme', '? help']);
    for (const height of bar.heights) {
      assert(height >= 44, `${height}px is below the 44px touch target`);
    }
    assertEquals(bar.bottom, NARROW.height);
  });

  await t.step('narrow home: next and previous move between panels', async () => {
    const page = await session.open(HOME_EN, { viewport: NARROW });
    const visited: (string | undefined)[] = [];
    for (const button of ['next', 'next', 'previous']) {
      // A pointer click would first scroll the page to the sticky bar, which changes which panel counts as current.
      await page.evaluate(
        (action) => {
          document.querySelector<HTMLElement>(`.keybar__buttons [data-action="${action}-panel"]`)?.click();
        },
        { args: [button] },
      );
      visited.push(await page.evaluate(() => document.activeElement?.id));
    }
    assertEquals(visited, ['now', 'projects', 'now']);
  });
});

Deno.test('the narrow bar of an inner page has a back button beside theme and help', async () => {
  await using session = await Session.start();
  const page = await session.open(POST_EN, { viewport: NARROW });
  const labels = await page.evaluate(() =>
    [...document.querySelectorAll('.keybar__buttons button')].map((button) => button.textContent?.trim()),
  );
  assertEquals(labels, ['‹ back', 't theme', '? help']);
  await page.locator('.keybar__buttons [data-action="back"]').click();
  await waitToLeave(page, POST_EN);
  assertEquals(new URL(page.url).pathname, '/en/posts/');
});
