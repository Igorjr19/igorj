<script lang="ts">
  import { onMount } from 'svelte';
  import { nameLines, render } from '../name/ascii.ts';
  import { measure } from '../name/measure.ts';

  let { name }: { name: string } = $props();

  let pre: HTMLPreElement | undefined = $state();
  let text = $state('');

  // The heading stays for screen readers and for the first paint; once the page's font is ready the name is also drawn in characters.
  onMount(() => {
    const element = pre;
    let observer: ResizeObserver | undefined;
    void document.fonts.ready.then(() => {
      if (!element) {
        return;
      }
      const lines = nameLines(name);
      const draw = (): void => {
        const grid = measure(element, lines);
        text = render(grid.cells, grid.cols, grid.rows);
      };
      draw();
      observer = new ResizeObserver(draw);
      observer.observe(element);
    });
    return () => observer?.disconnect();
  });
</script>

<h1 class={['hero__name', text && 'sr-only']} id="hero-name">{name}</h1>
<pre class="hero__ascii" aria-hidden="true" bind:this={pre}>{text}</pre>
