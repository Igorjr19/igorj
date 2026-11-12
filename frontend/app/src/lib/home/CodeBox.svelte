<script lang="ts">
  import { useShell } from '../shell.svelte.ts';
  import AgeNote from './AgeNote.svelte';
  import BoxTitle from './BoxTitle.svelte';
  import { formatDuration } from './data.ts';
  import type { CodeData } from './types.ts';

  const shell = useShell();
  let { code, githubUrl }: { code: CodeData; githubUrl?: string | undefined } = $props();
</script>

<!-- Code: the public GitHub contributions of the last months as a grid of days, and the coding time from CodeTime. -->
<section class="panel widget" id="code" aria-labelledby="code-title">
  <BoxTitle id="code" label={shell.t('panelCode')} url={githubUrl} />
  {#if code.github}
    {@const label = shell.t('contributionsYear', code.github.total)}
    <p class="panel__meta">{label}</p>
    <AgeNote updated={code.github.updatedLate} />
    <div class="contributions" role="img" aria-label={label}>
      {#each code.github.levels as week, index (index)}
        <span class="contributions__week">{#each week as level, day (day)}<i data-level={level}></i>{/each}</span>
      {/each}
    </div>
  {/if}
  {#if code.codetime}
    <dl class="facts">
      <dt>{shell.t('codeWeek')}</dt>
      <dd>{formatDuration(code.codetime.weekMinutes)}</dd>
      <dt>{shell.t('codeMonth')}</dt>
      <dd>{formatDuration(code.codetime.monthMinutes)}</dd>
      {#if code.codetime.languages.length > 0}
        <dt>{shell.t('codeLanguages')}</dt>
        <dd>{code.codetime.languages.join(' · ')}</dd>
      {/if}
    </dl>
    {#if !code.github}<AgeNote updated={code.codetime.updatedLate} />{/if}
  {/if}
</section>
