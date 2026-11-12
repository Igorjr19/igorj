<script lang="ts">
  import PageMeta from '#lib/components/PageMeta.svelte';
  import Zoom from '#lib/components/Zoom.svelte';
  import ItemPage from '#lib/items/ItemPage.svelte';

  import { useShell } from '#lib/shell.svelte.ts';

  const shell = useShell();
  let { data } = $props();
</script>

<PageMeta
  title={data.item.title}
  description={data.item.summary}
  image={`/share/${shell.language}/${data.item.section}/${data.item.slug}.jpg`}
  type={data.item.post ? 'article' : 'website'}
  published={data.item.post?.date}
  alternates={data.alternates}
/>
<Zoom title={data.item.title} page>
  <ItemPage item={data.item} />
</Zoom>
