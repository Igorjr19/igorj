<script lang="ts">
  import { goto } from '$app/navigation';
  import { browserStorage } from '../browser-storage.ts';
  import { loadIndex } from '../pick/index-store.ts';
  import { useShell } from '../shell.svelte.ts';
  import { themeLabel } from '../theme/status.ts';
  import { applyThemeChoice, saveTheme } from '../theme/storage.ts';
  import { useUi } from '../ui.svelte.ts';
  import { commonPrefix, complete, identity, type Line, type Result, run, type TerminalData } from './commands.ts';

  const shell = useShell();
  const ui = useUi();

  const HEIGHT_STEPS = new Map([
    ['ArrowUp', 0.05],
    ['ArrowDown', -0.05],
  ]);
  const MIN_HEIGHT = 0.2;
  const MAX_HEIGHT = 0.85;

  let data = $state<TerminalData | null>(null);
  let lines = $state<Line[]>([]);
  let value = $state('');
  let cwd = $state('');
  let suggestions = $state('');
  const history: string[] = [];
  let back = 0;
  let input: HTMLInputElement | undefined = $state();
  let scroller: HTMLDivElement | undefined = $state();
  let handle: HTMLDivElement | undefined = $state();

  const who = $derived(data ? identity(data) : { user: 'guest', host: shell.host.split('.')[0] ?? shell.host });
  const promptText = $derived(`${who.user}@${who.host}:~${cwd ? `/${cwd}` : ''}$`);

  function print(more: readonly Line[]): void {
    lines.push(...more);
    queueMicrotask(() => scroller?.scrollTo({ top: scroller.scrollHeight }));
  }

  /** The index loads the first time the terminal opens; its welcome line is the first thing printed. */
  $effect(() => {
    if (ui.terminalOpen && !data) {
      void loadIndex(shell.language)
        .then((loaded) => {
          data = loaded;
          const welcome = ` · ${loaded.profile.role} · ${loaded.strings['termWelcome'] ?? ''}`;
          print([
            [
              ['accent', loaded.profile.author],
              ['dim', welcome],
            ],
          ]);
        })
        .catch(() => {
          // Offline or blocked: the terminal stays closed and the page keeps working.
          ui.terminalOpen = false;
        });
    }
  });

  $effect(() => {
    if (ui.terminalOpen && data) {
      queueMicrotask(() => input?.focus());
    }
  });

  function close(): void {
    ui.terminalOpen = false;
    document.getElementById('pane')?.focus({ preventScroll: true });
  }

  function saveChosenTheme(theme: NonNullable<Result['theme']>): void {
    const saved = { theme: theme.id, ...(theme.accent && { accent: theme.accent }) };
    applyThemeChoice(document.documentElement, saved);
    ui.theme = saved;
    const storage = browserStorage('localStorage');
    try {
      if (storage) {
        saveTheme(storage, saved);
      }
    } catch {
      // Storage blocked: the theme lasts until the page closes.
    }
  }

  function apply(result: Result): void {
    print(result.lines);
    if (result.cwd !== undefined) {
      cwd = result.cwd;
    }
    if (result.clear) {
      lines = [];
    }
    if (result.theme) {
      saveChosenTheme(result.theme);
    }
    if (result.open) {
      void goto(result.open);
    }
    if (result.exit) {
      close();
    }
  }

  function submit(event: SubmitEvent): void {
    event.preventDefault();
    if (!data) {
      return;
    }
    const typed = value;
    print([
      [
        ['accent', `${promptText} `],
        ['plain', typed],
      ],
    ]);
    if (typed.trim()) {
      history.push(typed);
    }
    back = history.length;
    value = '';
    suggestions = '';
    const themeName = themeLabel(shell.themeNames, ui.theme, matchMedia('(prefers-color-scheme: dark)').matches);
    apply(run(typed, { data, cwd, history, themeName }));
  }

  function showSuggestions(): void {
    const candidates = data && value ? complete(value, cwd, data) : [];
    suggestions = candidates.length > 1 ? candidates.slice(0, 8).join('   ') : '';
  }

  /** Tab fills the one candidate, or what every candidate shares. */
  function tab(): void {
    if (!data) {
      return;
    }
    const candidates = complete(value, cwd, data);
    const words = value.split(/\s+/);
    const fill = candidates.length === 1 ? candidates[0] : commonPrefix(candidates);
    if (fill && fill.length > (words.at(-1)?.length ?? 0)) {
      words[words.length - 1] = fill;
      const done = candidates.length === 1 && !fill.endsWith('/');
      value = `${words.join(' ')}${done ? ' ' : ''}`;
    }
    showSuggestions();
  }

  function recall(step: 1 | -1): void {
    back = Math.max(0, Math.min(history.length, back + step));
    value = history[back] ?? '';
  }

  function onKeydown(event: KeyboardEvent): void {
    const actions = new Map<string, () => void>([
      ['Tab', tab],
      ['ArrowUp', () => recall(-1)],
      ['ArrowDown', () => recall(1)],
      ['Escape', close],
    ]);
    const action = event.ctrlKey && event.key === 'l' ? () => (lines = []) : actions.get(event.key);
    if (action) {
      event.preventDefault();
      action();
    }
  }

  function setHeight(share: number, save = false): void {
    ui.terminalHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, share));
    if (save) {
      try {
        localStorage.setItem('terminal-height', String(ui.terminalHeight));
      } catch {
        // Storage blocked: the height lasts until the page closes.
      }
    }
  }

  /** The top edge sets the height: dragged with the pointer, or moved with the arrow keys once focused. */
  function drag(start: PointerEvent): void {
    const column = handle?.parentElement?.getBoundingClientRect();
    if (!(column && handle)) {
      return;
    }
    const edge = handle;
    edge.setPointerCapture(start.pointerId);
    ui.resizing = true;
    const move = (event: PointerEvent): void => setHeight((column.bottom - event.clientY) / column.height);
    edge.addEventListener('pointermove', move);
    edge.addEventListener(
      'pointerup',
      () => {
        edge.removeEventListener('pointermove', move);
        ui.resizing = false;
        setHeight(ui.terminalHeight, true);
      },
      { once: true },
    );
  }

  function onHandleKey(event: KeyboardEvent): void {
    const step = HEIGHT_STEPS.get(event.key);
    if (step) {
      event.preventDefault();
      setHeight(ui.terminalHeight + step, true);
    }
  }

  /** A click anywhere in the panel goes to the prompt, as in a terminal, unless it lands on a control or ends a selection. */
  function onPanelClick(event: MouseEvent): void {
    const target = event.target instanceof Element ? event.target : null;
    if (!(target?.closest('a, button, input, hr') || getSelection()?.toString())) {
      input?.focus();
    }
  }
</script>

<!-- A click anywhere in the panel goes to the prompt for pointer users; the keyboard already has the prompt. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section class={['drawer', ui.terminalOpen && 'drawer--open']} id="terminal" aria-label="Terminal" onpointerup={onPanelClick}>
  <!-- A focusable separator is the WAI-ARIA window splitter: the arrow keys move it. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <hr
    class="drawer__handle"
    aria-orientation="horizontal"
    aria-label={data?.strings['termResize'] ?? ''}
    aria-valuemin={MIN_HEIGHT * 100}
    aria-valuemax={MAX_HEIGHT * 100}
    aria-valuenow={Math.round(ui.terminalHeight * 100)}
    tabindex="0"
    bind:this={handle}
    onpointerdown={drag}
    onkeydown={onHandleKey}
  />
  <div class="drawer__bar">
    <span class="drawer__title">terminal · {who.user}@{who.host}</span>
    <span class="drawer__end">
      <span class="drawer__keys">{data?.strings['termKeys'] ?? ''}</span>
      <button type="button" class="drawer__close" aria-label={data?.strings['termCloseLabel'] ?? 'Close the terminal'} onclick={close}>{data?.strings['termClose'] ?? 'close'}</button>
    </span>
  </div>
  <div class="term">
    <div class="term__scroll" bind:this={scroller}>
      <div class="term__log" role="log" aria-live="polite">
        {#each lines as line, at (at)}
          <div class="term__line">{#each line as [tone, text], part (part)}<span class={`term__${tone}`}>{text}</span>{/each}</div>
        {/each}
      </div>
      <form class="term__form" onsubmit={submit}>
        <label class="term__prompt" for="terminal-input">{promptText}</label>
        <input
          class="term__input"
          id="terminal-input"
          autocomplete="off"
          spellcheck="false"
          autocapitalize="off"
          bind:this={input}
          bind:value
          oninput={showSuggestions}
          onkeydown={onKeydown}
        />
        <button type="submit" hidden>{data?.strings['termRun'] ?? 'run'}</button>
      </form>
      <div class="term__suggest">{suggestions}</div>
    </div>
  </div>
</section>
