<script lang="ts">
  import { page } from '$app/state';
  import { isReadingPage } from '../layout.ts';
  import { progress } from '../progress.svelte.ts';
  import { useShell } from '../shell.svelte.ts';
  import { useUi } from '../ui.svelte.ts';

  const shell = useShell();
  const ui = useUi();

  const pathname = $derived(page.url.pathname);
  const isHome = $derived(pathname === `/${shell.language}/`);
  const reading = $derived(isReadingPage(pathname));
  const isList = $derived(/^\/[^/]+\/(?:projects|posts|research)\/$/.test(pathname) || /^\/[^/]+\/(?:categories|tags)\/[^/]+\/$/.test(pathname));
  const parent = $derived(pathname.replace(/[^/]+\/$/, ''));
  const lastPane = $derived(shell.panes.length);
  const isPost = $derived(/^\/[^/]+\/posts\/[^/]+\/$/.test(pathname));
  const previous = $derived(page.data.item?.post?.previous as { href: string } | null | undefined);
  const next = $derived(page.data.item?.post?.next as { href: string } | null | undefined);
</script>

<footer class="statusbar">
  <span class="statusbar__mode">{shell.t(reading ? 'modeReading' : 'modeNormal')}</span>
  <span class="statusbar__keys">
    {#if !isHome}
      <a class="statusbar__key" href={parent} data-nav="back"><kbd>q</kbd> {shell.t('keyBack')}</a>
    {/if}
    {#if isPost && previous}
      <a class="statusbar__key" href={previous.href}><kbd>p</kbd> {shell.t('keyPrevious')}</a>
    {/if}
    {#if isPost && next}
      <a class="statusbar__key" href={next.href}><kbd>n</kbd> {shell.t('keyNext')}</a>
    {/if}
    {#if isList}
      <span class="statusbar__key"><kbd>j</kbd> <kbd>k</kbd> {shell.t('keyMove')}</span>
      <span class="statusbar__key"><kbd>enter</kbd> {shell.t('keyOpen')}</span>
      <button type="button" class="statusbar__key" onclick={() => ui.toggleView()}><kbd>v</kbd> {shell.t('keyView')}</button>
    {:else if !reading}
      <span class="statusbar__key"><kbd>1</kbd>–<kbd>{lastPane}</kbd> {shell.t('keyPanels')}</span>
    {/if}
    <button type="button" class="statusbar__key" onclick={() => ui.toggleSide(reading)}><kbd>z</kbd> {shell.t('keySide')}</button>
  </span>
  <div class="statusbar__facts">
    {#if reading}
      <span>{progress.percent}% {shell.t('statusRead')}</span>
    {/if}
    <span>{shell.locale}</span>
    <a class="statusbar__credits" href={`/${shell.language}/credits/`}>{shell.t('credits').toLowerCase()}</a>
  </div>
</footer>
