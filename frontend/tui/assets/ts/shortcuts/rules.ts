export interface KeyEventLike {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly isComposing: boolean;
  readonly defaultPrevented: boolean;
}

export type NavigationTarget = 'back' | 'next' | 'previous';

export type ShortcutAction =
  | { readonly kind: 'pane'; readonly index: number }
  | { readonly kind: 'move'; readonly step: 1 | -1 }
  | { readonly kind: 'navigate'; readonly target: NavigationTarget }
  | { readonly kind: 'view' }
  | { readonly kind: 'zoom' }
  | { readonly kind: 'theme' }
  | { readonly kind: 'terminal' }
  | { readonly kind: 'help' };

/** Single-key shortcuts must never fire while someone types or uses a browser or system combination. */
export function isShortcutCandidate(event: KeyEventLike, targetIsEditable: boolean): boolean {
  return !(
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.isComposing ||
    event.defaultPrevented ||
    targetIsEditable
  );
}

const KEY_ACTIONS: ReadonlyMap<string, ShortcutAction> = new Map([
  ['j', { kind: 'move', step: 1 }],
  ['ArrowDown', { kind: 'move', step: 1 }],
  ['k', { kind: 'move', step: -1 }],
  ['ArrowUp', { kind: 'move', step: -1 }],
  ['q', { kind: 'navigate', target: 'back' }],
  ['h', { kind: 'navigate', target: 'back' }],
  ['n', { kind: 'navigate', target: 'next' }],
  ['p', { kind: 'navigate', target: 'previous' }],
  ['v', { kind: 'view' }],
  ['z', { kind: 'zoom' }],
  ['t', { kind: 'theme' }],
  [':', { kind: 'terminal' }],
  ['`', { kind: 'terminal' }],
  ['?', { kind: 'help' }],
]);

/** What a key does on a page with `paneCount` panes; moving needs a list of items, so elsewhere the arrows keep scrolling. */
export function actionForKey(key: string, paneCount: number, hasItems: boolean): ShortcutAction | null {
  if (/^[1-9]$/.test(key)) {
    const index = Number(key) - 1;
    return index < paneCount ? { kind: 'pane', index } : null;
  }
  const action = KEY_ACTIONS.get(key) ?? null;
  return action?.kind === 'move' && !hasItems ? null : action;
}

/** Moves within a list without wrapping; from no selection, either direction starts at the first item. */
export function stepIndex(current: number, step: 1 | -1, length: number): number {
  if (length === 0) {
    return -1;
  }
  if (current < 0) {
    return 0;
  }
  return Math.min(Math.max(current + step, 0), length - 1);
}
