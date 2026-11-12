<script lang="ts">
  import starUrl from '@fortawesome/fontawesome-free/svgs/solid/star.svg?url';
  import { useShell } from '../shell.svelte.ts';
  import AgeNote from './AgeNote.svelte';
  import BoxTitle from './BoxTitle.svelte';
  import SeeAll from './SeeAll.svelte';
  import type { HomeData } from './types.ts';

  const shell = useShell();
  let { watched, url }: { watched: HomeData['watched']; url?: string | undefined } = $props();

  const oneDecimal = $derived(new Intl.NumberFormat(shell.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
</script>

<section class="panel widget" id="watched" aria-labelledby="watched-title">
  <BoxTitle id="watched" label={shell.t('panelWatched')} {url} />
  {#if watched}
    <AgeNote updated={watched.updatedLate} />
    <ul class="films">
      {#each watched.films as film (film.title)}
        <li class="films__row">
          <span class="films__title">{#if film.url}<a href={film.url}>{film.title}</a>{:else}<cite>{film.title}</cite>{/if}</span>
          <span class="films__year">{film.year}</span>
          {#if film.rating !== null}
            <span class="films__rating"
              ><span class="stars" aria-hidden="true" style:--rating={film.rating} style:--star={`url('${starUrl}')`}></span><span class="sr-only"
                >{shell.t('rating', oneDecimal.format(film.rating))}</span
              ></span
            >
          {/if}
        </li>
      {/each}
    </ul>
    <SeeAll />
  {:else}
    <p class="panel__meta">{shell.t('noData')}</p>
  {/if}
</section>
