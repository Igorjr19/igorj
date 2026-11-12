<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import { useShell } from '../shell.svelte.ts';
  import { useUi } from '../ui.svelte.ts';

  const shell = useShell();
  const ui = useUi();
  /** The address of the feed this list has, if it has one: the blog and each category and tag. */
  let { feed }: { feed?: string | undefined } = $props();
</script>

<div class="items__bar">
  <div class="items__tools">
    <fieldset class="view-switch">
      <legend class="sr-only">{shell.t('viewLabel')}</legend>
      <button type="button" aria-pressed={ui.view === 'list'} onclick={() => (ui.view = 'list')}><Icon name="list" />{shell.t('viewList')}</button>
      <button type="button" aria-pressed={ui.view === 'grid'} onclick={() => (ui.view = 'grid')}><Icon name="table-cells-large" />{shell.t('viewGrid')}</button>
    </fieldset>
    {#if feed}
      <a class="items__feed" href={feed} title="RSS"><Icon name="rss" /><span class="sr-only">{shell.t('feedAll')}</span></a>
    {/if}
  </div>
</div>
