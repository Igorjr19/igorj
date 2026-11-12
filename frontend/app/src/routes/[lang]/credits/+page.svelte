<script lang="ts">
  import PageTitle from '#lib/components/PageTitle.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import { useShell } from '#lib/shell.svelte.ts';
  import { REPOSITORY } from '#lib/site.ts';

  const shell = useShell();
  let { data } = $props();
  const title = $derived(shell.t('credits'));
  // biome-ignore lint/style/useNamingConvention: the strings files name the placeholders Author and Repository
  const rights = $derived(shell.t('creditsRights', { Author: shell.author, Repository: REPOSITORY }));
</script>

<PageTitle {title} />
<Zoom {title}>
  <!-- The sentence comes from the interface strings and holds one link to the repository. -->
  <p>{@html rights}</p>
  <p>{shell.t('creditsIntro')}</p>
  <dl class="facts credits credits--material">
    {#each data.material as entry (entry.name)}
      <dt>{entry.name}</dt>
      <dd><a href={entry.homepage}>{entry.homepage}</a> <span class="panel__meta">{entry.note}</span></dd>
    {/each}
  </dl>
  <p><a href="/third-party-licenses.txt">{shell.t('creditsTexts')}</a></p>
  {#if data.sources.length > 0}
    <p>{shell.t('creditsData')}</p>
    <dl class="facts credits credits--data">
      {#each data.sources as source (source.name)}
        <dt>{source.name}</dt>
        <dd><a href={source.homepage}>{source.homepage}</a> <span class="panel__meta">{shell.t(source.note)}</span></dd>
      {/each}
    </dl>
  {/if}
</Zoom>
