/// <reference lib="dom" />

import { browserStorage } from '../shared/storage.ts';
import { choiceToSaved, savedToChoice } from './choice.ts';
import { applyThemeChoice, type SavedTheme, saveTheme } from './storage.ts';

function currentChoice(): SavedTheme | null {
  const { themeFamily, theme, accent } = document.documentElement.dataset;
  return themeFamily || theme || accent
    ? { ...(themeFamily && { family: themeFamily }), ...(theme && { theme }), ...(accent && { accent }) }
    : null;
}

function radios(dialog: HTMLDialogElement, name = 'theme'): HTMLInputElement[] {
  return [...dialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)];
}

function checkedValue(dialog: HTMLDialogElement, name: string): string {
  return radios(dialog, name).find((radio) => radio.checked)?.value ?? '';
}

/** The theme and accent the picker shows: a family or a theme, plus the accent when one is chosen. */
function pickerChoice(dialog: HTMLDialogElement): SavedTheme | null {
  const theme = choiceToSaved(checkedValue(dialog, 'theme'));
  const accent = checkedValue(dialog, 'accent');
  const defaultAccent = dialog.querySelector<HTMLElement>('.theme-picker__accents')?.dataset['default'];
  return theme && accent && accent !== defaultAccent ? { ...theme, accent } : theme;
}

/** The theme in effect: a chosen theme, or the variant the system picks for the chosen or default family. */
function effectiveTheme(dialog: HTMLDialogElement): { id: string; radio: HTMLInputElement | undefined } {
  const wanted = savedToChoice(currentChoice(), dialog.dataset['defaultFamily'] ?? '');
  const radio = radios(dialog).find((candidate) => candidate.value === wanted);
  if (radio?.value.startsWith('theme:')) {
    return { id: radio.value.slice('theme:'.length), radio };
  }
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const id = (dark ? radio?.dataset['dark'] : radio?.dataset['light']) ?? '';
  return { id, radio: radios(dialog).find((candidate) => candidate.value === `theme:${id}`) };
}

/** Colors each accent swatch as it looks on the theme in effect. */
function paintSwatches(dialog: HTMLDialogElement): void {
  const { id } = effectiveTheme(dialog);
  for (const radio of radios(dialog, 'accent')) {
    const colors = JSON.parse(radio.dataset['colors'] ?? '{}') as Record<string, string>;
    const swatch = radio.parentElement?.querySelector<HTMLElement>('.accent__swatch');
    swatch?.style.setProperty('background-color', colors[id] ?? 'transparent');
  }
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
      applyThemeChoice(document.documentElement, pickerChoice(dialog));
      paintSwatches(dialog);
    }
  });
  dialog.addEventListener('close', () => {
    const applied = dialog.returnValue === 'apply';
    const keep = applied ? pickerChoice(dialog) : before;
    applyThemeChoice(document.documentElement, keep);
    queueMicrotask(renderThemeStatus);
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

function checkOpening(dialog: HTMLDialogElement): HTMLInputElement | undefined {
  const wanted = savedToChoice(before, dialog.dataset['defaultFamily'] ?? '');
  const selected = radios(dialog).find((radio) => radio.value === wanted);
  for (const radio of radios(dialog)) {
    radio.checked = radio === selected;
  }
  const accent = before?.accent ?? dialog.querySelector<HTMLElement>('.theme-picker__accents')?.dataset['default'];
  for (const radio of radios(dialog, 'accent')) {
    radio.checked = radio.value === accent;
  }
  return selected;
}

/** Previews each theme and accent as the choice moves, and keeps them only when they are applied. */
export function openThemePicker(): void {
  const dialog = document.querySelector<HTMLDialogElement>('.theme-picker');
  if (!dialog) {
    return;
  }
  wire(dialog);
  before = currentChoice();
  dialog.returnValue = '';
  const selected = checkOpening(dialog);
  paintSwatches(dialog);
  dialog.showModal();
  selected?.focus();
}

/** The name of the theme in effect, with the accent for a family that has accents. */
function themeName(dialog: HTMLDialogElement): string {
  const { id, radio } = effectiveTheme(dialog);
  const name = radio?.parentElement?.textContent?.trim() ?? '';
  const accents = dialog.querySelector<HTMLElement>('.theme-picker__accents');
  const family = accents?.dataset['family'];
  if (!(name && family && id.startsWith(`${family}-`))) {
    return name;
  }
  return `${name} · ${currentChoice()?.accent ?? accents?.dataset['default']}`;
}

/** Writes the theme in effect into the status line. */
export function renderThemeStatus(): void {
  const dialog = document.querySelector<HTMLDialogElement>('.theme-picker');
  const name = dialog ? themeName(dialog) : '';
  for (const slot of document.querySelectorAll('[data-status-theme]')) {
    slot.textContent = name;
  }
}
