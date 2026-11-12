<script lang="ts">
  import PageTitle from '#lib/components/PageTitle.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import { useShell } from '#lib/shell.svelte.ts';

  const shell = useShell();
  let { data } = $props();
  const title = $derived(shell.t('sectionCategories'));
</script>

<PageTitle {title} />
<Zoom {title}>
  <p class="tag-cloud">
    {#each data.categories as category (category.slug)}
      <a class="chip" href={`/${shell.language}/categories/${category.slug}/`}>{category.name} <span class="panel__meta">{category.count}</span></a>
    {/each}
  </p>
</Zoom>
