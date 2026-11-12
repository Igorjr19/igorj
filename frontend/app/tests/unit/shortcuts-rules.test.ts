import { assertEquals } from '@std/assert';
import { actionForKey, isShortcutCandidate, type KeyEventLike, stepIndex } from '../../src/lib/shortcuts/rules.ts';

const PLAIN: KeyEventLike = {
  key: 'j',
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  isComposing: false,
  defaultPrevented: false,
};

Deno.test('isShortcutCandidate accepts a plain key press, including Shift for ?', () => {
  assertEquals(isShortcutCandidate(PLAIN, false), true);
  assertEquals(isShortcutCandidate({ ...PLAIN, key: '?' }, false), true);
});

Deno.test('isShortcutCandidate ignores modifier combinations, which belong to the browser and the system', () => {
  assertEquals(isShortcutCandidate({ ...PLAIN, ctrlKey: true }, false), false);
  assertEquals(isShortcutCandidate({ ...PLAIN, altKey: true }, false), false);
  assertEquals(isShortcutCandidate({ ...PLAIN, metaKey: true }, false), false);
});

Deno.test('isShortcutCandidate ignores typing: text fields, IME composition and handled events', () => {
  assertEquals(isShortcutCandidate(PLAIN, true), false);
  assertEquals(isShortcutCandidate({ ...PLAIN, isComposing: true }, false), false);
  assertEquals(isShortcutCandidate({ ...PLAIN, defaultPrevented: true }, false), false);
});

Deno.test('actionForKey maps digits to existing panes only', () => {
  assertEquals(actionForKey('1', 6, false), { kind: 'pane', index: 0 });
  assertEquals(actionForKey('6', 6, false), { kind: 'pane', index: 5 });
  assertEquals(actionForKey('7', 6, false), null);
  assertEquals(actionForKey('0', 6, false), null);
});

Deno.test('actionForKey moves with j, k and the arrows only where there are items, so arrows still scroll elsewhere', () => {
  assertEquals(actionForKey('j', 6, true), { kind: 'move', step: 1 });
  assertEquals(actionForKey('ArrowDown', 6, true), { kind: 'move', step: 1 });
  assertEquals(actionForKey('k', 6, true), { kind: 'move', step: -1 });
  assertEquals(actionForKey('ArrowUp', 6, true), { kind: 'move', step: -1 });
  assertEquals(actionForKey('ArrowDown', 6, false), null);
  assertEquals(actionForKey('1', 0, false), null);
});

Deno.test('actionForKey goes back with q or h and moves between posts with n and p, since pages without that link ignore the key', () => {
  assertEquals(actionForKey('q', 0, false), { kind: 'navigate', target: 'back' });
  assertEquals(actionForKey('h', 0, false), { kind: 'navigate', target: 'back' });
  assertEquals(actionForKey('n', 0, false), { kind: 'navigate', target: 'next' });
  assertEquals(actionForKey('p', 0, false), { kind: 'navigate', target: 'previous' });
  assertEquals(actionForKey('Q', 0, false), null);
});

Deno.test('actionForKey switches the list view with v and zooms the pane with z', () => {
  assertEquals(actionForKey('v', 6, true), { kind: 'view' });
  assertEquals(actionForKey('z', 6, false), { kind: 'zoom' });
});

Deno.test('actionForKey opens the theme picker with t on every page', () => {
  assertEquals(actionForKey('t', 0, false), { kind: 'theme' });
  assertEquals(actionForKey('t', 6, true), { kind: 'theme' });
});

Deno.test('actionForKey opens the help on every page and leaves / and quote alone', () => {
  assertEquals(actionForKey('?', 0, false), { kind: 'help' });
  assertEquals(actionForKey('/', 6, true), null);
  assertEquals(actionForKey("'", 6, true), null);
});

Deno.test('stepIndex stops at both ends instead of wrapping around', () => {
  assertEquals(stepIndex(0, -1, 3), 0);
  assertEquals(stepIndex(2, 1, 3), 2);
  assertEquals(stepIndex(1, 1, 3), 2);
});

Deno.test('stepIndex starts at the first item when nothing is selected yet', () => {
  assertEquals(stepIndex(-1, 1, 3), 0);
  assertEquals(stepIndex(-1, -1, 3), 0);
  assertEquals(stepIndex(-1, 1, 0), -1);
});
