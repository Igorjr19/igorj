<script lang="ts">
  let { data } = $props();
  const profile = $derived(data.model.profile);
</script>

<svelte:head>
  <title>{profile?.title}</title>
</svelte:head>

{#if profile}
  <h1>{profile.author}</h1>
  <p>{profile.role} · {profile.location}</p>
{/if}
