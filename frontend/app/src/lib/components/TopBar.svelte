<script lang="ts">
  import { page } from '$app/state';
  import { sameEverywhere } from '../alternates.ts';
  import { LANGUAGE_STORAGE_KEY } from '../language-choice.ts';
  import { languageInfo } from '../languages.ts';
  import { isReadingPage } from '../layout.ts';
  import { useShell } from '../shell.svelte.ts';
  import { useUi } from '../ui.svelte.ts';
  import Icon from './Icon.svelte';

  const shell = useShell();
  const ui = useUi();
  const tools = $derived([
    { key: 'search', icon: 'magnifying-glass', label: shell.t('keyFind'), shortcut: 'f', run: () => (ui.pick = 'palette') },
    { key: 'theme', icon: 'circle-half-stroke', label: shell.t('keyTheme'), shortcut: 't', run: () => (ui.pick = 'theme') },
    { key: 'terminal', icon: 'terminal', label: shell.t('keyTerminal'), shortcut: ':', run: () => (ui.terminalOpen = !ui.terminalOpen) },
    { key: 'help', icon: 'circle-question', label: shell.t('keyHelp'), shortcut: '?', run: () => (ui.helpOpen = true) },
  ] as const);
  const sideHidden = $derived(ui.sideHidden(isReadingPage(page.url.pathname)));

  /** Where the page sits: `~` for the home, then one entry per address segment after the language. */
  const crumbs = $derived.by(() => {
    const segments = page.url.pathname.split('/').filter(Boolean).slice(1);
    return segments.map((segment, index) => ({
      href: `/${shell.language}/${segments.slice(0, index + 1).join('/')}/`,
      label: index === 0 ? shell.sectionLabel(segment) : segment,
    }));
  });

  /** Choosing a language with the switcher is remembered, so the root address honors it next time. */
  function remember(language: string): void {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Storage blocked: the browser language keeps deciding at the root.
    }
  }

  function alternatesOf(language: string): string {
    const given = (page.data.alternates as Record<string, string> | undefined)?.[language];
    return given ?? sameEverywhere(page.url.pathname, shell.language, shell.languages)[language] ?? `/${language}/`;
  }

  /** The same page in the other languages when the page has a twin there, otherwise their home. */
  const other = $derived(
    shell.languages
      .filter((language) => language !== shell.language)
      .map((language) => ({
        language,
        href: alternatesOf(language),
        info: languageInfo(language),
      })),
  );
</script>

<header class="win__top">
  <a class="win__site" href={`/${shell.language}/`}>{shell.host}</a>
  <button
    type="button"
    class="win__button win__side-toggle"
    aria-label={shell.t('keySide')}
    aria-pressed={!sideHidden}
    onclick={() => ui.toggleSide(isReadingPage(page.url.pathname))}><Icon name="table-columns" /></button
  >
  <nav class="win__path" aria-label={shell.t('path')}>
    <ol>
      <li><a href={`/${shell.language}/`} aria-current={crumbs.length === 0 ? 'page' : undefined}>~</a></li>
      {#each crumbs as crumb, index (crumb.href)}
        <li><a href={crumb.href} aria-current={index === crumbs.length - 1 ? 'page' : undefined}>{crumb.label}</a></li>
      {/each}
    </ol>
  </nav>
  <div class="win__controls">
    {#each tools as tool (tool.key)}
      <button
        type="button"
        class="win__button win__tool"
        aria-label={tool.label}
        aria-keyshortcuts={tool.shortcut}
        data-tip={`${tool.label} · ${tool.shortcut}`}
        onclick={(event) => {
          event.currentTarget.setAttribute('data-quiet', '');
          tool.run();
        }}
        onpointerleave={(event) => event.currentTarget.removeAttribute('data-quiet')}
        onblur={(event) => event.currentTarget.removeAttribute('data-quiet')}><Icon name={tool.icon} /></button
      >
    {/each}
    {#if other.length > 0}
      <nav class="win__languages" aria-label={shell.t('languages')}>
        {#each other as { language, href, info } (language)}
          <a {href} hreflang={info.locale} lang={info.locale} onclick={() => remember(language)}>{info.label}</a>
        {/each}
      </nav>
    {/if}
  </div>
</header>
