/// <reference lib="dom" />

import { browserStorage } from '../shared/storage.ts';
import { choiceToSaved, savedToChoice } from './choice.ts';
import { applyThemeChoice, type SavedTheme, saveTheme } from './storage.ts';

function currentChoice(): SavedTheme | null {
  const { themeFamily, theme } = document.documentElement.dataset;
  return themeFamily || theme ? { ...(themeFamily && { family: themeFamily }), ...(theme && { theme }) } : null;
}

function radios(dialog: HTMLDialogElement): HTMLInputElement[] {
  return [...dialog.querySelectorAll<HTMLInputElement>('input[name="theme"]')];
}

/** The theme in effect when the picker opened, which closing without applying brings back. */
let before: SavedTheme | null = null;
let wired = false;

function wire(dialog: HTMLDialogElement): void {
  if (wired) {
    return;
  }
  wired = true;
  dialog.addEventListener('change', (event) => {
    if (event.target instanceof HTMLInputElement) {
      applyThemeChoice(document.documentElement, choiceToSaved(event.target.value));
    }
  });
  dialog.addEventListener('close', () => {
    queueMicrotask(renderThemeStatus);
    const applied = dialog.returnValue === 'apply';
    const chosen = radios(dialog).find((radio) => radio.checked);
    const keep = applied ? choiceToSaved(chosen?.value ?? '') : before;
    applyThemeChoice(document.documentElement, keep);
    const saved = browserStorage('localStorage');
    if (applied && saved) {
      try {
        saveTheme(saved, keep);
      } catch {
        // Storage blocked: the choice lasts until the page closes.
      }
    }
  });
}

/** Previews each theme as the choice moves, and keeps one only when it is applied. */
export function openThemePicker(): void {
  const dialog = document.querySelector<HTMLDialogElement>('.theme-picker');
  if (!dialog) {
    return;
  }
  wire(dialog);
  before = currentChoice();
  dialog.returnValue = '';
  const wanted = savedToChoice(before, dialog.dataset['defaultFamily'] ?? '');
  const selected = radios(dialog).find((radio) => radio.value === wanted);
  for (const radio of radios(dialog)) {
    radio.checked = radio === selected;
  }
  dialog.showModal();
  selected?.focus();
}

/** The name of the theme in effect; a family that follows the system names the variant the system picked. */
function themeName(dialog: HTMLDialogElement): string {
  const wanted = savedToChoice(currentChoice(), dialog.dataset['defaultFamily'] ?? '');
  const radio = radios(dialog).find((candidate) => candidate.value === wanted);
  const family = radio?.closest('fieldset');
  if (!(radio && family)) {
    return '';
  }
  const variants = [...family.querySelectorAll<HTMLInputElement>('input[value^="theme:"]')];
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const shown = radio.value.startsWith('theme:') ? radio : variants[dark ? 1 : 0];
  return shown?.parentElement?.textContent?.trim() ?? '';
}

/** Writes the theme in effect into the status line. */
export function renderThemeStatus(): void {
  const dialog = document.querySelector<HTMLDialogElement>('.theme-picker');
  const name = dialog ? themeName(dialog) : '';
  for (const slot of document.querySelectorAll('[data-status-theme]')) {
    slot.textContent = name;
  }
}
