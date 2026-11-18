<script lang="ts">
  import { page } from '$app/state';
  import { sameEverywhere } from '../alternates.ts';
  import { LANGUAGE_STORAGE_KEY } from '../language-choice.ts';
  import { languageInfo } from '../languages.ts';
  import { useShell } from '../shell.svelte.ts';

  let { where }: { where: 'top' | 'status' } = $props();
  const shell = useShell();

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

  /** The language in use first, then the others as links to the same page in them, or to their home. */
  const others = $derived(
    shell.languages
      .filter((language) => language !== shell.language)
      .map((language) => ({ language, href: alternatesOf(language), info: languageInfo(language) })),
  );
  const current = $derived(languageInfo(shell.language));
</script>

{#if others.length > 0}
  <!-- One control for the language: the one in use, and the way to the others. It sits in the top line on a phone and in the status line elsewhere. -->
  <ul class={`lang lang--${where}`} aria-label={shell.t('languages')}>
    <li><span class="lang__current" lang={current.locale} aria-current="true">{current.label}</span></li>
    {#each others as { language, href, info } (language)}
      <li><a {href} hreflang={info.locale} lang={info.locale} onclick={() => remember(language)}>{info.label}</a></li>
    {/each}
  </ul>
{/if}
