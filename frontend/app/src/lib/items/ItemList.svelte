<script lang="ts">
  import ItemRow from './ItemRow.svelte';
  import type { ItemRowData } from './types.ts';

  let { items }: { items: readonly ItemRowData[] } = $props();
</script>

<div class="items" data-items>
  <ul class="items__list">
    {#each items as item (item.href)}
      <ItemRow {item} />
    {/each}
  </ul>
</div>
