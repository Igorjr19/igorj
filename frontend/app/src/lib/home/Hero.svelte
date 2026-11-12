<script lang="ts">
  import Dither from '../components/Dither.svelte';
  import NameArt from '../components/NameArt.svelte';
  import type { HeroData } from './types.ts';

  let { hero }: { hero: HeroData } = $props();
</script>

<section class="hero" aria-labelledby="hero-name">
  {#if hero.photo}
    <Dither class="hero__photo" picture={hero.photo} alt={hero.photo.alt} ink="var(--color-accent)" />
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
