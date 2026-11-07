/// <reference lib="dom" />
import { browserStorage } from '../shared/storage.ts';
import { choiceToSaved, savedToChoice } from '../theme/choice.ts';
import { currentChoice, renderThemeStatus } from '../theme/status.ts';
import { applyThemeChoice, type SavedTheme, saveTheme } from '../theme/storage.ts';
import { Box } from './box.ts';
import {
  type Command,
  categoryEntries,
  commandEntries,
  completion,
  type Entry,
  type PickIndex,
  parseQuery,
  placeEntries,
  rank,
  tagEntries,
  themeEntries,
} from './entries.ts';

type Mode = 'palette' | 'filter' | 'theme';

const ACCENT_STEPS = new Map([
  ['ArrowRight', 1],
  ['l', 1],
  ['ArrowLeft', -1],
  ['h', -1],
]);

const click = (selector: string): void => document.querySelector<HTMLElement>(selector)?.click();

function go(entry: Entry): void {
  if (entry.action.type === 'go') {
    location.assign(entry.action.url);
  }
}

function saveChoice(saved: SavedTheme | null): void {
  applyThemeChoice(document.documentElement, saved);
  const storage = browserStorage('localStorage');
  try {
    if (storage) {
      saveTheme(storage, saved);
    }
  } catch {
    // Storage blocked: the theme lasts until the page closes.
  }
  renderThemeStatus();
}

class Pick {
  constructor(readonly index: PickIndex) {}

  get s(): Readonly<Record<string, string>> {
    return this.index.strings;
  }

  open(mode: Mode): void {
    if (mode === 'theme') {
      this.openTheme();
    } else if (mode === 'filter') {
      this.openFilter();
    } else {
      this.openPalette();
    }
  }

  openPalette(): void {
    const places = placeEntries(this.index);
    const language = document.querySelector<HTMLAnchorElement>('.win__languages a');
    const commands = commandEntries(this.index, {
      hasList: document.querySelector('[data-items]') !== null,
      isBlog: document.querySelector('.filter') !== null,
      language: language?.textContent?.trim() ?? null,
    });
    new Box({
      title: this.s['pickPalette'] ?? '',
      keys: this.s['pickKeysList'] ?? '',
      search: { placeholder: this.s['pickPlaceholder'] ?? '' },
      empty: this.s['pickNothing'] ?? '',
      list: (raw) => {
        const query = parseQuery(raw);
        // Without a query the list stays short: the panes and the newest items, or the first commands.
        const ranked = rank(query.commands ? commands : places, query.text, query.text ? 30 : 12);
        const ghost = query.commands ? completion(query.text, ranked[0]?.entry) : '';
        return { ranked, ghost };
      },
      onChoose: (entry) =>
        entry.action.type === 'command' ? this.run(entry.action.command, entry.action.argument) : go(entry),
    }).open();
  }

  openFilter(): void {
    const entries = [
      ...categoryEntries(this.index, location.pathname, true),
      ...tagEntries(this.index, location.pathname),
    ];
    const current = Math.max(
      0,
      entries.findIndex((entry) => entry.current),
    );
    new Box({
      title: this.s['pickFilter'] ?? '',
      keys: this.s['pickKeysList'] ?? '',
      search: { placeholder: this.s['pickFilter'] ?? '' },
      empty: this.s['pickNothing'] ?? '',
      list: (query) => ({ ranked: rank(entries, query), ghost: '' }),
      onChoose: go,
    }).open(current);
  }

  /** Themes in a list with their colors and, for the family that has them, a row of accents below. */
  openTheme(): void {
    const themeIndex = this.index.themeIndex;
    const before = currentChoice();
    const start = savedToChoice(before, themeIndex.defaultFamily);
    const entries = themeEntries(themeIndex, this.s['pickFollowSystem'] ?? '', start);
    const accents = themeIndex.accents;
    let accent = before?.accent ?? accents?.default ?? '';
    let choice = start;
    const row = document.createElement('div');
    row.className = 'pick__accents';
    const preview = (): SavedTheme | null => {
      const saved = choiceToSaved(choice);
      const withAccent = saved && accents && accent !== accents.default ? { ...saved, accent } : saved;
      applyThemeChoice(document.documentElement, withAccent);
      this.paintAccents(row, accent);
      return withAccent;
    };
    const setAccent = (name: string): void => {
      accent = name;
      preview();
    };
    this.buildAccents(row, setAccent);
    new Box({
      title: this.s['pickTheme'] ?? '',
      keys: this.s['pickKeysTheme'] ?? '',
      search: null,
      empty: '',
      list: () => ({ ranked: rank(entries, ''), ghost: '' }),
      ...(accents && { footer: row }),
      onMove: (entry) => {
        if (entry.action.type === 'theme') {
          choice = entry.action.choice;
          preview();
        }
      },
      onKey: (event) => {
        const step = ACCENT_STEPS.get(event.key);
        if (!(step && accents)) {
          return false;
        }
        const names = accents.options.map((option) => option.name);
        setAccent(names[(names.indexOf(accent) + step + names.length) % names.length] ?? accent);
        return true;
      },
      onChoose: () => saveChoice(preview()),
      onCancel: () => {
        applyThemeChoice(document.documentElement, before);
        renderThemeStatus();
      },
    }).open(
      Math.max(
        0,
        entries.findIndex((entry) => entry.current),
      ),
    );
  }

  buildAccents(row: HTMLElement, choose: (name: string) => void): void {
    const label = document.createElement('span');
    label.className = 'pick__accents-label';
    label.textContent = this.s['pickAccent'] ?? '';
    row.append(label);
    for (const option of this.index.themeIndex.accents?.options ?? []) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pick__accent';
      button.dataset['accent'] = option.name;
      button.title = option.name;
      button.setAttribute('aria-label', option.name);
      button.addEventListener('click', () => choose(option.name));
      row.append(button);
    }
  }

  /** Each swatch takes its color on the theme being previewed; the accent in use is pressed and named. */
  paintAccents(row: HTMLElement, accent: string): void {
    const themeIndex = this.index.themeIndex;
    const saved = currentChoice();
    const choice = savedToChoice(saved, themeIndex.defaultFamily);
    const family = themeIndex.families.find((candidate) => choice === `family:${candidate.name}`);
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const id = family ? (dark ? family.system.dark : family.system.light) : choice.slice('theme:'.length);
    for (const button of row.querySelectorAll<HTMLButtonElement>('.pick__accent')) {
      const option = themeIndex.accents?.options.find((candidate) => candidate.name === button.dataset['accent']);
      button.style.backgroundColor = option?.colors[id] ?? 'transparent';
      button.setAttribute('aria-pressed', String(button.dataset['accent'] === accent));
    }
    const label = row.querySelector('.pick__accents-label');
    if (label) {
      label.textContent = `${this.s['pickAccent'] ?? ''}: ${accent}`;
    }
  }

  run(command: Command, argument?: string): void {
    const actions: Readonly<Record<Command, () => void>> = {
      theme: () => this.openTheme(),
      accent: () =>
        saveChoice({ ...(currentChoice() ?? { family: this.index.themeIndex.defaultFamily }), accent: argument ?? '' }),
      language: () => click('.win__languages a'),
      side: () => click('[data-action="zoom"]'),
      view: () => document.dispatchEvent(new Event('items:toggle-view')),
      filter: () => this.openFilter(),
      terminal: () => click('[data-action="terminal"]'),
      help: () => click('[data-action="help"]'),
      shortcuts: () => click('[data-action="toggle-shortcuts"]'),
      motion: () => click('[data-action="toggle-motion"]'),
      'copy-link': () => {
        navigator.clipboard?.writeText(location.href).catch(() => {
          // Clipboard refused: nothing to undo.
        });
      },
    };
    actions[command]();
  }
}

const source = document.querySelector<HTMLTemplateElement>('template[data-lazy="pick"]');
if (source?.dataset['index']) {
  fetch(source.dataset['index'])
    .then((response) => response.json() as Promise<PickIndex>)
    .then((index) => {
      const pick = new Pick(index);
      document.addEventListener('pick:open', (event) => pick.open((event as CustomEvent<Mode>).detail));
      pick.open((source.dataset['mode'] as Mode | undefined) ?? 'palette');
    })
    .catch(() => {
      // Offline or blocked: the box stays closed and every page keeps its links.
    });
}
