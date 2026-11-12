<script lang="ts">
  let {
    picture,
    alt,
    ink,
    class: extra = '',
    fill = false,
  }: {
    picture: { src: string; inverted: string; width: number; height: number };
    alt?: string | undefined;
    /** A CSS color for the dots; the theme's text color when none is given. */
    ink?: string | undefined;
    class?: string;
    /** Takes the height its container gives, cropping at the sides, instead of keeping the picture's own proportions. */
    fill?: boolean;
  } = $props();
</script>

{#snippet layers()}
  <span class="dither__ink dither__ink--on-bright"></span>
  <span class="dither__ink dither__ink--on-dark"></span>
{/snippet}

<!-- Two-color dithering inked with the theme text: ink goes where the image is bright on dark themes and where it is dark on light ones. -->
{#if alt}
  <span
    class={`dither ${extra}`}
    role="img"
    aria-label={alt}
    style:--dither-ink={ink}
    style:--dither={`url('${picture.src}')`}
    style:--dither-inverted={`url('${picture.inverted}')`}
    style:aspect-ratio={fill ? undefined : `${picture.width} / ${picture.height}`}
    style:max-inline-size={`${picture.width}px`}>{@render layers()}</span
  >
{:else}
  <span
    class={`dither ${extra}`}
    aria-hidden="true"
    style:--dither-ink={ink}
    style:--dither={`url('${picture.src}')`}
    style:--dither-inverted={`url('${picture.inverted}')`}
    style:aspect-ratio={fill ? undefined : `${picture.width} / ${picture.height}`}
    style:max-inline-size={`${picture.width}px`}>{@render layers()}</span
  >
{/if}
