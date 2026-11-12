<script lang="ts">
  import PageTitle from '#lib/components/PageTitle.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import CategoryFilter from '#lib/items/CategoryFilter.svelte';
  import ItemList from '#lib/items/ItemList.svelte';
  import { useShell } from '#lib/shell.svelte.ts';

  const shell = useShell();
  let { data } = $props();
  const title = $derived(shell.t('panelPosts'));
</script>

<PageTitle {title} />
<Zoom {title}>
  <CategoryFilter categories={data.categories} current={null} />
  <ItemList items={data.items} />
</Zoom>
