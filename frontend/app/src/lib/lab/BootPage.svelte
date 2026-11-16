<script lang="ts">
  import { onMount } from 'svelte';
  import { type BootControl, startBoot } from './boot-scene.ts';
  import { LAB } from './labels.ts';
  import type { Rect } from './screen-rect.ts';

  let { lines }: { lines: readonly string[] } = $props();

  /** Below this width a monitor leaves too little screen for the page, so the page takes the whole window. */
  const NARROW = 900;
  let stage: HTMLDivElement | undefined = $state();
  let failed = $state(false);
  let lit = $state(false);
  let rect = $state<Rect | null>(null);
  let flat = $state(false);
  let control: BootControl | null = null;

  onMount(() => {
    const host = stage;
    if (innerWidth < NARROW) {
      flat = true;
      return;
    }
    let closed = false;
    if (host) {
      void startBoot(host, lines, {
        onLanded: () => {
          lit = true;
        },
        onRect: (next) => {
          rect = next;
        },
      }).then((started) => {
        if (closed) {
          started?.stop();
        } else {
          control = started;
          failed = started === null;
          flat = started === null;
        }
      });
    }
    return () => {
      closed = true;
      control?.stop();
    };
  });

  const skip = (): void => {
    if (control) {
      control.land();
    } else {
      lit = true;
    }
  };
</script>

<svelte:window onkeydown={skip} onclick={skip} />

{#if flat}
  <iframe class="lab__takeover" src="/en/" title="igorj.dev"></iframe>
{:else}
  <div class="lab__stage" bind:this={stage}>
    {#if failed}<p class="lab__note">{LAB.noWebgl}</p>{/if}
  </div>
  {#if lit && rect}
    <div class="lab__monitor-window" style:left={`${rect.left}px`} style:top={`${rect.top}px`} style:width={`${rect.width}px`} style:height={`${rect.height}px`}>
      <iframe src="/en/" title="igorj.dev"></iframe>
      <div class="lab__glass"></div>
    </div>
  {/if}
{/if}
<div class="lab__actions">
  <button type="button" onclick={skip}>{LAB.skip}</button>
  <button type="button" onclick={() => location.reload()}>{LAB.replay}</button>
</div>
