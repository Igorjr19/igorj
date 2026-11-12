<script lang="ts">
  import { onMount } from 'svelte';
  import { browserStorage } from '#lib/browser-storage.ts';
  import { chooseLanguage, LANGUAGE_STORAGE_KEY, SITE_LANGUAGES } from '#lib/language-choice.ts';
  import { languageInfo } from '#lib/languages.ts';
  import { goto } from '$app/navigation';

  // The root is the only address that picks a language for the visitor: the saved choice, else the browser's.
  onMount(() => {
    const saved = browserStorage('localStorage')?.getItem(LANGUAGE_STORAGE_KEY) ?? null;
    void goto(`/${chooseLanguage(saved, navigator.languages ?? [navigator.language])}/`, { replaceState: true });
  });
</script>

<svelte:head>
  <title>igorj.dev</title>
  <noscript><meta http-equiv="refresh" content="0; url=/en/" /></noscript>
</svelte:head>

<nav aria-label="Languages">
  {#each SITE_LANGUAGES as language (language)}
    <a href={`/${language}/`} hreflang={languageInfo(language).locale}>{languageInfo(language).label}</a>{' '}
  {/each}
</nav>
