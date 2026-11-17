<script lang="ts">
  import starUrl from '@fortawesome/fontawesome-free/svgs/solid/star.svg?url';
  import { cssUrl } from '../css-url.ts';
  import { useShell } from '../shell.svelte.ts';
  import { hideIfBroken } from './fallback.ts';
  import { posterSources } from './posters.ts';

  interface Film {
    readonly title: string;
    readonly year: number;
    readonly rating?: number | undefined;
    readonly url?: string | undefined;
    readonly poster?: string | undefined;
  }

  const shell = useShell();
  let { films }: { films: readonly Film[] } = $props();
  const oneDecimal = $derived(new Intl.NumberFormat(shell.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
</script>

<ul class="posters">
  {#each films as film (film.title + film.year)}
    {@const sources = film.poster ? posterSources(film.poster) : null}
    <li class="poster">
      <svelte:element this={film.url ? 'a' : 'span'} class="poster__art" href={film.url}>
        <span class="poster__card">
          <cite class="poster__title">{film.title}</cite>
        </span>
        {#if sources}
          <img class="poster__image" {...sources} sizes="230px" alt="" loading="lazy" referrerpolicy="no-referrer" use:hideIfBroken />
        {/if}
      </svelte:element>
      <p class="poster__stub">
        <span class="poster__year">{film.year}</span>
        {#if film.rating !== undefined}
          <span class="stars" aria-hidden="true" style:--rating={film.rating} style:--star={cssUrl(starUrl)}></span>
          <span class="sr-only">{shell.t('rating', oneDecimal.format(film.rating))}</span>
        {/if}
      </p>
    </li>
  {/each}
</ul>
