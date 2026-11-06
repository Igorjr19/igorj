/// <reference lib="dom" />
import { assert, assertEquals } from '@std/assert';
import { findAccessibilityViolations } from './support/axe.ts';
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
  // The drawer slides in; checks wait until it has settled.
  await page.evaluate(() =>
    Promise.all(
      document
        .querySelector('.drawer')
        ?.getAnimations()
        .map((animation) => animation.finished) ?? [],
    ),
  );
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
    await type(page, 'rm -rf');
    assert((await page.evaluate(read)).log.includes('rm: command not found. Type help.'));
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

  await t.step('the open terminal passes the accessibility checks', async () => {
    const page = await openTerminal(session);
    await type(page, 'help');
    assertEquals(await findAccessibilityViolations(page), []);
  });
});
