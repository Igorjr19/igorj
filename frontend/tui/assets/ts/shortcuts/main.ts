/// <reference lib="dom" />
import { LANGUAGE_STORAGE_KEY, siteLanguageOf } from '../language/choice.ts';
import { browserStorage } from '../shared/storage.ts';
import { renderThemeStatus } from '../theme/status.ts';
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

const loaded = new Set<string>();

/**
 * The terminal and the quick-pick box load on first use and open themselves in the mode asked for,
 * which waits on their template; later they are asked to open with an event.
 */
function openLazy(name: 'terminal' | 'pick' | 'intro', mode = ''): void {
  const source = document.querySelector<HTMLTemplateElement>(`template[data-lazy="${name}"]`);
  const { script: src = '', integrity = '' } = source?.dataset ?? {};
  if (loaded.has(name)) {
    document.dispatchEvent(new CustomEvent(`${name}:open`, { detail: mode }));
  } else if (source && src) {
    loaded.add(name);
    source.dataset['mode'] = mode;
    document.body.append(Object.assign(document.createElement('script'), { src, integrity }));
  }
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
      toggleSide();
      return true;
    case 'theme':
    case 'palette':
    case 'filter':
      openLazy('pick', action.kind);
      return true;
    case 'terminal':
      openLazy('terminal');
      return true;
    case 'help':
      openHelp();
      return true;
  }
}

let enabled = readShortcutsEnabled(browserStorage('localStorage') ?? { getItem: () => null });

/** Reduced motion is the visitor's choice here; the system setting is honored by the styles on its own. */
function renderMotion(): void {
  const reduced = document.documentElement.dataset['motion'] === 'reduced';
  for (const toggle of document.querySelectorAll('[data-motion-toggle]')) {
    toggle.setAttribute('aria-pressed', String(reduced));
  }
}

function toggleMotion(): void {
  const reduced = document.documentElement.dataset['motion'] !== 'reduced';
  if (reduced) {
    document.documentElement.dataset['motion'] = 'reduced';
  } else {
    document.documentElement.removeAttribute('data-motion');
  }
  try {
    if (reduced) {
      localStorage.setItem('motion', 'reduced');
    } else {
      localStorage.removeItem('motion');
    }
  } catch {
    // Storage blocked: the choice lasts until the page closes.
  }
  renderMotion();
}

function renderEnabled(): void {
  document.documentElement.dataset['shortcuts'] = enabled ? 'on' : 'off';
  for (const toggle of document.querySelectorAll('[data-shortcuts-toggle]')) {
    toggle.setAttribute('aria-pressed', String(enabled));
  }
  for (const notice of document.querySelectorAll<HTMLElement>('[data-shortcuts-notice]')) {
    notice.hidden = enabled;
  }
}

/** Hides or shows the side column; the buttons that do it say whether it is shown. */
function toggleSide(force?: boolean): void {
  const zoomed = document.body.classList.toggle('is-zoomed', force);
  for (const button of document.querySelectorAll('[data-action="zoom"]')) {
    button.setAttribute('aria-pressed', String(!zoomed));
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
    case 'palette':
    case 'filter':
      openLazy('pick', control.dataset['action']);
      break;
    case 'terminal':
      openLazy('terminal');
      break;
    case 'zoom':
      toggleSide();
      break;
    case 'view':
      document.dispatchEvent(new Event('items:toggle-view'));
      break;
    case 'toggle-motion':
      toggleMotion();
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
renderMotion();
renderThemeStatus();
toggleSide(document.body.classList.contains('is-zoomed'));
for (const element of document.querySelectorAll('[data-script-only]')) {
  element.removeAttribute('hidden');
}
for (const element of document.querySelectorAll<HTMLElement>('[data-no-script]')) {
  element.hidden = true;
}
document.addEventListener('keydown', onKeydown);
document.addEventListener('click', onClick);
// The head script asked for the full opening: its script comes only now.
if (document.documentElement.dataset['intro'] === 'full') {
  openLazy('intro');
}
