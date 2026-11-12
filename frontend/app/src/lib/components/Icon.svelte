<script lang="ts">
  import { type UiIcon, uiIcon } from '../icons.ts';

  let { name }: { name: UiIcon } = $props();
</script>

{@html uiIcon(name)}
