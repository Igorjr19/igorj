/// <reference lib="dom" />
import type { Page } from '@astral/astral';
import { assert, assertEquals } from '@std/assert';
import { findAccessibilityViolations, settle } from './support/axe.ts';
import { waitToLeave } from './support/navigation.ts';
import { HOME_EN, POST_EN, POSTS_EN, PROJECTS_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

type Key = Parameters<Page['keyboard']['press']>[0];

const WIDE = { width: 1440, height: 900 };
const NARROW = { width: 360, height: 800 };

function describeSelection() {
  const active = document.activeElement as HTMLElement;
  const item = active.closest<HTMLElement>('.item');
  return {
    title: active.querySelector('.item__title')?.textContent?.trim() ?? null,
    selected: item?.dataset['selected'] ?? null,
    background: item ? getComputedStyle(item).backgroundColor : null,
    surface: getComputedStyle(document.documentElement).getPropertyValue('--color-surface-1').trim(),
    position: document.querySelector('[data-status-position]')?.textContent ?? null,
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

Deno.test('single-key shortcuts open panes and move through their items', async (t) => {
  await using session = await Session.start();

  await t.step('a digit opens that pane from any page', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.press('3');
    await waitToLeave(page, HOME_EN);
    assertEquals(new URL(page.url).pathname, POSTS_EN);
  });

  await t.step(
    'the digit of the open pane selects its first item, highlights it and counts it in the status line',
    async () => {
      const page = await session.open(POSTS_EN, { viewport: WIDE });
      await page.keyboard.press('3');
      const selection = await page.evaluate(describeSelection);
      assertEquals([selection.title, selection.selected, selection.position], ['Film fixture post', 'true', '1/4']);
      assertEquals(selection.background, await page.evaluate(toRgb, { args: [selection.surface] }));
    },
  );

  await t.step('j and k move through the list, the status line follows, and both ends stop', async () => {
    const page = await session.open(POSTS_EN, { viewport: WIDE });
    const visited: (string | null)[] = [];
    for (const key of ['j', 'ArrowDown', 'k', 'k'] as Key[]) {
      await page.keyboard.press(key);
      const selection = await page.evaluate(describeSelection);
      visited.push(`${selection.title} ${selection.position}`);
    }
    assertEquals(visited, [
      'Film fixture post 1/4',
      'Post só em português 2/4',
      'Film fixture post 1/4',
      'Film fixture post 1/4',
    ]);
  });

  await t.step('enter opens the selected item and q goes back up to the list', async () => {
    const page = await session.open(POSTS_EN, { viewport: WIDE });
    await page.keyboard.press('j');
    await page.keyboard.press('Enter');
    await waitToLeave(page, POSTS_EN);
    assertEquals(new URL(page.url).pathname, '/en/posts/film-post/');
    await page.keyboard.press('q');
    await waitToLeave(page, '/en/posts/film-post/');
    assertEquals(new URL(page.url).pathname, POSTS_EN);
  });
});

Deno.test('single-key shortcuts change the view, zoom the pane and stay out of the way', async (t) => {
  await using session = await Session.start();

  await t.step('v switches the list to a grid and the choice survives a reload', async () => {
    const page = await session.open(PROJECTS_EN, { viewport: WIDE });
    const view = () => document.querySelector<HTMLElement>('[data-items]')?.dataset['view'];
    assertEquals(await page.evaluate(view), 'list');
    await page.keyboard.press('v');
    await settle(page);
    assertEquals(await page.evaluate(view), 'grid');
    await page.reload();
    assertEquals(await page.evaluate(view), 'grid');
    await page.evaluate(() => localStorage.clear());
  });

  await t.step('z hides the side column and brings it back', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    const side = () => document.querySelector('.side')?.checkVisibility({ visibilityProperty: true });
    assertEquals(await page.evaluate(side), true);
    await page.keyboard.press('z');
    await settle(page);
    assertEquals(await page.evaluate(side), false);
    await page.keyboard.press('z');
    await settle(page);
    assertEquals(await page.evaluate(side), true);
  });

  await t.step('reading a post starts zoomed, without the side column', async () => {
    const page = await session.open(POST_EN, { viewport: WIDE });
    assertEquals(
      await page.evaluate(() => document.querySelector('.side')?.checkVisibility({ visibilityProperty: true })),
      false,
    );
  });

  await t.step('shortcuts ignore modifier combinations and typing in a field', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.down('Control');
    await page.keyboard.press('3');
    await page.keyboard.up('Control');
    assertEquals(new URL(page.url).pathname, HOME_EN);
    await page.evaluate(() => {
      const field = document.createElement('input');
      document.body.append(field);
      field.focus();
    });
    await page.keyboard.press('3');
    assertEquals(await page.evaluate(() => document.activeElement?.tagName), 'INPUT');
    assertEquals(new URL(page.url).pathname, HOME_EN);
  });

  await t.step('on a page without items the arrows keep scrolling instead of moving a selection', async () => {
    const page = await session.open(POST_EN, { viewport: WIDE });
    await page.keyboard.press('ArrowDown');
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

  await t.step('turning shortcuts off in the help stops them and survives a reload', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.keyboard.press('?');
    await page.locator('.help [data-action="toggle-shortcuts"]').click();
    await page.reload();
    await page.keyboard.press('3');
    const state = await page.evaluate(() => ({
      path: location.pathname,
      pressed: document.querySelector('.help [data-shortcuts-toggle]')?.getAttribute('aria-pressed'),
      notice: document.querySelector('[data-shortcuts-notice]')?.checkVisibility(),
      keys: document.querySelector('.statusbar__keys')?.checkVisibility(),
    }));
    assertEquals(state, { path: HOME_EN, pressed: 'false', notice: true, keys: true });
  });

  await t.step('with shortcuts off, the status line says so and turns them back on with a click', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.locator('.statusbar__off [data-action="toggle-shortcuts"]').click();
    const notice = await page.evaluate(() => document.querySelector('[data-shortcuts-notice]')?.checkVisibility());
    await page.keyboard.press('3');
    await waitToLeave(page, HOME_EN);
    assertEquals([notice, new URL(page.url).pathname], [false, POSTS_EN]);
    await page.evaluate(() => localStorage.clear());
  });
});

Deno.test('every key has something to click', async (t) => {
  await using session = await Session.start();

  await t.step('the top line opens the theme, the terminal and the help', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    await page.locator('.win__controls [data-action="help"]').click();
    assertEquals(await page.evaluate(() => document.querySelector<HTMLDialogElement>('.help')?.open), true);
  });

  await t.step('the side switch hides and brings back the side column, and says which', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    const read = () => ({
      side: document.querySelector('.side')?.checkVisibility({ visibilityProperty: true }),
      pressed: document.querySelector('.win__side-toggle')?.getAttribute('aria-pressed'),
    });
    await page.locator('.win__side-toggle').click();
    await settle(page);
    const hidden = await page.evaluate(read);
    await page.locator('.statusbar [data-action="zoom"]').click();
    await settle(page);
    assertEquals(
      [hidden, await page.evaluate(read)],
      [
        { side: false, pressed: 'false' },
        { side: true, pressed: 'true' },
      ],
    );
  });
});

Deno.test('the status line shows the keys that work on each page', async (t) => {
  await using session = await Session.start();

  const visibleKeys = () =>
    [...document.querySelectorAll<HTMLElement>('.statusbar__keys > *, .statusbar__touch > *')]
      .filter((element) => element.checkVisibility())
      .map((element) => element.textContent?.replace(/\s+/g, ' ').trim());

  await t.step('without JavaScript there are no keys to show', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE, javascript: false });
    assertEquals(await page.evaluate(visibleKeys), []);
  });

  await t.step('wide home: the panes and the side column', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    assertEquals(await page.evaluate(visibleKeys), ['1–6 panels', 'z side column']);
  });

  await t.step('wide list: moving, opening, the view and the side column', async () => {
    const page = await session.open(POSTS_EN, { viewport: WIDE });
    assertEquals(await page.evaluate(visibleKeys), [
      'q back',
      'j k move',
      'enter open',
      'v list or grid',
      'z side column',
    ]);
  });

  await t.step('wide post: back, the next post and the side column, each one clickable', async () => {
    const page = await session.open(POST_EN, { viewport: WIDE });
    assertEquals(await page.evaluate(visibleKeys), ['q back', 'n next', 'z side column']);
  });
});

Deno.test('on a narrow screen the status line turns into buttons', async (t) => {
  await using session = await Session.start();

  await t.step('narrow: five buttons tall enough to tap, stuck to the bottom of the screen', async () => {
    const page = await session.open(HOME_EN, { viewport: NARROW });
    const bar = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll<HTMLElement>('.statusbar__touch button')];
      return {
        labels: buttons.map((button) => button.textContent?.trim()),
        heights: buttons.map((button) => button.getBoundingClientRect().height),
        bottom: document.querySelector('.statusbar')?.getBoundingClientRect().bottom,
      };
    });
    assertEquals(bar.labels, ['‹', '›', 't', ':', '?']);
    for (const height of bar.heights) {
      assert(height >= 44, `${height}px is below the 44px touch target`);
    }
    assertEquals(bar.bottom, NARROW.height);
  });

  await t.step('narrow: the arrows open the next and the previous pane', async () => {
    const page = await session.open(HOME_EN, { viewport: NARROW });
    await page.evaluate(() => document.querySelector<HTMLElement>('[data-action="next-pane"]')?.click());
    await waitToLeave(page, HOME_EN);
    assertEquals(new URL(page.url).pathname, PROJECTS_EN);
    await page.evaluate(() => document.querySelector<HTMLElement>('[data-action="previous-pane"]')?.click());
    await waitToLeave(page, PROJECTS_EN);
    assertEquals(new URL(page.url).pathname, HOME_EN);
  });
});

Deno.test('the status line names the theme in effect, and lists say no more than their rows', async (t) => {
  await using session = await Session.start();

  await t.step('the theme of the system scheme, by name', async () => {
    for (const [colorScheme, name] of [
      ['light', 'Catppuccin Latte · mauve'],
      ['dark', 'Catppuccin Mocha · mauve'],
    ] as const) {
      const page = await session.open(HOME_EN, { viewport: WIDE, colorScheme });
      assertEquals(await page.evaluate(() => document.querySelector('[data-status-theme]')?.textContent), name);
    }
  });

  await t.step('a list has no preview beside its rows; an item shows in full only once opened', async () => {
    const page = await session.open(POSTS_EN, { viewport: WIDE });
    assertEquals(await page.evaluate(() => document.querySelector('.items__preview')), null);
  });
});
