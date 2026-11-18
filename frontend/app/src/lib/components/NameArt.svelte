<script lang="ts">
  import { onMount } from 'svelte';
  import { animateName } from '../name/animate.ts';
  import { type Grid, nameLines, render } from '../name/ascii.ts';
  import { measure } from '../name/measure.ts';

  let { name }: { name: string } = $props();

  /** How tall the drawn name is, in widths of one character of its widest line, for each of its lines; found by measuring it. */
  const HEIGHT_PER_LINE = 1.91;
  const ratio = $derived.by(() => {
    const lines = nameLines(name);
    return `${Math.max(...lines.map((line) => line.length))} / ${HEIGHT_PER_LINE * lines.length}`;
  });

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

<!-- The drawn name is as tall as its width and its lines allow, so the room is kept before it is drawn and the page below does not move. -->
<div class="hero__name-block" style:aspect-ratio={ratio}>
  <h1 class={['hero__name', text && 'sr-only']} id="hero-name">{name}</h1>
  <pre class="hero__ascii" aria-hidden="true" bind:this={pre}>{text}</pre>
</div>
