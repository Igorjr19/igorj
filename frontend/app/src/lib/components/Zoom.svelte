<script lang="ts">
  import type { Snippet } from 'svelte';

  import BackLink from './BackLink.svelte';

  let { title, page = false, back, children }: { title: string; page?: boolean; back?: string; children: Snippet } = $props();
</script>

<!-- An inner page as one article: the heading, then the body; a page being read gets a column narrow enough to read comfortably. -->
<article class={['zoom', page && 'zoom--page']} aria-labelledby="page-title">
  {#if back}<BackLink fallback={back} />{/if}
  <h1 class="zoom__title" id="page-title">{title}</h1>
  <div class={['zoom__body', page && 'prose']}>
    {@render children()}
  </div>
</article>
