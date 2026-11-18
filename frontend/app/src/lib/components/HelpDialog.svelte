<script lang="ts">
  import { closeOnOutside } from '../modal.ts';
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
    ['f', 'helpFind'],
    ['#', 'helpFilter'],
    ['t', 'helpTheme'],
    [':', 'helpTerminal'],
    ['tab', 'helpTab'],
    ['?', 'helpHelp'],
    ['esc', 'helpEscape'],
  ] as const);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<!-- biome-ignore lint/a11y/useKeyWithClickEvents: the click on the backdrop is a mouse shortcut; Escape and the close button are the keyboard ways -->
<dialog class="panel help" aria-labelledby="help-title" bind:this={dialog} onclose={() => (ui.helpOpen = false)} onclick={(event) => closeOnOutside(dialog, event)}>
  <h2 class="panel__title" id="help-title">{shell.t('helpTitle')}</h2>
  <dl class="facts">
    {#each rows as [keys, text] (text)}
      <dt>{#each keys.split(' ') as key (key)}<kbd>{key}</kbd>{' '}{/each}</dt>
      <dd>{shell.t(text)}</dd>
    {/each}
  </dl>
  <form class="help__actions" method="dialog">
    <button type="submit" class="button">{shell.t('helpClose')}</button>
  </form>
</dialog>
