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
  import { direction } from '#lib/motion/direction.ts';
  import { navigationTransition } from '#lib/motion/transition.ts';
  import PickBox from '#lib/pick/PickBox.svelte';
  import { progress } from '#lib/progress.svelte.ts';
  import { provideShell } from '#lib/shell.svelte.ts';
  import Shortcuts from '#lib/shortcuts/Shortcuts.svelte';
  import Terminal from '#lib/terminal/Terminal.svelte';
  import { currentChoice } from '#lib/theme/current.ts';
  import { provideUi } from '#lib/ui.svelte.ts';
  import { afterNavigate, onNavigate, preloadData } from '$app/navigation';
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
    // The panes are what the visitor moves between most, so their data is fetched as soon as the window is up.
    (window.requestIdleCallback ?? setTimeout)(() => {
      for (const pane of data.shell.panes) {
        void preloadData(pane.href);
      }
    });
    ui.theme = currentChoice();
    try {
      const height = Number(localStorage.getItem('terminal-height'));
      if (height > 0) {
        ui.terminalHeight = height;
      }
    } catch {
      // Storage blocked: the default height applies.
    }
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

  // The old page stays until the new one is ready, then the two cross, from the side its number lies on.
  onNavigate((navigation) => {
    if (!(navigation.from && navigation.to)) {
      return;
    }
    ui.navigating = true;
    void navigation.complete.finally(() => {
      ui.navigating = false;
    });
    return navigationTransition(direction(navigation.from.url.pathname, navigation.to.url.pathname), navigation.complete);
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

<div
  class="app"
  class:is-zoomed={zoomed}
  class:has-terminal={ui.terminalOpen}
  class:is-resizing={ui.resizing}
  class:is-navigating={ui.navigating}
  data-ready={ready}
  style:--terminal-height={`${ui.terminalHeight * 100}%`} lang={languageInfo(data.shell.language).locale}>
  <div class="win">
    <TopBar />
    <div class="win__body">
      <SideColumn />
      <main class="pane" id="pane" tabindex="-1" bind:this={pane} onscroll={() => pane && progress.update(pane)}>
        {@render children()}
      </main>
      <div class="scroll" aria-hidden="true"><span class="scroll__thumb"></span></div>
      <Terminal />
    </div>
    <StatusBar />
  </div>
</div>
<Shortcuts />
<HelpDialog />
<PickBox />
