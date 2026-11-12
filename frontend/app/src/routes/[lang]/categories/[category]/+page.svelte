<script lang="ts">
  import PageMeta from '#lib/components/PageMeta.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import CategoryFilter from '#lib/items/CategoryFilter.svelte';
  import ItemList from '#lib/items/ItemList.svelte';

  let { data } = $props();
</script>

<PageMeta title={data.name} alternates={data.alternates} />
<Zoom title={data.name}>
  <CategoryFilter categories={data.categories} current={data.slug} />
  <ItemList items={data.items} />
</Zoom>
