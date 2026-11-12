<script lang="ts">
  import { useShell } from '../shell.svelte.ts';
  import TagChips from './TagChips.svelte';
  import type { ItemPageData } from './types.ts';

  const shell = useShell();
  let { item }: { item: ItemPageData } = $props();

  const sections = $derived(item.headings.filter((heading) => heading.level === 2).length);
</script>

{#if item.post}
  <p class="panel__meta">
    <time datetime={item.post.date}>{item.post.date}</time>{' · '}<a href={`/${shell.language}/categories/${item.post.category.slug}/`}
      >{item.post.category.name}</a
    >{#if item.post.lastmod && item.post.lastmod !== item.post.date}{' · '}{shell.t('postUpdated')}
      <time datetime={item.post.lastmod}>{item.post.lastmod}</time>{/if}
  </p>
{:else if item.project && (item.project.repository || item.project.demo)}
  <dl class="facts">
    {#if item.project.repository}
      <dt>{shell.t('factRepository')}</dt>
      <dd><a href={item.project.repository}>{item.project.repository}</a></dd>
    {/if}
    {#if item.project.demo}
      <dt>{shell.t('factDemo')}</dt>
      <dd><a href={item.project.demo}>{item.project.demo}</a></dd>
    {/if}
  </dl>
{:else if item.research}
  <dl class="facts">
    <dt>{shell.t('factKind')}</dt>
    <dd>{shell.t(`research${item.research.kind.charAt(0).toUpperCase()}${item.research.kind.slice(1)}`)}</dd>
    <dt>{shell.t('factYear')}</dt>
    <dd>{item.research.year}</dd>
    <dt>{shell.t('factAuthors')}</dt>
    <dd>{item.research.authors.join(', ')}</dd>
    <dt>{shell.t('factVenue')}</dt>
    <dd>{item.research.venue}</dd>
    {#if item.research.doi}
      <dt>{shell.t('factDoi')}</dt>
      <dd><a href={`https://doi.org/${item.research.doi}`}>{item.research.doi}</a></dd>
    {/if}
    {#if item.research.file}
      <dt>{shell.t('factFile')}</dt>
      <dd><a href={`/media/${item.research.file}`}>{item.research.file.split('/').at(-1)}</a></dd>
    {/if}
  </dl>
{/if}

{#if item.tags.length > 0}
  <div class="zoom__tags">
    <span class="label">{shell.t('factTags')}</span>
    <TagChips tags={item.tags} />
  </div>
{/if}

{#if item.post && sections >= 3}
  <details class="toc" open>
    <summary>{shell.t('tocTitle')}</summary>
    <nav aria-label={shell.t('tocTitle')}>
      <ul>
        {#each item.headings.filter((heading) => heading.level === 2) as heading (heading.id)}
          <li><a href={`#${heading.id}`}>{heading.text}</a></li>
        {/each}
      </ul>
    </nav>
  </details>
{/if}

<!-- The text is Markdown rendered at build time from the content, never typed by a visitor. -->
{@html item.html}

{#if item.post}
  <nav class="pager" aria-label={shell.t('pagerLabel')}>
    {#if item.post.previous}
      <a rel="prev" data-nav="previous" href={item.post.previous.href}>‹ {shell.t('pagerPrevious')}: {item.post.previous.title}</a>
    {/if}
    {#if item.post.next}
      <a rel="next" data-nav="next" href={item.post.next.href}>{shell.t('pagerNext')}: {item.post.next.title} ›</a>
    {/if}
  </nav>
{/if}
