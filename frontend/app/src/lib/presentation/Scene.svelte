<script lang="ts">
  import { onMount } from 'svelte';
  import type { SceneInput } from '../scene/input.ts';
  import type { Boot } from '../scene/scene.ts';
  import { readAnswer } from '../shelf/now-playing.ts';

  const EMPTY: SceneInput = { strings: {}, music: null, films: [], books: [] };

  /** What is playing now, from the site's own endpoint; nothing when it says nothing or cannot be reached. */
  async function nowPlaying(): Promise<{ title: string; artist: string } | null> {
    try {
      const answer = await fetch('/api/now-playing');
      const now = readAnswer(answer.ok ? await answer.json() : null);
      return now.playing ? { title: now.title, artist: now.artist } : null;
    } catch {
      return null;
    }
  }

  /** What the room shows; a room that cannot read it is still a room, with bare shelves. */
  async function inputOf(language: string): Promise<SceneInput> {
    try {
      const answer = await fetch(`/${language}/scene.json`);
      return answer.ok ? ((await answer.json()) as SceneInput) : EMPTY;
    } catch {
      return EMPTY;
    }
  }

  let { boot, language }: { boot: Boot; language: string } = $props();

  // The scene is the only thing that needs the 3D library, so it is fetched here and only when the visitor is shown it.
  onMount(() => {
    if (document.documentElement.dataset['presentation'] !== 'scene') {
      return;
    }
    let stop = (): void => undefined;
    let gone = false;
    void start();
    async function start(): Promise<void> {
      const [{ mountScene }, input] = await Promise.all([import('../scene/mount.ts'), inputOf(language)]);
      if (!gone) {
        stop = mountScene(boot, { input, nowPlaying });
      }
    }
    return () => {
      gone = true;
      stop();
    };
  });
</script>
