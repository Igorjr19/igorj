<script lang="ts">
  import { onMount } from 'svelte';
  import { browserStorage } from '#lib/browser-storage.ts';
  import { chooseLanguage, LANGUAGE_STORAGE_KEY, SITE_LANGUAGES } from '#lib/language-choice.ts';
  import { languageInfo } from '#lib/languages.ts';
  import { goto } from '$app/navigation';

  // The shelf used to be called listening; the old address leads to it in the visitor's language.
  onMount(() => {
    const saved = browserStorage('localStorage')?.getItem(LANGUAGE_STORAGE_KEY) ?? null;
    void goto(`/${chooseLanguage(saved, navigator.languages ?? [navigator.language])}/shelf/`, { replaceState: true });
  });
</script>

<svelte:head>
  <title>igorj.dev</title>
  <meta name="robots" content="noindex" />
  <noscript><meta http-equiv="refresh" content="0; url=/en/shelf/" /></noscript>
</svelte:head>

<nav aria-label="Languages">
  {#each SITE_LANGUAGES as language (language)}
    <a href={`/${language}/shelf/`} hreflang={languageInfo(language).locale}>{languageInfo(language).label}</a>{' '}
  {/each}
</nav>
