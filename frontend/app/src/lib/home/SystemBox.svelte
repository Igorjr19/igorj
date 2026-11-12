<script lang="ts">
  import { useShell } from '../shell.svelte.ts';
  import { REPOSITORY } from '../site.ts';
  import type { SystemData } from './types.ts';

  const shell = useShell();
  let { system }: { system: SystemData } = $props();

  const content = $derived(
    (
      [
        ['countPosts', system.counts.posts],
        ['countProjects', system.counts.projects],
        ['countResearch', system.counts.research],
      ] as const
    )
      .flatMap(([key, count]) => (count === null ? [] : [shell.t(key, count)]))
      .join(' · '),
  );
</script>

<section class="panel widget" id="system" aria-labelledby="system-title">
  <h2 class="panel__title" id="system-title">{shell.t('panelSystem').toLowerCase()}</h2>
  <dl class="facts">
    {#if system.commit}
      <dt>{shell.t('systemCommit')}</dt>
      <dd><a href={`${REPOSITORY}/commit/${system.commit}`}><code>{system.commit.slice(0, 7)}</code></a></dd>
    {/if}
    <dt>{shell.t('systemBuilt')}</dt>
    <dd><time datetime={system.built}>{system.built}</time></dd>
    <dt>{shell.t('systemContent')}</dt>
    <dd>{content}</dd>
    {#if system.sources.length > 0}
      <dt>{shell.t('systemData')}</dt>
      <dd>{system.sources.join(' · ')}</dd>
      {#if system.updated}
        <dt>{shell.t('systemUpdated')}</dt>
        <dd><time datetime={system.updated}>{system.updated}</time></dd>
      {/if}
    {/if}
  </dl>
</section>
