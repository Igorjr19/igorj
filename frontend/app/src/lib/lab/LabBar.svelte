<script lang="ts">
  import { LAB } from './labels.ts';

  let { current }: { current: string } = $props();
</script>

<nav class="lab__bar" aria-label={LAB.title}>
  <a href="/lab/">← {LAB.back}</a>
  {#each LAB.variants as variant (variant.key)}
    <a href={`/lab/${variant.key}/`} aria-current={variant.key === current ? 'page' : undefined}>{variant.letter}</a>
  {/each}
</nav>
