<script lang="ts">
  import { onMount } from 'svelte';
  import { browserStorage } from '#lib/browser-storage.ts';
  import HelpDialog from '#lib/components/HelpDialog.svelte';
  import SideColumn from '#lib/components/SideColumn.svelte';
  import StatusBar from '#lib/components/StatusBar.svelte';
  import TopBar from '#lib/components/TopBar.svelte';
  import { readView, saveView } from '#lib/items/view.ts';
  import { languageInfo } from '#lib/languages.ts';
  import { isReadingPage } from '#lib/layout.ts';
  import { progress } from '#lib/progress.svelte.ts';
  import { provideShell } from '#lib/shell.svelte.ts';
  import Shortcuts from '#lib/shortcuts/Shortcuts.svelte';
  import { provideUi } from '#lib/ui.svelte.ts';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';

  let { data, children } = $props();

  provideShell(() => data.shell);

  const ui = provideUi();
  const zoomed = $derived(ui.sideHidden(isReadingPage(page.url.pathname)));
  let pane: HTMLElement | undefined = $state();

  // The view of the lists, list or grid, is remembered between visits.
  let viewRead = false;
  let ready = $state(false);
  onMount(() => {
    ready = true;
    const storage = browserStorage('localStorage');
    if (storage) {
      ui.view = readView(storage);
    }
    viewRead = true;
  });
  $effect(() => {
    const view = ui.view;
    const storage = browserStorage('localStorage');
    if (viewRead && storage) {
      try {
        saveView(storage, view);
      } catch {
        // Storage full or blocked: the view lasts until the page closes.
      }
    }
  });

  // A new page starts from what it asks for, at the top, read from the beginning.
  afterNavigate(() => {
    ui.newPage();
    pane?.scrollTo({ top: 0 });
    if (pane) {
      progress.update(pane);
    }
  });
</script>

<div class="app" class:is-zoomed={zoomed} data-ready={ready} lang={languageInfo(data.shell.language).locale}>
  <div class="win">
    <TopBar />
    <div class="win__body">
      <SideColumn />
      <main class="pane" id="pane" tabindex="-1" bind:this={pane} onscroll={() => pane && progress.update(pane)}>
        {@render children()}
      </main>
      <div class="scroll" aria-hidden="true"><span class="scroll__thumb"></span></div>
    </div>
    <StatusBar />
  </div>
</div>
<Shortcuts />
<HelpDialog />
