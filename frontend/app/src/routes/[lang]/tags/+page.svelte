<script lang="ts">
  import PageMeta from '#lib/components/PageMeta.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import { useShell } from '#lib/shell.svelte.ts';

  const shell = useShell();
  let { data } = $props();
  const title = $derived(shell.t('sectionTags'));
</script>

<PageMeta {title} />
<Zoom {title}>
  <p class="tag-cloud">
    {#each data.tags as tag (tag.slug)}
      <a class="chip" href={`/${shell.language}/tags/${tag.slug}/`}>{tag.name} <span class="panel__meta">{tag.count}</span></a>
    {/each}
  </p>
</Zoom>
