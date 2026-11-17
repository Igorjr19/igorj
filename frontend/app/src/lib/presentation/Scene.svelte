<script lang="ts">
  import { onMount } from 'svelte';
  import type { Boot } from '../scene/scene.ts';

  let { boot }: { boot: Boot } = $props();

  // The scene is the only thing that needs the 3D library, so it is fetched here and only when the visitor is shown it.
  onMount(() => {
    if (document.documentElement.dataset['presentation'] !== 'scene') {
      return;
    }
    let stop = (): void => undefined;
    let gone = false;
    void import('../scene/mount.ts').then(({ mountScene }) => {
      if (!gone) {
        stop = mountScene(boot);
      }
    });
    return () => {
      gone = true;
      stop();
    };
  });
</script>
