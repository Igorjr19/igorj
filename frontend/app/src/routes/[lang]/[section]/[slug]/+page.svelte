<script lang="ts">
  import PageTitle from '#lib/components/PageTitle.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import ItemPage from '#lib/items/ItemPage.svelte';

  let { data } = $props();
</script>

<PageTitle title={data.item.title} />
<Zoom title={data.item.title} page>
  <ItemPage item={data.item} />
</Zoom>
