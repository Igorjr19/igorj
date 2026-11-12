<script lang="ts">
  import PageTitle from '#lib/components/PageTitle.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import CategoryFilter from '#lib/items/CategoryFilter.svelte';
  import ItemList from '#lib/items/ItemList.svelte';

  let { data } = $props();
</script>

<PageTitle title={data.name} />
<Zoom title={data.name}>
  <CategoryFilter categories={data.categories} current={data.slug} />
  <ItemList items={data.items} />
</Zoom>
