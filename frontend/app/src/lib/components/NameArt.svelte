<script lang="ts">
  import { onMount } from 'svelte';
  import { animateName } from '../name/animate.ts';
  import { type Grid, nameLines, render } from '../name/ascii.ts';
  import { measure } from '../name/measure.ts';

  let { name }: { name: string } = $props();

  let pre: HTMLPreElement | undefined = $state();
  let text = $state('');

  // The heading stays for screen readers and for the first paint; once the page's font is ready the name is also
  // drawn in characters, and then it moves: a lens crosses it now and then and follows a mouse or a pen.
  onMount(() => {
    const element = pre;
    let observer: ResizeObserver | undefined;
    let stop: (() => void) | undefined;
    let current: Grid | undefined;
    void document.fonts.ready.then(() => {
      if (!element) {
        return;
      }
      const lines = nameLines(name);
      const draw = (): void => {
        current = measure(element, lines);
        text = render(current.cells, current.cols, current.rows);
      };
      draw();
      observer = new ResizeObserver(draw);
      observer.observe(element);
      stop = animateName(
        element,
        () => current ?? measure(element, lines),
        (frame) => {
          text = frame;
        },
      );
    });
    return () => {
      observer?.disconnect();
      stop?.();
    };
  });
</script>

<h1 class={['hero__name', text && 'sr-only']} id="hero-name">{name}</h1>
<pre class="hero__ascii" aria-hidden="true" bind:this={pre}>{text}</pre>
