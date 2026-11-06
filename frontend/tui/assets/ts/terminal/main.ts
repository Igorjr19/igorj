/// <reference lib="dom" />
import { browserStorage } from '../shared/storage.ts';
import { renderThemeStatus } from '../theme/status.ts';
import { applyThemeChoice, saveTheme } from '../theme/storage.ts';
import { commonPrefix, complete, type Line, type Result, run, type TerminalData } from './commands.ts';

const OPEN_EVENT = 'terminal:open';
const HEIGHT_KEY = 'terminal-height';
const DEFAULT_HEIGHT = 0.45;
const MIN_HEIGHT = 0.2;
const MAX_HEIGHT = 0.85;
const HEIGHT_STEPS = new Map([
  ['ArrowUp', 0.05],
  ['ArrowDown', -0.05],
]);

function readHeight(): number {
  try {
    const saved = Number(localStorage.getItem(HEIGHT_KEY));
    return saved > 0 ? saved : DEFAULT_HEIGHT;
  } catch {
    return DEFAULT_HEIGHT;
  }
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

function renderLine(segments: Line): HTMLElement {
  const row = element('div', 'term__line');
  for (const [tone, text] of segments) {
    const span = element('span', `term__${tone}`);
    span.textContent = text;
    row.append(span);
  }
  return row;
}

function saveChosenTheme(theme: NonNullable<Result['theme']>): void {
  const saved = { theme: theme.id, ...(theme.accent && { accent: theme.accent }) };
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

/** The drawer that drops from the top of the window: a log, the suggestions and the prompt. */
class Terminal {
  readonly drawer = element('section', 'drawer');
  readonly log = element('div', 'term__log');
  readonly scroll = element('div', 'term__scroll');
  readonly handle = element('div', 'drawer__handle');
  readonly suggest = element('div', 'term__suggest');
  readonly prompt = element('label', 'term__prompt');
  readonly input = element('input', 'term__input');
  readonly mode = document.querySelector('.statusbar__mode');
  readonly normalMode = this.mode?.textContent ?? '';
  readonly history: string[] = [];
  cwd = '';
  back = 0;

  constructor(readonly data: TerminalData) {
    this.build();
    this.input.addEventListener('input', () => this.showSuggestions());
    this.input.addEventListener('keydown', (event) => this.onKey(event));
    this.drawer.querySelector('form')?.addEventListener('submit', (event) => this.submit(event));
    document.addEventListener(OPEN_EVENT, () => this.toggle());
    this.showPrompt();
    const welcome = ` · ${data.profile.role} · ${data.strings['termWelcome'] ?? ''}`;
    this.print([
      [
        ['accent', data.profile.author],
        ['dim', welcome],
      ],
    ]);
  }

  build(): void {
    this.drawer.id = 'terminal';
    this.drawer.setAttribute('aria-label', 'Terminal');
    const bar = element('div', 'drawer__bar');
    const title = element('span', 'drawer__title');
    title.textContent = `terminal · igor@${this.data.host}`;
    const keys = element('span', 'drawer__keys');
    keys.textContent = this.data.strings['termKeys'] ?? '';
    bar.append(title, keys);
    this.log.setAttribute('role', 'log');
    this.log.setAttribute('aria-live', 'polite');
    this.prompt.htmlFor = 'terminal-input';
    Object.assign(this.input, { id: 'terminal-input', autocomplete: 'off', spellcheck: false });
    this.input.setAttribute('autocapitalize', 'off');
    const form = element('form', 'term__form');
    form.append(this.prompt, this.input);
    // The prompt sits right after the last line of output, as in a terminal, and moves down with it.
    this.scroll.append(this.log, form, this.suggest);
    const body = element('div', 'term');
    body.append(this.scroll);
    this.buildHandle();
    this.drawer.append(this.handle, bar, body);
    document.querySelector('.win__body')?.append(this.drawer);
    this.setHeight(readHeight());
  }

  /** The top edge sets the height: dragged with the pointer, or moved with the arrow keys once focused. */
  buildHandle(): void {
    this.handle.setAttribute('role', 'separator');
    this.handle.setAttribute('aria-orientation', 'horizontal');
    this.handle.setAttribute('aria-label', this.data.strings['termResize'] ?? '');
    this.handle.setAttribute('aria-valuemin', String(MIN_HEIGHT * 100));
    this.handle.setAttribute('aria-valuemax', String(MAX_HEIGHT * 100));
    this.handle.tabIndex = 0;
    this.handle.addEventListener('pointerdown', (event) => this.drag(event));
    this.handle.addEventListener('keydown', (event) => {
      const step = HEIGHT_STEPS.get(event.key);
      if (step) {
        event.preventDefault();
        this.setHeight(this.height + step, true);
      }
    });
  }

  height = DEFAULT_HEIGHT;

  /** The share of the content column the terminal takes, kept between visits. */
  setHeight(share: number, save = false): void {
    this.height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, share));
    document.querySelector<HTMLElement>('.win')?.style.setProperty('--terminal-height', `${this.height * 100}%`);
    this.handle.setAttribute('aria-valuenow', String(Math.round(this.height * 100)));
    if (save) {
      try {
        localStorage.setItem(HEIGHT_KEY, String(this.height));
      } catch {
        // Storage blocked: the height lasts until the page closes.
      }
    }
  }

  drag(start: PointerEvent): void {
    const column = this.drawer.parentElement?.getBoundingClientRect();
    if (!column) {
      return;
    }
    this.handle.setPointerCapture(start.pointerId);
    const move = (event: PointerEvent): void => this.setHeight((column.bottom - event.clientY) / column.height);
    const stop = (): void => {
      this.handle.removeEventListener('pointermove', move);
      this.setHeight(this.height, true);
    };
    this.handle.addEventListener('pointermove', move);
    this.handle.addEventListener('pointerup', stop, { once: true });
  }

  print(lines: readonly Line[]): void {
    this.log.append(...lines.map(renderLine));
    this.scroll.scrollTop = this.scroll.scrollHeight;
  }

  showPrompt(): void {
    this.prompt.textContent = `igor@${this.data.host}:~${this.cwd ? `/${this.cwd}` : ''}$`;
  }

  open(): void {
    this.drawer.classList.add('drawer--open');
    document.body.classList.add('has-terminal');
    if (this.mode) {
      this.mode.textContent = this.data.strings['modeTerminal'] ?? 'TERMINAL';
    }
    this.input.focus();
  }

  close(): void {
    this.drawer.classList.remove('drawer--open');
    document.body.classList.remove('has-terminal');
    if (this.mode) {
      this.mode.textContent = this.normalMode;
    }
    document.getElementById('pane')?.focus({ preventScroll: true });
  }

  toggle(): void {
    if (this.drawer.classList.contains('drawer--open')) {
      this.close();
    } else {
      this.open();
    }
  }

  apply(result: Result): void {
    this.print(result.lines);
    if (result.cwd !== undefined) {
      this.cwd = result.cwd;
      this.showPrompt();
    }
    if (result.clear) {
      this.log.replaceChildren();
    }
    if (result.theme) {
      saveChosenTheme(result.theme);
    }
    if (result.open) {
      location.assign(result.open);
    }
    if (result.exit) {
      this.close();
    }
  }

  submit(event: SubmitEvent): void {
    event.preventDefault();
    const value = this.input.value;
    this.print([
      [
        ['accent', `${this.prompt.textContent} `],
        ['plain', value],
      ],
    ]);
    if (value.trim()) {
      this.history.push(value);
    }
    this.back = this.history.length;
    this.input.value = '';
    this.suggest.textContent = '';
    const themeName = document.querySelector('[data-status-theme]')?.textContent ?? '';
    this.apply(run(value, { data: this.data, cwd: this.cwd, history: this.history, themeName }));
  }

  showSuggestions(): void {
    const candidates = this.input.value ? complete(this.input.value, this.cwd, this.data) : [];
    this.suggest.textContent = candidates.length > 1 ? candidates.slice(0, 8).join('   ') : '';
  }

  /** Tab fills the one candidate, or what every candidate shares. */
  tab(): void {
    const candidates = complete(this.input.value, this.cwd, this.data);
    const words = this.input.value.split(/\s+/);
    const fill = candidates.length === 1 ? candidates[0] : commonPrefix(candidates);
    if (fill && fill.length > (words.at(-1)?.length ?? 0)) {
      words[words.length - 1] = fill;
      const done = candidates.length === 1 && !fill.endsWith('/');
      this.input.value = `${words.join(' ')}${done ? ' ' : ''}`;
    }
    this.showSuggestions();
  }

  recall(step: 1 | -1): void {
    this.back = Math.max(0, Math.min(this.history.length, this.back + step));
    this.input.value = this.history[this.back] ?? '';
  }

  onKey(event: KeyboardEvent): void {
    const actions: Readonly<Record<string, () => void>> = {
      tab: () => this.tab(),
      up: () => this.recall(-1),
      down: () => this.recall(1),
      escape: () => this.close(),
      clear: () => this.log.replaceChildren(),
    };
    const names = new Map([
      ['Tab', 'tab'],
      ['ArrowUp', 'up'],
      ['ArrowDown', 'down'],
      ['Escape', 'escape'],
    ]);
    const action = actions[event.ctrlKey && event.key === 'l' ? 'clear' : (names.get(event.key) ?? '')];
    if (action) {
      event.preventDefault();
      action();
    }
  }
}

const source = document.querySelector<HTMLTemplateElement>('template[data-lazy="terminal"]');
if (source?.dataset['index']) {
  fetch(source.dataset['index'])
    .then((response) => response.json() as Promise<TerminalData>)
    .then((data) => new Terminal(data).open())
    .catch(() => {
      // Offline or blocked: the terminal stays closed and the page keeps working.
    });
}
