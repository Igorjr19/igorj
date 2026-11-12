<script lang="ts">
  import { useShell } from '#lib/shell.svelte.ts';

  const shell = useShell();
</script>

<h1>{shell.author}</h1>
<p>{shell.role}</p>
