<script lang="ts">
  import { useShell } from '../shell.svelte.ts';
  import type { TagData } from './types.ts';

  const shell = useShell();
  let { tags }: { tags: readonly TagData[] } = $props();
</script>

{#if tags.length > 0}
  <p class="item__chips">
    {#each tags as tag (tag.slug)}
      <a class="chip" href={`/${shell.language}/tags/${tag.slug}/`}>{tag.name}</a>
    {/each}
  </p>
{/if}
