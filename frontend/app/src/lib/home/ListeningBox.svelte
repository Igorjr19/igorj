<script lang="ts">
  import { useShell } from '../shell.svelte.ts';
  import AgeNote from './AgeNote.svelte';
  import BoxTitle from './BoxTitle.svelte';
  import SeeAll from './SeeAll.svelte';
  import type { HomeData } from './types.ts';

  const shell = useShell();
  let { listening, url }: { listening: HomeData['listening']; url?: string | undefined } = $props();
</script>

<!-- The week's artists as bars scaled to the most played one. -->
<section class="panel widget" id="listening" aria-labelledby="listening-title">
  <BoxTitle id="listening" label={shell.t('panelListening')} {url} />
  {#if listening}
    <p class="panel__meta">{shell.t('playsTotal', listening.total)}</p>
    <AgeNote updated={listening.updatedLate} />
    <ol class="bars">
      {#each listening.bars as artist (artist.name)}
        <li class="bars__row">
          <span class="bars__name">{#if artist.url}<a href={artist.url}>{artist.name}</a>{:else}{artist.name}{/if}</span>
          <span class="bars__track" aria-hidden="true"><span class="bars__fill" style:inline-size={`${artist.percent}%`}></span></span>
          <span class="bars__count">{shell.t('plays', artist.plays)}</span>
        </li>
      {/each}
    </ol>
    <SeeAll />
  {:else}
    <p class="panel__meta">{shell.t('noData')}</p>
  {/if}
</section>
