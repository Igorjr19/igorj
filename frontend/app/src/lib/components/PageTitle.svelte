<script lang="ts">
  import { useShell } from '../shell.svelte.ts';

  const shell = useShell();
  /** The name of the page; the home passes none and shows the name of the site alone. */
  let { title }: { title?: string } = $props();
</script>

<svelte:head>
  <title>{title ? `${title} · ${shell.siteTitle}` : shell.siteTitle}</title>
</svelte:head>
