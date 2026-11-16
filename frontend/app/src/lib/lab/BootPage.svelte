<script lang="ts">
  import { onMount } from 'svelte';
  import { startBoot } from './boot-scene.ts';
  import { LAB } from './labels.ts';

  let { lines }: { lines: readonly string[] } = $props();

  let stage: HTMLDivElement | undefined = $state();
  let failed = $state(false);
  let handedOver = $state(false);

  onMount(() => {
    const host = stage;
    let teardown: (() => void) | null = null;
    let closed = false;
    if (host) {
      void startBoot(host, lines, () => {
        handedOver = true;
      }).then((stop) => {
        if (closed) {
          stop?.();
        } else {
          teardown = stop;
          failed = stop === null;
        }
      });
    }
    return () => {
      closed = true;
      teardown?.();
    };
  });

  const skip = (): void => {
    handedOver = true;
  };
</script>

<svelte:window onkeydown={skip} onclick={skip} />

<div class="lab__stage" bind:this={stage}>
  {#if failed}<p class="lab__note">{LAB.noWebgl}</p>{/if}
</div>
{#if handedOver}
  <iframe class="lab__takeover" src="/en/" title="igorj.dev"></iframe>
{/if}
<div class="lab__actions">
  <button type="button" onclick={skip}>{LAB.skip}</button>
  <button type="button" onclick={() => location.reload()}>{LAB.replay}</button>
</div>
