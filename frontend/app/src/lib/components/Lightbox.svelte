<script lang="ts">
  import { onMount } from 'svelte';
  import { useShell } from '../shell.svelte.ts';

  const shell = useShell();
  let dialog: HTMLDialogElement | undefined = $state();
  let original = $state<{ src: string; alt: string; full: string } | null>(null);
  let opener: HTMLElement | null = null;

  /** A picture of a page is a button that carries the address of its original; one click or Enter shows it here. */
  onMount(() => {
    const onClick = (event: MouseEvent): void => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-original]') : null;
      if (target?.dataset['original']) {
        opener = target;
        original = { src: target.dataset['original'], alt: target.dataset['alt'] ?? '', full: target.dataset['full'] ?? '' };
      }
    };
    // The picture starts to come as soon as the pointer or the focus is on it, so it is often there by the time it is opened.
    const asked = new Set<string>();
    const onNear = (event: Event): void => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-original]') : null;
      const src = target?.dataset['original'];
      if (src && !asked.has(src)) {
        asked.add(src);
        new Image().src = src;
      }
    };
    document.addEventListener('click', onClick);
    document.addEventListener('pointerover', onNear);
    document.addEventListener('focusin', onNear);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('pointerover', onNear);
      document.removeEventListener('focusin', onNear);
    };
  });

  $effect(() => {
    if (original && dialog && !dialog.open) {
      dialog.showModal();
    }
  });

  function onClose(): void {
    original = null;
    opener?.focus();
    opener = null;
  }

  // A click on the dark around the picture closes it, as the backdrop belongs to the dialog.
  function onBackdrop(event: MouseEvent): void {
    if (event.target === dialog) {
      dialog?.close();
    }
  }
</script>

<!-- biome-ignore lint/a11y/useKeyWithClickEvents: the backdrop click is a mouse shortcut; Escape and the close button are the keyboard ways -->
<dialog class="lightbox" aria-label={original?.alt || shell.t('figureClose')} bind:this={dialog} onclose={onClose} onclick={onBackdrop}>
  {#if original}
    <img class="lightbox__image" src={original.src} alt={original.alt} />
    <p class="lightbox__actions">
      {#if original.full}<a href={original.full} target="_blank" rel="noopener noreferrer">{shell.t('figureOriginal')}</a>{/if}
      <button type="button" class="lightbox__close" onclick={() => dialog?.close()}>esc · {shell.t('figureClose')}</button>
    </p>
  {/if}
</dialog>
