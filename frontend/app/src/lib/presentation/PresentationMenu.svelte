<script lang="ts">
  import { onMount } from 'svelte';
  import { browserStorage } from '../browser-storage.ts';
  import { useShell } from '../shell.svelte.ts';
  import { PRESENTATION_KEY, type Presentation, parsePresentation } from './presentation.ts';

  const shell = useShell();
  let capable = $state(false);
  let current = $state<Presentation>('simple');
  let open = $state(false);
  let button = $state<HTMLButtonElement>();

  onMount(() => {
    const root = document.documentElement;
    capable = root.dataset['sceneCapable'] !== undefined;
    current = parsePresentation(root.dataset['presentation']) ?? 'simple';
  });

  function choose(next: Presentation): void {
    if (next === current) {
      return;
    }
    current = next;
    try {
      browserStorage('localStorage')?.setItem(PRESENTATION_KEY, next);
    } catch {
      // Storage blocked: the choice lasts only until the next visit.
    }
    location.reload();
  }

  function close(): void {
    open = false;
    button?.focus();
  }
</script>

<svelte:window
  onpointerdown={(event) => {
    if (open && !(event.target as Element).closest('.presentation')) {
      open = false;
    }
  }}
  onkeydown={(event) => {
    if (open && event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  }}
/>

{#if capable}
  <div class="presentation">
    <button
      type="button"
      class="presentation__button"
      bind:this={button}
      aria-expanded={open}
      aria-controls="presentation-menu"
      aria-label={shell.t('presentationButton')}
      title={shell.t('presentationButton')}
      onclick={() => (open = !open)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </svg>
    </button>
    {#if open}
      <div class="presentation__menu" id="presentation-menu">
        <fieldset class="presentation__group">
          <legend class="presentation__legend">{shell.t('presentationLegend')}</legend>
          <div class="presentation__options">
            {#each ['scene', 'simple'] as const as option (option)}
              <label class="presentation__option">
                <input type="radio" name="presentation" value={option} checked={current === option} onchange={() => choose(option)} />
                <span>{shell.t(option === 'scene' ? 'presentationScene' : 'presentationSimple')}</span>
              </label>
            {/each}
          </div>
        </fieldset>
      </div>
    {/if}
  </div>
{/if}
