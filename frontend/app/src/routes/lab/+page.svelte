<script lang="ts">
  import { LAB } from '#lib/lab/labels.ts';
</script>

<svelte:head><title>{LAB.title}</title></svelte:head>

<main class="lab__index">
  <h1>{LAB.title}</h1>
  <ul>
    {#each LAB.variants as variant (variant.key)}
      <li>
        <a href={`/lab/${variant.key}/`}><strong>{variant.letter}</strong> {variant.name}</a>
        <p>{variant.note}</p>
      </li>
    {/each}
  </ul>
</main>
