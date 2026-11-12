<script lang="ts">
  let { id, label, url }: { id: string; label: string; url?: string | undefined } = $props();
</script>

<!-- A box title on the border: the name, linking to the profile on the network the data comes from when there is one. -->
<h2 class="panel__title" id={`${id}-title`}>{#if url}<a href={url}>{label.toLowerCase()}</a>{:else}{label.toLowerCase()}{/if}</h2>
