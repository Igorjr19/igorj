<script lang="ts">
  import { goto } from '$app/navigation';
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
  /** The language picked in the box: nothing changes on the page until it is applied. */
  let chosen = $state(shell.language);

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

  function open(): void {
    chosen = shell.language;
    dialog?.showModal();
  }

  /** The box closes first, and the page changes once it is gone: a page that changes under a box still fading out shows both. */
  async function apply(): Promise<void> {
    const target = options.find((option) => option.language === chosen);
    dialog?.close();
    await Promise.allSettled((dialog?.getAnimations() ?? []).map((animation) => animation.finished));
    if (target && !target.current) {
      remember(target.language);
      await goto(target.href);
    }
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
  <button type="button" class={`lang lang--${where}`} aria-haspopup="dialog" aria-label={shell.t('languages')} onclick={open}>
    <Icon name="language" /><span lang={current.locale}>{current.label}</span>
  </button>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <!-- biome-ignore lint/a11y/useKeyWithClickEvents: the click on the backdrop is a mouse shortcut; Escape and the cancel button are the keyboard ways -->
  <dialog class="panel lang-menu" aria-label={shell.t('languages')} bind:this={dialog} onclick={(event) => closeOnOutside(dialog, event)}>
    <p class="panel__title">{shell.t('languages')}</p>
    <fieldset class="lang-menu__list">
      <legend class="sr-only">{shell.t('languages')}</legend>
      {#each options as { language, info, href } (language)}
        <label class="lang-menu__option">
          <input type="radio" name={`language-${where}`} value={language} data-href={href} bind:group={chosen} />
          <span lang={info.locale}>{info.name}</span>
          <span class="lang-menu__code">{info.label}</span>
        </label>
      {/each}
    </fieldset>
    <div class="help__actions">
      <button type="button" class="button button--primary" disabled={chosen === shell.language} onclick={apply}>{shell.t('pickApply')}</button>
      <button type="button" class="button" onclick={() => dialog?.close()}>{shell.t('pickCancel')}</button>
    </div>
  </dialog>
{/if}
