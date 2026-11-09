/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { findAccessibilityViolations, settle } from './support/axe.ts';
import { waitToLeave } from './support/navigation.ts';
import { HOME_EN, POSTS_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

const read = () => ({
  open: document.querySelector('.drawer')?.classList.contains('drawer--open') ?? false,
  focused: document.activeElement?.id ?? null,
  mode: document.querySelector('.statusbar__mode')?.textContent ?? null,
  log: [...document.querySelectorAll('.term__line')].map((line) => line.textContent ?? ''),
});

async function openTerminal(session: Session, path = HOME_EN) {
  const page = await session.open(path, { viewport: WIDE });
  await page.keyboard.press(':');
  await page.waitForFunction(() => document.querySelector('.drawer--open') !== null);
  // The panel slides up as it opens; clicks and measurements wait until it is in place.
  await settle(page);
  return page;
}

async function type(page: Awaited<ReturnType<typeof openTerminal>>, command: string) {
  await page.keyboard.type(command);
  await page.keyboard.press('Enter');
}

Deno.test('the terminal opens with : and answers from the content of the page language', async (t) => {
  await using session = await Session.start();

  await t.step('nothing of it loads before it is asked for', async () => {
    const page = await session.open(HOME_EN, { viewport: WIDE });
    const loaded = await page.evaluate(() => ({
      drawer: document.querySelector('.drawer'),
      scripts: [...document.scripts].filter((script) => script.src.includes('terminal')).length,
    }));
    assertEquals(loaded, { drawer: null, scripts: 0 });
  });

  await t.step(': drops the drawer, focuses the prompt and switches the mode', async () => {
    const page = await openTerminal(session);
    const state = await page.evaluate(read);
    assertEquals([state.open, state.focused, state.mode], [true, 'terminal-input', 'TERMINAL']);
  });

  await t.step('the visitor is a guest, and a click anywhere in the panel goes back to the prompt', async () => {
    const page = await openTerminal(session);
    await type(page, 'help');
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.locator('.term__log').click();
    const state = await page.evaluate(() => ({
      prompt: document.querySelector('.term__prompt')?.textContent,
      title: document.querySelector('.drawer__title')?.textContent,
      focused: document.activeElement?.id,
    }));
    assertEquals(state, { prompt: 'guest@igorj:~$', title: 'terminal · guest@igorj', focused: 'terminal-input' });
  });

  await t.step('ls, cd and cat walk the site as folders and files', async () => {
    const page = await openTerminal(session);
    await type(page, 'ls');
    await type(page, 'cd posts');
    await type(page, 'cat film-post.md');
    const { log } = await page.evaluate(read);
    assert(log.some((line) => line.includes('posts/') && line.includes('about.txt')));
    assert(log.includes('# Film fixture post'));
    assert(log.includes('Film post body.'));
  });

  await t.step('tab completes a command and a file', async () => {
    const page = await openTerminal(session);
    await page.keyboard.type('ca');
    await page.keyboard.press('Tab');
    await page.keyboard.type('ab');
    await page.keyboard.press('Tab');
    assertEquals(
      await page.evaluate(() => document.querySelector<HTMLInputElement>('#terminal-input')?.value),
      'cat about.txt ',
    );
  });

  await t.step('an unknown command says so', async () => {
    const page = await openTerminal(session);
    await type(page, 'frobnicate');
    assert((await page.evaluate(read)).log.includes('frobnicate: command not found. Type help.'));
  });
});

Deno.test('the terminal acts on the window and steps aside', async (t) => {
  await using session = await Session.start();

  await t.step('open leads the window to the page', async () => {
    const page = await openTerminal(session);
    await type(page, 'open posts');
    await waitToLeave(page, HOME_EN);
    assertEquals(new URL(page.url).pathname, POSTS_EN);
  });

  await t.step('theme changes the theme and accent, and keeps them', async () => {
    const page = await openTerminal(session);
    await type(page, 'theme frappe peach');
    const theme = await page.evaluate(() => ({
      theme: document.documentElement.dataset['theme'],
      accent: document.documentElement.dataset['accent'],
      saved: localStorage.getItem('theme'),
    }));
    assertEquals(theme, {
      theme: 'catppuccin-frappe',
      accent: 'peach',
      saved: '{"theme":"catppuccin-frappe","accent":"peach"}',
    });
    await page.evaluate(() => localStorage.clear());
  });

  await t.step('Esc closes it and gives the focus back to the pane; : opens it again', async () => {
    const page = await openTerminal(session);
    await page.keyboard.press('Escape');
    const closed = await page.evaluate(read);
    assertEquals([closed.open, closed.focused, closed.mode], [false, 'pane', 'NORMAL']);
    await page.keyboard.press(':');
    assertEquals((await page.evaluate(read)).open, true);
  });

  await t.step('the close button next to the keys closes it as Esc does', async () => {
    const page = await openTerminal(session);
    await page.locator('.drawer__close').click();
    const closed = await page.evaluate(read);
    assertEquals([closed.open, closed.focused, closed.mode], [false, 'pane', 'NORMAL']);
  });

  await t.step('the open terminal passes the accessibility checks', async () => {
    const page = await openTerminal(session);
    await type(page, 'help');
    assertEquals(await findAccessibilityViolations(page), []);
  });
});

Deno.test('the terminal is a panel at the foot of the content, as tall as the visitor leaves it', async (t) => {
  await using session = await Session.start();

  await t.step('it opens under the pane, inside the content column, with the side column still there', async () => {
    const page = await openTerminal(session);
    const boxes = await page.evaluate(() => {
      const edge = (selector: string) => {
        const { top, bottom, left } = (document.querySelector(selector) as HTMLElement).getBoundingClientRect();
        return { top, bottom, left };
      };
      return { pane: edge('.pane'), drawer: edge('.drawer'), side: edge('.side') };
    });
    assert(boxes.drawer.top >= boxes.pane.bottom - 1, 'the panel starts where the pane ends');
    assert(boxes.drawer.left > boxes.side.left, 'the panel sits in the content column');
  });

  await t.step('the prompt follows the last line of output instead of staying at the bottom', async () => {
    const page = await openTerminal(session);
    const gap = await page.evaluate(() => {
      const lines = document.querySelectorAll('.term__line');
      const last = lines[lines.length - 1]?.getBoundingClientRect().bottom ?? 0;
      const form = document.querySelector('.term__form')?.getBoundingClientRect().top ?? 0;
      return form - last;
    });
    assert(gap >= 0 && gap < 4, `${gap}px between the output and the prompt`);
  });

  await t.step('the arrows on its top edge change the height, which is kept', async () => {
    const page = await openTerminal(session);
    const height = () => document.querySelector('.drawer')?.getBoundingClientRect().height ?? 0;
    const before = await page.evaluate(height);
    await page.evaluate(() => document.querySelector<HTMLElement>('.drawer__handle')?.focus());
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)));
    const after = await page.evaluate(height);
    assert(after > before, `${before}px became ${after}px`);
    assertEquals(await page.evaluate(() => localStorage.getItem('terminal-height')), '0.55');
    await page.evaluate(() => localStorage.clear());
  });
});
