<script lang="ts">
  import { useShell } from '../shell.svelte.ts';
  import { useUi } from '../ui.svelte.ts';

  const shell = useShell();
  const ui = useUi();
  /** Where to go when the visitor did not come from another page of the site, such as on a link opened afresh. */
  let { fallback }: { fallback: string } = $props();

  function back(event: MouseEvent): void {
    if (ui.cameFrom) {
      event.preventDefault();
      history.back();
    }
  }
</script>

<p class="back"><a href={fallback} onclick={back}>‹ {shell.t('back')}</a></p>
