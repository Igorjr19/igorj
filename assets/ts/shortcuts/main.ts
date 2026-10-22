/// <reference lib="dom" />
import { LANGUAGE_STORAGE_KEY, siteLanguageOf } from '../language/choice.ts';
import { openThemePicker } from '../theme/picker.ts';
import { readShortcutsEnabled, saveShortcutsEnabled } from './preference.ts';
import { actionForKey, isShortcutCandidate, type NavigationTarget, type ShortcutAction, stepIndex } from './rules.ts';

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

/** Follows the page's own link for that direction; pages without one leave the key alone. */
function navigate(target: NavigationTarget): boolean {
  const link = document.querySelector<HTMLAnchorElement>(`[data-nav="${target}"]`);
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
    case 'navigate':
      return navigate(action.target);
    case 'theme':
      openThemePicker();
      return true;
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
  if (!enabled || document.querySelector('dialog[open]') || !isShortcutCandidate(event, editable)) {
    return;
  }
  const action = actionForKey(event.key, panels().length);
  if (action && perform(action)) {
    event.preventDefault();
  }
}

/** Choosing a language with the switcher is remembered, so the root address honors it next time. */
function rememberLanguage(event: MouseEvent): void {
  const link =
    event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('.site-header__languages a') : null;
  const language = siteLanguageOf(link?.hreflang ?? null);
  if (language) {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Storage blocked: the browser language keeps deciding at the root.
    }
  }
}

function onClick(event: MouseEvent): void {
  rememberLanguage(event);
  const control = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-action]') : null;
  switch (control?.dataset['action']) {
    case 'previous-panel':
      showNeighbourPanel(-1);
      break;
    case 'next-panel':
      showNeighbourPanel(1);
      break;
    case 'back':
      navigate('back');
      break;
    case 'help':
      openHelp();
      break;
    case 'print':
      print();
      break;
    case 'theme':
      openThemePicker();
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
