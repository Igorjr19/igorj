<script lang="ts">
  import { onMount } from 'svelte';
  import { mountMonitor } from './mount.ts';
  import type { Boot } from './scene.ts';

  let { boot }: { boot: Boot } = $props();

  onMount(() => mountMonitor(boot));
</script>
