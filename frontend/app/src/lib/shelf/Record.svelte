<script lang="ts">
  import { initialOf } from '../../../tools/image/initial.ts';
  import { useShell } from '../shell.svelte.ts';
  import { hideIfBroken } from './fallback.ts';

  interface Album {
    readonly title: string;
    readonly artist: string;
    readonly url?: string | undefined;
    readonly cover?: string | undefined;
  }

  const shell = useShell();
  let { album }: { album: Album } = $props();
</script>

<figure class="record">
  <div class="record__disc" aria-hidden="true">
    <span class="record__label" data-initial={initialOf(album.title)}>
      {#if album.cover}
        <img class="record__cover" src={album.cover} alt="" loading="lazy" referrerpolicy="no-referrer" use:hideIfBroken />
      {/if}
    </span>
  </div>
  <figcaption class="record__caption">
    <span class="panel__meta">{shell.t('albumOfTheWeek')}</span>
    <cite class="record__title">{#if album.url}<a href={album.url}>{album.title}</a>{:else}{album.title}{/if}</cite>
    <span class="record__artist">{album.artist}</span>
  </figcaption>
</figure>
