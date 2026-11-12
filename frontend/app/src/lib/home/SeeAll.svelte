<script lang="ts">
  import { useShell } from '../shell.svelte.ts';

  const shell = useShell();
  const shelf = $derived(shell.panes.find((pane) => pane.section.key === 'shelf'));
</script>

<!-- The way from a box to the whole list on the shelf. -->
{#if shelf}
  <p class="widget__more"><a href={shelf.href}>{shell.t('seeAll')} →</a></p>
{/if}
