<script lang="ts">
  import { onMount } from 'svelte';
  import Dither from '../components/Dither.svelte';
  import NameArt from '../components/NameArt.svelte';
  import { lightPhoto } from '../name/animate.ts';
  import type { HeroData } from './types.ts';

  let { hero }: { hero: HeroData } = $props();
  let section: HTMLElement | undefined = $state();

  onMount(() => {
    const photo = section?.querySelector<HTMLElement>('.hero__photo');
    return photo ? lightPhoto(photo) : undefined;
  });
</script>

<section class="hero" aria-labelledby="hero-name" bind:this={section}>
  {#if hero.photo}
    <Dither class="hero__photo" fill picture={hero.photo} alt={hero.photo.alt} ink="var(--color-accent)" />
  {/if}
  <div class="hero__text">
    <NameArt name={hero.author} />
    <p class="hero__role">
      {hero.role}{#if hero.location}<span class="hero__location">{' · '}{hero.location}</span>{/if}<span class="cursor" aria-hidden="true"></span>
    </p>
    <ul class="hero__lines">
      {#each hero.lines as line (line)}
        <li>{line}</li>
      {/each}
    </ul>
  </div>
</section>
