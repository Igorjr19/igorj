/// <reference lib="dom" />
import { assertEquals } from '@std/assert';
import { findAccessibilityViolations } from './support/axe.ts';
import { POST_EN, SECOND_POST_EN } from './support/paths.ts';
import { Session } from './support/session.ts';

const WIDE = { width: 1440, height: 900 };

Deno.test('a long post opens with its sections, which fold away', async (t) => {
  await using session = await Session.start();

  const contents = () => {
    const toc = document.querySelector<HTMLDetailsElement>('details.toc');
    return toc
      ? {
          open: toc.open,
          title: toc.querySelector('summary')?.textContent,
          links: [...toc.querySelectorAll('a')].map((link) => [link.textContent, link.getAttribute('href')]),
        }
      : null;
  };

  await t.step('three sections or more list them first, subsections under theirs, open', async () => {
    const page = await session.open(SECOND_POST_EN, { viewport: WIDE, javascript: false });
    assertEquals(await page.evaluate(contents), {
      open: true,
      title: 'Contents',
      links: [
        ['First section', '#first-section'],
        ['Second section', '#second-section'],
        ['A subsection', '#a-subsection'],
        ['Third section', '#third-section'],
      ],
    });
  });

  await t.step('a short post goes straight to the text', async () => {
    const page = await session.open(POST_EN, { viewport: WIDE });
    assertEquals(await page.evaluate(contents), null);
  });
});

Deno.test('code in a post has a button that copies it as written', async (t) => {
  await using session = await Session.start();

  const button = () => {
    const copy = document.querySelector<HTMLButtonElement>('.code-block__copy');
    return { shown: copy?.checkVisibility() ?? false, label: copy?.textContent };
  };

  await t.step('without JavaScript there is no button that would do nothing', async () => {
    const page = await session.open(SECOND_POST_EN, { viewport: WIDE, javascript: false });
    assertEquals((await page.evaluate(button)).shown, false);
  });

  await t.step('a click copies the code and the button says so for a moment', async () => {
    const page = await session.open(SECOND_POST_EN, { viewport: WIDE });
    // The test stands in for the clipboard and keeps what it receives on the page.
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: (text: string) => {
            document.body.dataset['copied'] = text;
            return Promise.resolve();
          },
        },
      });
    });
    assertEquals(await page.evaluate(button), { shown: true, label: 'copy' });
    await page.locator('.code-block__copy').click();
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)));
    assertEquals(await page.evaluate(button), { shown: true, label: 'copied' });
    assertEquals(await page.evaluate(() => document.body.dataset['copied']), 'echo "copied as written"');
  });

  await t.step('the post with its contents and button passes the accessibility checks', async () => {
    const page = await session.open(SECOND_POST_EN, { viewport: WIDE });
    assertEquals(await findAccessibilityViolations(page), []);
  });
});
