<script lang="ts">
  import PageMeta from '#lib/components/PageMeta.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import ItemList from '#lib/items/ItemList.svelte';
  import { useShell } from '#lib/shell.svelte.ts';

  const shell = useShell();
  let { data } = $props();
  const title = $derived(shell.t('research'));
</script>

<PageMeta {title} />
<Zoom {title}>
  <ItemList items={data.items} />
</Zoom>
