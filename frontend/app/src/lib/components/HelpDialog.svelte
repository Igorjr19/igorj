<script lang="ts">
  import { useShell } from '../shell.svelte.ts';
  import { useUi } from '../ui.svelte.ts';

  const shell = useShell();
  const ui = useUi();
  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (ui.helpOpen && dialog && !dialog.open) {
      dialog.showModal();
    }
  });

  const rows = $derived([
    [`1–${shell.panes.length}`, 'helpPanels'],
    ['j k ↓ ↑', 'helpMove'],
    ['enter', 'helpOpen'],
    ['q h', 'helpBack'],
    ['v', 'helpView'],
    ['z', 'helpZoom'],
    ['p n', 'helpPosts'],
    ['tab', 'helpTab'],
    ['?', 'helpHelp'],
    ['esc', 'helpEscape'],
  ] as const);
</script>

<dialog class="panel help" aria-labelledby="help-title" bind:this={dialog} onclose={() => (ui.helpOpen = false)}>
  <h2 class="panel__title" id="help-title">{shell.t('helpTitle')}</h2>
  <dl class="facts">
    {#each rows as [keys, text] (text)}
      <dt>{#each keys.split(' ') as key (key)}<kbd>{key}</kbd>{' '}{/each}</dt>
      <dd>{shell.t(text)}</dd>
    {/each}
  </dl>
  <p>{shell.t('helpIgnored')}</p>
  <form class="help__actions" method="dialog">
    <button type="submit">{shell.t('helpClose')}</button>
  </form>
</dialog>
