<script lang="ts">
  import PageMeta from '#lib/components/PageMeta.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import AgeNote from '#lib/home/AgeNote.svelte';
  import { listeningBars } from '#lib/home/data.ts';
  import Posters from '#lib/shelf/Posters.svelte';
  import Record from '#lib/shelf/Record.svelte';
  import Spines from '#lib/shelf/Spines.svelte';
  import { useShell } from '#lib/shell.svelte.ts';

  const shell = useShell();
  let { data } = $props();

  const title = $derived(shell.t('paneShelf'));
  const bars = $derived(data.music ? listeningBars(data.music.artists, data.music.artists.length) : null);
</script>

<PageMeta {title} />
<Zoom {title}>
  <div class="shelf">
    <section aria-labelledby="music-title">
      <h2 class="label" id="music-title">{shell.t('panelListening')}</h2>
      {#if data.music && bars}
        {#if data.music.album}<Record album={data.music.album} />{/if}
        <p class="panel__meta">{shell.t(data.music.period === 'month' ? 'periodMonth' : 'periodWeek')} · {shell.t('playsTotal', bars.total)}</p>
        <AgeNote updated={data.music.updatedLate} />
        <ol class="bars">
          {#each bars.bars as artist (artist.name)}
            <li class="bars__row">
              <span class="bars__name">{#if artist.url}<a href={artist.url}>{artist.name}</a>{:else}{artist.name}{/if}</span>
              <span class="bars__track" aria-hidden="true"><span class="bars__fill" style:inline-size={`${artist.percent}%`}></span></span>
              <span class="bars__count">{shell.t('plays', artist.plays)}</span>
            </li>
          {/each}
        </ol>
        <p class="panel__meta">{shell.t('sourceLastfm')}</p>
      {:else}
        <p class="panel__meta">{shell.t('noData')}</p>
      {/if}
    </section>

    <section class="shelf__wide" aria-labelledby="films-title">
      <h2 class="label" id="films-title">{shell.t('panelWatched')}</h2>
      {#if data.films}
        <AgeNote updated={data.films.updatedLate} />
        <Posters films={data.films.films} />
        <p class="panel__meta">{shell.t('sourceLetterboxd')}</p>
      {:else}
        <p class="panel__meta">{shell.t('noData')}</p>
      {/if}
    </section>

    <section class="shelf__wide" aria-labelledby="reading-title">
      <h2 class="label" id="reading-title">{shell.t('panelReading')}</h2>
      {#if data.reading.length > 0}
        <Spines books={data.reading} />
      {:else}
        <p class="panel__meta">{shell.t('noData')}</p>
      {/if}
    </section>
  </div>
</Zoom>
