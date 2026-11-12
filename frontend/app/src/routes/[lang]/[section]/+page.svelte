<script lang="ts">
  import { useShell } from '#lib/shell.svelte.ts';
  import { page } from '$app/state';

  const shell = useShell();
</script>

<h1>{shell.sectionLabel(page.params['section'] ?? '')}</h1>
