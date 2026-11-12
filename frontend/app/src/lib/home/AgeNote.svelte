<script lang="ts">
  import { useShell } from '../shell.svelte.ts';

  const shell = useShell();
  let { updated }: { updated: string | null } = $props();

  // biome-ignore lint/style/useNamingConvention: the strings files name the placeholder Date
  const note = $derived(updated ? shell.t('dataFrom', { Date: updated }) : '');
</script>

<!-- Data a week old or more says when it was saved, so a stalled daily job does not pass as fresh. -->
{#if note}
  <p class="panel__meta">{note}</p>
{/if}
