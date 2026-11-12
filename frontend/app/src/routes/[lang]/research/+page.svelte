<script lang="ts">
  import PageTitle from '#lib/components/PageTitle.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import ItemList from '#lib/items/ItemList.svelte';
  import { useShell } from '#lib/shell.svelte.ts';

  const shell = useShell();
  let { data } = $props();
  const title = $derived(shell.t('research'));
</script>

<PageTitle {title} />
<Zoom {title}>
  <ItemList items={data.items} />
</Zoom>
