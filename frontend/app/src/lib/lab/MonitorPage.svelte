<script lang="ts">
  import { onMount } from 'svelte';
  import { LAB } from './labels.ts';
  import { startMonitor } from './monitor.ts';

  let stage: HTMLDivElement | undefined = $state();
  let failed = $state(false);

  onMount(() => {
    const host = stage;
    let teardown: (() => void) | null = null;
    let closed = false;
    if (host) {
      void startMonitor(host).then((stop) => {
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
</script>

<div class="lab__stage" bind:this={stage}>
  {#if failed}<p class="lab__note">{LAB.noWebgl}</p>{/if}
</div>
