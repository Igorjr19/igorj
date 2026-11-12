<script lang="ts">
  import SideColumn from '#lib/components/SideColumn.svelte';
  import StatusBar from '#lib/components/StatusBar.svelte';
  import TopBar from '#lib/components/TopBar.svelte';
  import { languageInfo } from '#lib/languages.ts';
  import { provideShell } from '#lib/shell.svelte.ts';
  import { page } from '$app/state';

  let { data, children } = $props();

  provideShell(() => data.shell);

  const zoomed = $derived(page.url.pathname.split('/').filter(Boolean).length > 2);
</script>

<svelte:head>
  <title>{data.shell.author} — {data.shell.role}</title>
</svelte:head>

<div class="app" class:is-zoomed={zoomed} lang={languageInfo(data.shell.language).locale}>
  <div class="win">
    <TopBar />
    <div class="win__body">
      <SideColumn />
      <main class="pane" id="pane" tabindex="-1">
        {@render children()}
      </main>
      <div class="scroll" aria-hidden="true"><span class="scroll__thumb"></span></div>
    </div>
    <StatusBar />
  </div>
</div>
