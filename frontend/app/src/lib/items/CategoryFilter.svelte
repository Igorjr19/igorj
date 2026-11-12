<script lang="ts">
  import { useShell } from '../shell.svelte.ts';

  const shell = useShell();
  let {
    categories,
    current,
  }: { categories: readonly { slug: string; name: string; count: number }[]; current: string | null } = $props();
</script>

<nav class="filter" aria-label={shell.t('filterLabel')}>
  <ul>
    <li><a href={`/${shell.language}/posts/`} aria-current={current === null ? 'page' : undefined}>{shell.t('filterAll')}</a></li>
    {#each categories as category (category.slug)}
      <li>
        <a href={`/${shell.language}/categories/${category.slug}/`} aria-current={current === category.slug ? 'page' : undefined}>{category.name}</a>
        <span class="panel__meta">{category.count}</span>
      </li>
    {/each}
  </ul>
</nav>
