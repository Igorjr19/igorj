import { assertEquals } from '@std/assert';
import { actionForKey, isShortcutCandidate, type KeyEventLike, stepIndex } from '../../../assets/ts/shortcuts/rules.ts';

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

Deno.test('actionForKey maps digits to existing panels only', () => {
  assertEquals(actionForKey('1', 8), { kind: 'panel', index: 0 });
  assertEquals(actionForKey('8', 8), { kind: 'panel', index: 7 });
  assertEquals(actionForKey('9', 8), null);
  assertEquals(actionForKey('0', 8), null);
});

Deno.test('actionForKey moves with j, k and the arrows only where there are panels, so arrows still scroll elsewhere', () => {
  assertEquals(actionForKey('j', 8), { kind: 'move', step: 1 });
  assertEquals(actionForKey('ArrowDown', 8), { kind: 'move', step: 1 });
  assertEquals(actionForKey('k', 8), { kind: 'move', step: -1 });
  assertEquals(actionForKey('ArrowUp', 8), { kind: 'move', step: -1 });
  assertEquals(actionForKey('ArrowDown', 0), null);
  assertEquals(actionForKey('1', 0), null);
});

Deno.test('actionForKey navigates with q, n and p on any page, since pages without that link ignore the key', () => {
  assertEquals(actionForKey('q', 0), { kind: 'navigate', target: 'back' });
  assertEquals(actionForKey('n', 0), { kind: 'navigate', target: 'next' });
  assertEquals(actionForKey('p', 0), { kind: 'navigate', target: 'previous' });
  assertEquals(actionForKey('Q', 0), null);
});

Deno.test('actionForKey opens the theme picker with t on every page', () => {
  assertEquals(actionForKey('t', 0), { kind: 'theme' });
  assertEquals(actionForKey('t', 8), { kind: 'theme' });
});

Deno.test('actionForKey opens the help on every page and leaves / and quote alone', () => {
  assertEquals(actionForKey('?', 0), { kind: 'help' });
  assertEquals(actionForKey('/', 8), null);
  assertEquals(actionForKey("'", 8), null);
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
