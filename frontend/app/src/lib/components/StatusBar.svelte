<script lang="ts">
  import { page } from '$app/state';
  import { useShell } from '../shell.svelte.ts';

  const shell = useShell();

  const isHome = $derived(page.url.pathname === `/${shell.language}/`);
  const parent = $derived(page.url.pathname.replace(/[^/]+\/$/, ''));
  const lastPane = $derived(shell.panes.length);
</script>

<footer class="statusbar">
  <span class="statusbar__mode">{shell.t('modeNormal')}</span>
  <span class="statusbar__keys">
    {#if !isHome}
      <a class="statusbar__key" href={parent} data-nav="back"><kbd>q</kbd> {shell.t('keyBack')}</a>
    {/if}
    <span class="statusbar__key"><kbd>1</kbd>–<kbd>{lastPane}</kbd> {shell.t('keyPanels')}</span>
  </span>
  <div class="statusbar__facts">
    <span>{shell.locale}</span>
  </div>
</footer>
