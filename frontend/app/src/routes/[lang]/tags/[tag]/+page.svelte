<script lang="ts">
  import PageMeta from '#lib/components/PageMeta.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import ItemList from '#lib/items/ItemList.svelte';
  import ItemsBar from '#lib/items/ItemsBar.svelte';
  import { useShell } from '#lib/shell.svelte.ts';

  const shell = useShell();
  let { data } = $props();
</script>

<PageMeta title={data.name} alternates={data.alternates} />
<Zoom title={data.name}>
  <ItemsBar feed={`/${shell.language}/tags/${data.tag}/index.xml`} />
  <ItemList items={data.items} />
</Zoom>
