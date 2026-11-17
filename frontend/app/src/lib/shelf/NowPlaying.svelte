<script lang="ts">
  import { onMount } from 'svelte';
  import { useShell } from '../shell.svelte.ts';
  import { type NowPlaying, readAnswer } from './now-playing.ts';

  const shell = useShell();
  let now = $state<NowPlaying>({ playing: false });

  /** How often the page asks again, in milliseconds, while it is on screen; the server keeps its answer for less than this. */
  const EVERY = 30_000;

  async function ask(): Promise<void> {
    try {
      const answer = await fetch('/api/now-playing');
      now = readAnswer(answer.ok ? await answer.json() : null);
    } catch {
      now = { playing: false };
    }
  }

  onMount(() => {
    void ask();
    const timer = setInterval(() => {
      if (!document.hidden) {
        void ask();
      }
    }, EVERY);
    return () => clearInterval(timer);
  });
</script>

{#if now.playing}
  <p class="now" aria-live="polite">
    <span class="now__dot" aria-hidden="true"></span>
    <span class="now__label">{shell.t('nowPlaying')}</span>
    <cite class="now__track">{#if now.url}<a href={now.url}>{now.title}</a>{:else}{now.title}{/if}</cite>
    <span class="now__artist">{now.artist}</span>
  </p>
{/if}
