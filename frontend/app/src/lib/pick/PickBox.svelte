<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { sameEverywhere } from '../alternates.ts';
  import { browserStorage } from '../browser-storage.ts';
  import { isReadingPage } from '../layout.ts';
  import { useShell } from '../shell.svelte.ts';
  import { choiceToSaved, savedToChoice } from '../theme/choice.ts';
  import { currentChoice } from '../theme/current.ts';
  import { applyThemeChoice, type SavedTheme, saveTheme } from '../theme/storage.ts';
  import { useUi } from '../ui.svelte.ts';
  import {
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
  import { highlight } from './fuzzy.ts';

  const shell = useShell();
  const ui = useUi();

  const ACCENT_STEPS = new Map([
    ['ArrowRight', 1],
    ['l', 1],
    ['ArrowLeft', -1],
    ['h', -1],
  ]);

  let dialog: HTMLDialogElement | undefined = $state();
  let input: HTMLInputElement | undefined = $state();
  let listbox: HTMLDivElement | undefined = $state();
  let index = $state<PickIndex | null>(null);
  let query = $state('');
  let active = $state(0);
  let chosen = false;

  // Themes: the choice and the accent being previewed, and what to go back to on cancel.
  let before: SavedTheme | null = $state(null);
  let themeChoice = $state('');
  let accent = $state('');

  const mode = $derived(ui.pick);
  const s = $derived(index?.strings ?? {});
  const parsed = $derived(parseQuery(query));

  const places = $derived(index ? placeEntries(index) : []);
  const commands = $derived(
    index
      ? commandEntries(index, {
          hasList: document?.querySelector('[data-items]') !== null,
          isBlog: /^\/[^/]+\/(?:posts|categories)\//.test(page.url.pathname),
          language: shell.languages.filter((language) => language !== shell.language)[0] ?? null,
        })
      : [],
  );
  const filterEntries = $derived(
    index ? [...categoryEntries(index, page.url.pathname, true), ...tagEntries(index, page.url.pathname)] : [],
  );
  const themeList = $derived(
    index ? themeEntries(index.themeIndex, s['pickFollowSystem'] ?? '', savedToChoice(before, index.themeIndex.defaultFamily)) : [],
  );

  const ranked = $derived.by(() => {
    if (mode === 'theme') {
      return rank(themeList, '');
    }
    if (mode === 'filter') {
      return rank(filterEntries, query);
    }
    return rank(parsed.commands ? commands : places, parsed.text, parsed.text ? 30 : 12);
  });
  const ghost = $derived(mode === 'palette' && parsed.commands ? completion(parsed.text, ranked[0]?.entry) : '');
  const title = $derived(s[mode === 'theme' ? 'pickTheme' : mode === 'filter' ? 'pickFilter' : 'pickPalette'] ?? '');
  const keys = $derived(s[mode === 'theme' ? 'pickKeysTheme' : 'pickKeysList'] ?? '');
  const searching = $derived(mode !== 'theme');
  const accents = $derived(index?.themeIndex.accents ?? null);

  async function load(): Promise<void> {
    if (!index) {
      try {
        index = (await (await fetch(`/${shell.language}/site.json`)).json()) as PickIndex;
      } catch {
        // Offline or blocked: the box stays closed and every page keeps its links.
        ui.pick = null;
      }
    }
  }

  function startIndex(wanted: NonNullable<typeof mode>, loaded: PickIndex): number {
    const entries = wanted === 'theme' ? themeList : wanted === 'filter' ? filterEntries : [];
    return Math.max(0, entries.findIndex((entry) => entry.current));
  }

  function open(loaded: PickIndex, wanted: NonNullable<typeof mode>): void {
    query = '';
    chosen = false;
    before = currentChoice();
    themeChoice = savedToChoice(before, loaded.themeIndex.defaultFamily);
    accent = before?.accent ?? loaded.themeIndex.accents?.default ?? '';
    active = startIndex(wanted, loaded);
    dialog?.showModal();
    (input ?? listbox)?.focus();
  }

  /** Opens when asked for, once the index is there. */
  $effect(() => {
    const wanted = mode;
    if (!wanted) {
      return;
    }
    void load().then(() => {
      if (index && dialog && ui.pick !== null && !dialog.open) {
        open(index, wanted);
      }
    });
  });

  function preview(): SavedTheme | null {
    const saved = choiceToSaved(themeChoice);
    const withAccent = saved && accents && accent !== accents.default ? { ...saved, accent } : saved;
    applyThemeChoice(document.documentElement, withAccent);
    return withAccent;
  }

  // Moving over a theme previews it.
  $effect(() => {
    const entry = ranked[active]?.entry;
    if (mode === 'theme' && entry?.action.type === 'theme' && dialog?.open) {
      themeChoice = entry.action.choice;
      preview();
    }
  });

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
  }

  function runCommand(command: string, argument: string | undefined): void {
    const commands: Record<string, () => void> = {
      theme: () => {
        ui.pick = 'theme';
      },
      filter: () => {
        ui.pick = 'filter';
      },
      accent: () =>
        saveChoice({ ...(currentChoice() ?? { family: index?.themeIndex.defaultFamily ?? '' }), accent: argument ?? '' }),
      language: () => {
        const other = shell.languages.find((language) => language !== shell.language);
        if (other) {
          void goto(sameEverywhere(page.url.pathname, shell.language, shell.languages)[other] ?? `/${other}/`);
        }
      },
      side: () => ui.toggleSide(isReadingPage(page.url.pathname)),
      view: () => ui.toggleView(),
      help: () => {
        ui.helpOpen = true;
      },
      'copy-link': () => {
        navigator.clipboard?.writeText(location.href).catch(() => {
          // Clipboard refused: nothing to undo.
        });
      },
    };
    commands[command]?.();
  }

  function run(entry: Entry): void {
    const { action } = entry;
    if (action.type === 'go') {
      void goto(action.url);
    } else if (action.type === 'theme') {
      saveChoice(preview());
    } else {
      runCommand(action.command, action.argument);
    }
  }

  function choose(): void {
    const entry = ranked[active]?.entry;
    if (entry) {
      chosen = true;
      const reopen = entry.action.type === 'command' && (entry.action.command === 'theme' || entry.action.command === 'filter');
      dialog?.close();
      run(entry);
      if (!reopen) {
        ui.pick = null;
      }
    }
  }

  function cancel(): void {
    if (mode === 'theme' && !chosen) {
      applyThemeChoice(document.documentElement, before);
    }
  }

  function onClose(): void {
    cancel();
    if (!chosen) {
      ui.pick = null;
    }
  }

  function move(step: number): void {
    if (ranked.length > 0) {
      active = (active + step + ranked.length) % ranked.length;
      listbox?.querySelector(`#pick-option-${active}`)?.scrollIntoView({ block: 'nearest' });
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    const step = ACCENT_STEPS.get(event.key);
    if (mode === 'theme' && step && accents) {
      const names = accents.options.map((option) => option.name);
      accent = names[(names.indexOf(accent) + step + names.length) % names.length] ?? accent;
      preview();
      event.preventDefault();
      return;
    }
    const steps = new Map(searching ? [['ArrowDown', 1], ['ArrowUp', -1]] : [['ArrowDown', 1], ['ArrowUp', -1], ['j', 1], ['k', -1]]);
    const next = steps.get(event.key);
    if (next) {
      move(next);
    } else if (event.key === 'Enter') {
      choose();
    } else if (event.key === 'Tab' && ghost && input) {
      query = `${query}${ghost}`;
      active = 0;
    } else {
      return;
    }
    event.preventDefault();
  }

  /** The accent swatch takes its color on the theme being previewed. */
  function accentColor(name: string): string {
    const themes = index?.themeIndex;
    const family = themes?.families.find((candidate) => themeChoice === `family:${candidate.name}`);
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const id = family ? (dark ? family.system.dark : family.system.light) : themeChoice.slice('theme:'.length);
    return themes?.accents?.options.find((option) => option.name === name)?.colors[id] ?? 'transparent';
  }
</script>

<dialog class="pick panel" aria-label={title} bind:this={dialog} onclose={onClose} onkeydown={onKeydown}>
  <h2 class="panel__title pick__title">{title}</h2>
  {#if searching}
    <div class="pick__field">
      <input
        class="pick__input"
        type="text"
        autocomplete="off"
        spellcheck="false"
        placeholder={s['pickPlaceholder'] ?? ''}
        role="combobox"
        aria-expanded="true"
        aria-controls="pick-list"
        aria-autocomplete="list"
        aria-label={s['pickPlaceholder'] ?? ''}
        aria-activedescendant={`pick-option-${active}`}
        bind:this={input}
        bind:value={query}
        oninput={() => (active = 0)}
      />
      <span class="pick__ghost">{ghost ? `${query}${ghost}` : ''}</span>
    </div>
  {/if}
  <div class="pick__list" id="pick-list" role="listbox" aria-label={title} tabindex={searching ? undefined : 0} bind:this={listbox}>
    {#each ranked as { entry, match }, position (entry.id)}
      <div
        class="pick__option"
        tabindex="-1"
        id={`pick-option-${position}`}
        role="option"
        aria-selected={position === active}
        data-current={entry.current ? 'true' : undefined}
        style:--pick-color={entry.color}
        onmousemove={() => (active = position)}
        onclick={() => {
          active = position;
          choose();
        }}
        onkeydown={(event) => event.key === 'Enter' && choose()}
      >
        <span class="pick__kind">{entry.kind}</span>
        <span class="pick__label">
          {#each highlight(entry.label, match.positions) as run, at (at)}
            {#if run.matched}<mark class="pick__match">{run.text}</mark>{:else}<span>{run.text}</span>{/if}
          {/each}
        </span>
        {#if entry.swatch && entry.swatch.length > 0}
          <span class="pick__swatch" aria-hidden="true">{#each entry.swatch as color (color)}<i style:background-color={color}></i>{/each}</span>
        {/if}
        {#if entry.hint}<span class="pick__hint">{entry.hint}</span>{/if}
      </div>
    {/each}
    {#if ranked.length === 0}<p class="pick__empty">{s['pickNothing'] ?? ''}</p>{/if}
  </div>
  {#if mode === 'theme' && accents}
    <div class="pick__accents">
      <span class="pick__accents-label">{s['pickAccent'] ?? ''}: {accent}</span>
      {#each accents.options as option (option.name)}
        <button
          type="button"
          class="pick__accent"
          title={option.name}
          aria-label={option.name}
          aria-pressed={option.name === accent}
          style:background-color={accentColor(option.name)}
          onclick={() => {
            accent = option.name;
            preview();
          }}
        ></button>
      {/each}
    </div>
  {/if}
  <p class="pick__keys">{keys}</p>
</dialog>
