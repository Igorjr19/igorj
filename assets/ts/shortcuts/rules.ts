export interface KeyEventLike {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly isComposing: boolean;
  readonly defaultPrevented: boolean;
}

export type ShortcutAction =
  | { readonly kind: 'panel'; readonly index: number }
  | { readonly kind: 'move'; readonly step: 1 | -1 }
  | { readonly kind: 'back' }
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
  ['q', { kind: 'back' }],
  ['?', { kind: 'help' }],
]);

export function actionForKey(key: string, panelCount: number): ShortcutAction | null {
  if (/^[1-9]$/.test(key)) {
    const index = Number(key) - 1;
    return index < panelCount ? { kind: 'panel', index } : null;
  }
  const action = KEY_ACTIONS.get(key) ?? null;
  // Without panels the arrows keep scrolling the page.
  return action?.kind === 'move' && panelCount === 0 ? null : action;
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
