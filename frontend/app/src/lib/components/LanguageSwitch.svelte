<script lang="ts">
  import { page } from '$app/state';
  import { sameEverywhere } from '../alternates.ts';
  import { LANGUAGE_STORAGE_KEY } from '../language-choice.ts';
  import { languageInfo } from '../languages.ts';
  import { closeOnOutside } from '../modal.ts';
  import { useShell } from '../shell.svelte.ts';
  import Icon from './Icon.svelte';

  let { where }: { where: 'top' | 'status' } = $props();
  const shell = useShell();
  let dialog: HTMLDialogElement | undefined = $state();

  /** Choosing a language is remembered, so the root address honors it next time. */
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

  /** Every language of the site: the one in use, and for each of the others the same page in it, or its home. */
  const options = $derived(
    shell.languages.map((language) => ({
      language,
      info: languageInfo(language),
      current: language === shell.language,
      href: alternatesOf(language),
    })),
  );
  const current = $derived(languageInfo(shell.language));
</script>

{#if options.length > 1}
  <!-- One control for the language: the one in use, which opens the choice. It sits in the top line on a phone and in the status line elsewhere. -->
  <button type="button" class={`lang lang--${where}`} aria-haspopup="dialog" aria-label={shell.t('languages')} onclick={() => dialog?.showModal()}>
    <Icon name="language" /><span lang={current.locale}>{current.label}</span>
  </button>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <!-- biome-ignore lint/a11y/useKeyWithClickEvents: the click on the backdrop is a mouse shortcut; Escape and the close button are the keyboard ways -->
  <dialog class="panel lang-menu" aria-label={shell.t('languages')} bind:this={dialog} onclick={(event) => closeOnOutside(dialog, event)}>
    <p class="panel__title">{shell.t('languages')}</p>
    <ul class="lang-menu__list">
      {#each options as { language, info, current: inUse, href } (language)}
        <li>
          {#if inUse}
            <span class="lang-menu__option" aria-current="true" lang={info.locale}>{info.name}<span>{info.label}</span></span>
          {:else}
            <a class="lang-menu__option" {href} hreflang={info.locale} lang={info.locale} onclick={() => remember(language)}>{info.name}<span>{info.label}</span></a>
          {/if}
        </li>
      {/each}
    </ul>
    <form class="help__actions" method="dialog">
      <button type="submit" class="button">{shell.t('helpClose')}</button>
    </form>
  </dialog>
{/if}
