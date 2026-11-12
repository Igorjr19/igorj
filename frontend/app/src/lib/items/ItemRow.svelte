<script lang="ts">
  import { languageInfo } from '../languages.ts';
  import { useShell } from '../shell.svelte.ts';
  import TagChips from './TagChips.svelte';
  import type { ItemRowData } from './types.ts';

  const shell = useShell();
  let { item, selected = false }: { item: ItemRowData; selected?: boolean } = $props();

  const foreign = $derived(item.language !== shell.language);
  const kind = $derived(
    item.category?.name ??
      (item.research ? shell.t(`research${item.research.kind.charAt(0).toUpperCase()}${item.research.kind.slice(1)}`) : shell.t('kindProject')),
  );
  const meta = $derived.by(() => {
    if (item.category && item.date) {
      return [item.category.name, item.date, ...(foreign ? [languageInfo(item.language).label] : [])].join(' · ');
    }
    if (item.research) {
      return `${kind} · ${item.research.year}`;
    }
    return item.tags[0]?.name ?? '';
  });
  const color = $derived(
    item.category ? `var(--color-category-${item.category.slug})` : item.research ? 'var(--color-text-muted)' : 'var(--color-link)',
  );
</script>

<li class="item" style:--item-color={color} data-selected={selected}>
  <a class="item__link" href={item.href} lang={foreign ? languageInfo(item.language).locale : undefined}>
    <span class="item__title">{item.title}</span>
    <span class="item__meta">{meta}</span>
  </a>
  <div class="item__detail">
    {#if item.image}
      <span
        class="dither item__image"
        aria-hidden="true"
        style:--dither-ink={color}
        style:--dither={`url('${item.image.src}')`}
        style:--dither-inverted={`url('${item.image.inverted}')`}
        style:aspect-ratio={`${item.image.width} / ${item.image.height}`}
        style:max-inline-size={`${item.image.width}px`}
        ><span class="dither__ink dither__ink--on-bright"></span><span class="dither__ink dither__ink--on-dark"></span></span
      >
    {:else}
      <span class="item__image item__image--none" aria-hidden="true"><span>{kind}</span></span>
    {/if}
    {#if item.summary}<p class="item__summary">{item.summary}</p>{/if}
    <TagChips tags={item.tags} />
  </div>
</li>
