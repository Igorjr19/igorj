<script lang="ts">
  import PageMeta from '#lib/components/PageMeta.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import CvView from '#lib/cv/CvView.svelte';
  import { useShell } from '#lib/shell.svelte.ts';

  const shell = useShell();
  let { data } = $props();
  const title = $derived(shell.t('cv'));
</script>

<PageMeta {title} />
<Zoom {title}>
  {#if data.cv}
    <CvView cv={data.cv} shownIn={data.shownIn} />
  {:else}
    <p class="panel__meta">{shell.t('noData')}</p>
  {/if}
</Zoom>
