<script lang="ts">
  import starUrl from '@fortawesome/fontawesome-free/svgs/solid/star.svg?url';
  import PageMeta from '#lib/components/PageMeta.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import AgeNote from '#lib/home/AgeNote.svelte';
  import { listeningBars } from '#lib/home/data.ts';
  import { useShell } from '#lib/shell.svelte.ts';

  const shell = useShell();
  let { data } = $props();

  const title = $derived(shell.t('paneShelf'));
  const bars = $derived(data.music ? listeningBars(data.music.artists, data.music.artists.length) : null);
  const oneDecimal = $derived(new Intl.NumberFormat(shell.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  const kinds = { book: 'kindBook', paper: 'kindPaper' } as const;
</script>

<PageMeta {title} />
<Zoom {title}>
  <div class="shelf">
    <section aria-labelledby="music-title">
      <h2 class="label" id="music-title">{shell.t('panelListening')}</h2>
      {#if data.music && bars}
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

    <section aria-labelledby="films-title">
      <h2 class="label" id="films-title">{shell.t('panelWatched')}</h2>
      {#if data.films}
        <AgeNote updated={data.films.updatedLate} />
        <ul class="films">
          {#each data.films.films as film (film.title + film.year)}
            <li class="films__row">
              <span class="films__title">{#if film.url}<a href={film.url}>{film.title}</a>{:else}<cite>{film.title}</cite>{/if}</span>
              <span class="films__year">{film.year}</span>
              {#if film.rating !== undefined}
                <span class="films__rating"
                  ><span class="stars" aria-hidden="true" style:--rating={film.rating} style:--star={`url('${starUrl}')`}></span><span class="sr-only"
                    >{shell.t('rating', oneDecimal.format(film.rating))}</span
                  ></span
                >
              {/if}
            </li>
          {/each}
        </ul>
        <p class="panel__meta">{shell.t('sourceLetterboxd')}</p>
      {:else}
        <p class="panel__meta">{shell.t('noData')}</p>
      {/if}
    </section>

    <section aria-labelledby="reading-title">
      <h2 class="label" id="reading-title">{shell.t('panelReading')}</h2>
      {#if data.reading.length > 0}
        <ul class="films">
          {#each data.reading as book (book.title)}
            <li class="films__row films__row--reading">
              <span class="films__title">{#if book.url}<a href={book.url}>{book.title}</a>{:else}<cite>{book.title}</cite>{/if}</span>
              <span class="films__year">{shell.t(kinds[book.kind])}</span>
              <span class="films__authors">{book.authors.join(', ')}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="panel__meta">{shell.t('noData')}</p>
      {/if}
    </section>
  </div>
</Zoom>
