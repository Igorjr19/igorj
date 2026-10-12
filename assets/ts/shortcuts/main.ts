/// <reference lib="dom" />
import { readShortcutsEnabled, saveShortcutsEnabled } from './preference.ts';
import { actionForKey, isShortcutCandidate, type ShortcutAction, stepIndex } from './rules.ts';

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

function panels(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('.grid > .panel')];
}

/** One focus target per row; rows without a link cannot be opened, so they are skipped. */
function itemsOf(panel: Element): HTMLElement[] {
  return [...panel.querySelectorAll(':scope .panel__summary, :scope li, :scope dd, :scope > p')].flatMap((row) => {
    const target = row.matches('summary') ? row : row.querySelector('a');
    return target instanceof HTMLElement && target.checkVisibility() ? [target] : [];
  });
}

function currentPanelIndex(): number {
  const all = panels();
  const focused = document.activeElement?.closest('.grid > .panel');
  if (focused) {
    return all.indexOf(focused as HTMLElement);
  }
  return all.findIndex((panel) => panel.getBoundingClientRect().bottom > 1);
}

function focusPanel(index: number): void {
  const panel = panels()[index];
  if (panel) {
    (itemsOf(panel)[0] ?? panel).focus();
  }
}

function moveWithinPanel(step: 1 | -1): boolean {
  const panel = document.activeElement?.closest('.grid > .panel');
  if (!panel) {
    return false;
  }
  const items = itemsOf(panel);
  items[stepIndex(items.indexOf(document.activeElement as HTMLElement), step, items.length)]?.focus();
  return true;
}

function showNeighbourPanel(step: 1 | -1): void {
  const all = panels();
  const panel = all[stepIndex(currentPanelIndex(), step, all.length)];
  panel?.focus({ preventScroll: true });
  panel?.scrollIntoView({ block: 'start' });
}

function openHelp(): void {
  document.querySelector<HTMLDialogElement>('.help')?.showModal();
}

/** The path bar's link to the parent page; the home has none, so there the key is left alone. */
function goBack(): boolean {
  const link = document.querySelector<HTMLAnchorElement>('.zoom__back');
  link?.click();
  return link !== null;
}

function perform(action: ShortcutAction): boolean {
  switch (action.kind) {
    case 'panel':
      focusPanel(action.index);
      return true;
    case 'move':
      return moveWithinPanel(action.step);
    case 'back':
      return goBack();
    case 'help':
      openHelp();
      return true;
  }
}

function storage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

let enabled = readShortcutsEnabled(storage() ?? { getItem: () => null });

function renderEnabled(): void {
  document.documentElement.dataset['shortcuts'] = enabled ? 'on' : 'off';
  for (const toggle of document.querySelectorAll('[data-shortcuts-toggle]')) {
    toggle.setAttribute('aria-pressed', String(enabled));
  }
}

function onKeydown(event: KeyboardEvent): void {
  const editable = event.target instanceof Element && event.target.closest(EDITABLE) !== null;
  if (!enabled || document.querySelector('.help[open]') || !isShortcutCandidate(event, editable)) {
    return;
  }
  const action = actionForKey(event.key, panels().length);
  if (action && perform(action)) {
    event.preventDefault();
  }
}

function onClick(event: MouseEvent): void {
  const control = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-action]') : null;
  switch (control?.dataset['action']) {
    case 'previous-panel':
      showNeighbourPanel(-1);
      break;
    case 'next-panel':
      showNeighbourPanel(1);
      break;
    case 'help':
      openHelp();
      break;
    case 'toggle-shortcuts':
      enabled = !enabled;
      try {
        saveShortcutsEnabled(localStorage, enabled);
      } catch {
        // Storage blocked: the choice lasts until the page closes.
      }
      renderEnabled();
      break;
  }
}

// Pressing a bar button keeps the focus in the panel, so previous and next count from where the visitor was.
function onPointerDown(event: PointerEvent): void {
  if (event.target instanceof Element && event.target.closest('.keybar__buttons button')) {
    event.preventDefault();
  }
}

renderEnabled();
for (const element of document.querySelectorAll('[data-script-only]')) {
  element.removeAttribute('hidden');
}
document.querySelector('.keybar')?.removeAttribute('hidden');
document.addEventListener('pointerdown', onPointerDown);
document.addEventListener('keydown', onKeydown);
document.addEventListener('click', onClick);
