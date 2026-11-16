<script lang="ts">
  import { onMount } from 'svelte';
  import { population, seeded, step } from './life.ts';
  import { readPalette } from './palette.ts';

  const CELL = 10;
  const TICK_MS = 110;
  let canvas: HTMLCanvasElement | undefined = $state();

  onMount(() => {
    const surface = canvas;
    const context = surface?.getContext('2d');
    if (!(surface && context)) {
      return;
    }
    const palette = readPalette();
    let grid = seeded(1, 1, 1);
    let seed = 1;
    const size = (): void => {
      surface.width = innerWidth;
      surface.height = innerHeight;
      grid = seeded(Math.ceil(innerWidth / CELL), Math.ceil(innerHeight / CELL), seed);
    };
    const draw = (): void => {
      context.fillStyle = palette.background;
      context.fillRect(0, 0, surface.width, surface.height);
      context.fillStyle = palette.accent;
      context.globalAlpha = 0.35;
      grid.cells.forEach((cell, at) => {
        if (cell === 1) {
          context.fillRect((at % grid.cols) * CELL + 1, Math.floor(at / grid.cols) * CELL + 1, CELL - 2, CELL - 2);
        }
      });
      context.globalAlpha = 1;
    };
    size();
    addEventListener('resize', size);
    const timer = setInterval(() => {
      if (document.hidden) {
        return;
      }
      grid = step(grid);
      if (population(grid) < grid.cells.length * 0.02) {
        seed += 1;
        grid = seeded(grid.cols, grid.rows, seed);
      }
      draw();
    }, TICK_MS);
    draw();
    return () => {
      clearInterval(timer);
      removeEventListener('resize', size);
    };
  });
</script>

<canvas class="lab__pattern" bind:this={canvas}></canvas>
<iframe class="lab__window" src="/en/" title="igorj.dev"></iframe>
