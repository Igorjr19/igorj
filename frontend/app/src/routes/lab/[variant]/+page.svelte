<script lang="ts">
  import BootPage from '#lib/lab/BootPage.svelte';
  import { bootLines } from '#lib/lab/boot.ts';
  import LabBar from '#lib/lab/LabBar.svelte';
  import { LAB } from '#lib/lab/labels.ts';
  import MonitorPage from '#lib/lab/MonitorPage.svelte';
  import PatternPage from '#lib/lab/PatternPage.svelte';

  let { data } = $props();
  const variant = $derived(LAB.variants.find((candidate) => candidate.key === data.variant));
</script>

<svelte:head><title>{variant?.letter} · {LAB.title}</title></svelte:head>

<LabBar current={data.variant} />
{#if data.variant === 'monitor'}
  <MonitorPage />
{:else if data.variant === 'boot'}
  <BootPage lines={bootLines(data.system)} />
{:else}
  <PatternPage />
{/if}
