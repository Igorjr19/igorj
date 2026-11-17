<script lang="ts">
  import PageMeta from "#lib/components/PageMeta.svelte";
  import CodeBox from '#lib/home/CodeBox.svelte';
  import Hero from '#lib/home/Hero.svelte';
  import ListeningBox from '#lib/home/ListeningBox.svelte';
  import RecentBox from '#lib/home/RecentBox.svelte';
  import SystemBox from '#lib/home/SystemBox.svelte';
  import WatchedBox from '#lib/home/WatchedBox.svelte';

  import { useShell } from '#lib/shell.svelte.ts';

  const shell = useShell();
  let { data } = $props();
  const home = $derived(data.home);
</script>

<PageMeta description={shell.description} />
<div class="home">
  {#if home.hero}<Hero hero={home.hero} />{/if}
  {#if home.boxes.includes('recent')}<RecentBox rows={home.recent} />{/if}
  <div class="home__widgets">
    {#each home.boxes as box (box)}
      {#if box === 'system'}
        <SystemBox system={home.system} />
      {:else if box === 'code' && home.code}
        <CodeBox code={home.code} githubUrl={home.networks['GitHub']} />
      {:else if box === 'listening'}
        <ListeningBox listening={home.listening} url={home.networks['Last.fm']} />
      {:else if box === 'watched'}
        <WatchedBox watched={home.watched} url={home.networks['Letterboxd']} />
      {/if}
    {/each}
  </div>
</div>
