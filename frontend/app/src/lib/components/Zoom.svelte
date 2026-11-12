<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title, page = false, children }: { title: string; page?: boolean; children: Snippet } = $props();
</script>

<!-- An inner page as one article: the heading, then the body; a page being read gets a column narrow enough to read comfortably. -->
<article class={['zoom', page && 'zoom--page']} aria-labelledby="page-title">
  <h1 class="zoom__title" id="page-title">{title}</h1>
  <div class={['zoom__body', page && 'prose']}>
    {@render children()}
  </div>
</article>
