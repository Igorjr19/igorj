/// <reference lib="dom" />
import { LANGUAGE_STORAGE_KEY, siteLanguageOf } from '../language/choice.ts';
import { browserStorage } from '../shared/storage.ts';
import { openThemePicker, renderThemeStatus } from '../theme/picker.ts';
import { readShortcutsEnabled, saveShortcutsEnabled } from './preference.ts';
import { actionForKey, isShortcutCandidate, type NavigationTarget, type ShortcutAction, stepIndex } from './rules.ts';

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
/** The rows j and k move through: list items on list pages, the recent rows on the home. */
const ITEMS = '.item__link, .recent__row';

function panes(): HTMLAnchorElement[] {
  return [...document.querySelectorAll<HTMLAnchorElement>('.side__panes a[data-pane]')];
}

function items(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(ITEMS)].filter((item) => item.checkVisibility());
}

function currentPaneIndex(): number {
  return panes().findIndex((link) => link.hasAttribute('aria-current'));
}

/** The pane already open gets the focus on its first item; any other pane is opened. */
function openPane(index: number): void {
  const link = panes()[index];
  if (!link) {
    return;
  }
  if (link.getAttribute('aria-current') === 'page') {
    (items()[0] ?? document.getElementById('pane'))?.focus();
  } else {
    link.click();
  }
}

function move(step: 1 | -1): boolean {
  const all = items();
  const target = all[stepIndex(all.indexOf(document.activeElement as HTMLElement), step, all.length)];
  target?.focus();
  target?.scrollIntoView({ block: 'nearest' });
  return target !== undefined;
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
    case 'pane':
      openPane(action.index);
      return true;
    case 'move':
      return move(action.step);
    case 'navigate':
      return navigate(action.target);
    case 'view':
      document.dispatchEvent(new Event('items:toggle-view'));
      return document.querySelector('[data-items]') !== null;
    case 'zoom':
      document.body.classList.toggle('is-zoomed');
      return true;
    case 'theme':
      openThemePicker();
      return true;
    case 'help':
      openHelp();
      return true;
  }
}

let enabled = readShortcutsEnabled(browserStorage('localStorage') ?? { getItem: () => null });

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
  const action = actionForKey(event.key, panes().length, items().length > 0);
  if (action && perform(action)) {
    event.preventDefault();
  }
}

/** Choosing a language with the switcher is remembered, so the root address honors it next time. */
function rememberLanguage(event: MouseEvent): void {
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('.win__languages a') : null;
  const language = siteLanguageOf(link?.hreflang ?? null);
  if (language) {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Storage blocked: the browser language keeps deciding at the root.
    }
  }
}

function neighbourPane(step: 1 | -1): void {
  const all = panes();
  const current = currentPaneIndex();
  all[(current + step + all.length) % all.length]?.click();
}

function onClick(event: MouseEvent): void {
  rememberLanguage(event);
  const control = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-action]') : null;
  switch (control?.dataset['action']) {
    case 'previous-pane':
      neighbourPane(-1);
      break;
    case 'next-pane':
      neighbourPane(1);
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

renderEnabled();
renderThemeStatus();
for (const element of document.querySelectorAll('[data-script-only]')) {
  element.removeAttribute('hidden');
}
document.addEventListener('keydown', onKeydown);
document.addEventListener('click', onClick);
