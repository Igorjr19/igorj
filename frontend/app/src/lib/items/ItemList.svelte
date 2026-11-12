<script lang="ts">
  import { useUi } from '../ui.svelte.ts';
  import ItemRow from './ItemRow.svelte';
  import type { ItemRowData } from './types.ts';

  const ui = useUi();
  let { items }: { items: readonly ItemRowData[] } = $props();

  let selected = $state(0);

  /** The selected item stands out: the one the visitor moved to with the keys or the pointer. */
  function onfocusin(event: FocusEvent): void {
    const row = event.target instanceof Element ? event.target.closest('.item') : null;
    const at = row ? [...(row.parentElement?.children ?? [])].indexOf(row) : -1;
    if (at >= 0) {
      selected = at;
    }
  }
</script>

<div class="items" data-items data-view={ui.view} {onfocusin}>
  <ul class="items__list">
    {#each items as item, index (item.href)}
      <ItemRow {item} selected={index === selected} />
    {/each}
  </ul>
</div>
