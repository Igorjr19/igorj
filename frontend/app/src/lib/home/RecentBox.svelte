<script lang="ts">
  import { languageInfo } from '../languages.ts';
  import { useShell } from '../shell.svelte.ts';
  import type { RecentRow } from './data.ts';

  const shell = useShell();
  let { rows }: { rows: readonly RecentRow[] } = $props();
</script>

<!-- The latest posts and the featured projects, as one list of rows. -->
<section class="panel recent" aria-labelledby="recent-title" id="recent">
  <h2 class="panel__title" id="recent-title">{shell.t('recent').toLowerCase()}</h2>
  {#if rows.length > 0}
    <ul class="recent__list">
      {#each rows as row (row.href)}
        <li style:--item-color={row.color}>
          <a class="recent__row" href={row.href} lang={row.lang ? languageInfo(row.lang).locale : undefined}>
            <span class="recent__kind">{row.kind ?? shell.t('kindProject')}</span>
            <span class="recent__title">{row.title}</span>
            <span class="recent__sub"
              >{#if row.date}<time datetime={row.date}>{row.date}</time>{' · '}{/if}{row.sub}</span
            >
          </a>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="panel__meta">{shell.t('noData')}</p>
  {/if}
</section>
