/// <reference lib="dom" />
import type { Entry, Ranked } from './entries.ts';
import { highlight } from './fuzzy.ts';

export interface BoxOptions {
  readonly title: string;
  readonly keys: string;
  /** With a search field, typing filters; without one, j and k move too. */
  readonly search: { readonly placeholder: string } | null;
  readonly list: (query: string) => { readonly ranked: readonly Ranked[]; readonly ghost: string };
  readonly empty: string;
  readonly onChoose: (entry: Entry) => void;
  readonly onMove?: (entry: Entry) => void;
  readonly onCancel?: () => void;
  /** Keys the mode handles itself, such as ← → for the accent; true when handled. */
  readonly onKey?: (event: KeyboardEvent) => boolean;
  readonly footer?: HTMLElement;
}

const LIST_STEPS = new Map([
  ['ArrowDown', 1],
  ['ArrowUp', -1],
]);
/** Without a search field, j and k move as well. */
const BROWSE_STEPS = new Map([...LIST_STEPS, ['j', 1], ['k', -1]]);

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

function renderLabel(label: string, positions: readonly number[]): HTMLElement {
  const span = element('span', 'pick__label');
  for (const run of highlight(label, positions)) {
    const part = run.matched ? element('mark', 'pick__match') : document.createElement('span');
    part.textContent = run.text;
    span.append(part);
  }
  return span;
}

function renderOption({ entry, match }: Ranked, index: number): HTMLLIElement {
  const option = element('li', 'pick__option');
  option.id = `pick-option-${index}`;
  option.setAttribute('role', 'option');
  option.dataset['index'] = String(index);
  if (entry.color) {
    option.style.setProperty('--pick-color', entry.color);
  }
  const kind = element('span', 'pick__kind');
  kind.textContent = entry.kind;
  option.append(kind, renderLabel(entry.label, match.positions));
  if (entry.swatch && entry.swatch.length > 0) {
    const swatch = element('span', 'pick__swatch');
    swatch.setAttribute('aria-hidden', 'true');
    for (const color of entry.swatch) {
      const chip = document.createElement('i');
      chip.style.backgroundColor = color;
      swatch.append(chip);
    }
    option.append(swatch);
  }
  if (entry.hint) {
    const hint = element('span', 'pick__hint');
    hint.textContent = entry.hint;
    option.append(hint);
  }
  if (entry.current) {
    option.dataset['current'] = 'true';
  }
  return option;
}

/** A box at the top of the window: an optional search field, a list of choices and a footer. */
export class Box {
  readonly dialog = element('dialog', 'pick panel');
  readonly listbox = element('ul', 'pick__list');
  readonly input: HTMLInputElement | null;
  readonly ghost = element('span', 'pick__ghost');
  ranked: readonly Ranked[] = [];
  active = 0;
  ghostText = '';
  chosen = false;

  constructor(readonly options: BoxOptions) {
    this.dialog.setAttribute('box-', 'square');
    this.dialog.setAttribute('aria-label', options.title);
    const title = element('h2', 'panel__title pick__title');
    title.textContent = options.title;
    const keys = element('p', 'pick__keys');
    keys.textContent = options.keys;
    this.listbox.id = 'pick-list';
    this.listbox.setAttribute('role', 'listbox');
    this.listbox.setAttribute('aria-label', options.title);
    this.input = options.search ? this.buildInput(options.search.placeholder) : null;
    if (!this.input) {
      this.listbox.tabIndex = 0;
    }
    const field = element('div', 'pick__field');
    if (this.input) {
      field.append(this.input, this.ghost);
    }
    this.dialog.append(
      title,
      ...(this.input ? [field] : []),
      this.listbox,
      ...(options.footer ? [options.footer] : []),
      keys,
    );
    this.wire();
    document.body.append(this.dialog);
  }

  buildInput(placeholder: string): HTMLInputElement {
    const input = element('input', 'pick__input');
    Object.assign(input, { type: 'text', placeholder, autocomplete: 'off', spellcheck: false });
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-controls', 'pick-list');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-label', placeholder);
    return input;
  }

  wire(): void {
    this.input?.addEventListener('input', () => this.refresh(0));
    this.dialog.addEventListener('keydown', (event) => this.onKey(event));
    this.listbox.addEventListener('mousemove', (event) => {
      const index = this.indexAt(event.target);
      if (index !== null && index !== this.active) {
        this.setActive(index);
      }
    });
    this.listbox.addEventListener('click', (event) => {
      const index = this.indexAt(event.target);
      if (index !== null) {
        this.setActive(index);
        this.choose();
      }
    });
    this.dialog.addEventListener('cancel', () => this.options.onCancel?.());
    this.dialog.addEventListener('close', () => this.dialog.remove());
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) {
        this.options.onCancel?.();
        this.close();
      }
    });
  }

  indexAt(target: EventTarget | null): number | null {
    const option = target instanceof Element ? target.closest<HTMLElement>('.pick__option') : null;
    return option ? Number(option.dataset['index']) : null;
  }

  open(start = 0): void {
    this.refresh(start);
    this.dialog.showModal();
    (this.input ?? this.listbox).focus();
  }

  close(): void {
    this.dialog.close();
  }

  refresh(start: number): void {
    const { ranked, ghost } = this.options.list(this.input?.value ?? '');
    this.ranked = ranked;
    this.ghostText = ghost;
    this.ghost.textContent = ghost ? `${this.input?.value ?? ''}${ghost}` : '';
    this.listbox.replaceChildren(...ranked.map(renderOption));
    if (ranked.length === 0) {
      const nothing = element('li', 'pick__empty');
      nothing.textContent = this.options.empty;
      this.listbox.append(nothing);
    }
    this.setActive(Math.min(start, Math.max(0, ranked.length - 1)));
  }

  setActive(index: number): void {
    this.active = index;
    for (const option of this.listbox.querySelectorAll<HTMLElement>('.pick__option')) {
      const on = Number(option.dataset['index']) === index;
      option.setAttribute('aria-selected', String(on));
      if (on) {
        option.scrollIntoView({ block: 'nearest' });
        (this.input ?? this.listbox).setAttribute('aria-activedescendant', option.id);
      }
    }
    const entry = this.ranked[index]?.entry;
    if (entry) {
      this.options.onMove?.(entry);
    }
  }

  move(step: number): void {
    if (this.ranked.length > 0) {
      this.setActive((this.active + step + this.ranked.length) % this.ranked.length);
    }
  }

  choose(): void {
    const entry = this.ranked[this.active]?.entry;
    if (entry) {
      this.chosen = true;
      this.close();
      this.options.onChoose(entry);
    }
  }

  onKey(event: KeyboardEvent): void {
    if (this.options.onKey?.(event)) {
      event.preventDefault();
      return;
    }
    const typing = this.input !== null;
    const step = (typing ? LIST_STEPS : BROWSE_STEPS).get(event.key);
    if (step) {
      this.move(step);
    } else if (event.key === 'Enter') {
      this.choose();
    } else if (event.key === 'Tab' && this.ghostText && this.input) {
      this.input.value += this.ghostText;
      this.refresh(0);
    } else {
      return;
    }
    event.preventDefault();
  }
}
