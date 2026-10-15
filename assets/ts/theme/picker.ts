/// <reference lib="dom" />
import { choiceToSaved, savedToChoice } from './choice.ts';
import { applyThemeChoice, type SavedTheme, saveTheme } from './storage.ts';

function storage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

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
    const applied = dialog.returnValue === 'apply';
    const chosen = radios(dialog).find((radio) => radio.checked);
    const keep = applied ? choiceToSaved(chosen?.value ?? '') : before;
    applyThemeChoice(document.documentElement, keep);
    const saved = storage();
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
