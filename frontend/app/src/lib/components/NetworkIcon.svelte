<script lang="ts">
  import { networkIcon } from '../icons.ts';

  let { network }: { network: string } = $props();
</script>

{@html networkIcon(network)}
