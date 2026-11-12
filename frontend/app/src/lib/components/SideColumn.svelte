<script lang="ts">
  import { page } from '$app/state';
  import { useShell } from '../shell.svelte.ts';
  import Icon from './Icon.svelte';
  import NetworkIcon from './NetworkIcon.svelte';

  const shell = useShell();

  /** The pane the page belongs to: the one whose address the page sits under, the home only on the home itself. */
  function currentOf(pathname: string): string | null {
    const base = `/${shell.language}/`;
    const rest = pathname.slice(base.length);
    if (rest === '') {
      return 'home';
    }
    return shell.panes.find((pane) => pane.section.path !== '' && rest.startsWith(`${pane.section.path}/`))?.section.key ?? null;
  }

  const current = $derived(currentOf(page.url.pathname));
  const links = $derived(shell.contact ? [...shell.contact.personal, ...shell.contact.professional] : []);
</script>

<nav class="side" aria-label={shell.t('panes')}>
  <p class="side__who">
    <a href={`/${shell.language}/`}><span class="side__name">{shell.author}</span></a>
    <span class="side__role">{shell.role}</span>
  </p>
  <ol class="side__panes">
    {#each shell.panes as pane (pane.section.key)}
      <li>
        <a
          href={pane.href}
          data-pane={pane.number}
          aria-current={pane.section.key === current ? (page.url.pathname === pane.href ? 'page' : 'true') : undefined}
          ><span class="side__key" aria-hidden="true">{pane.number}</span><span class="side__label">{shell.t(pane.section.label)}</span
          >{#if pane.count !== null}<span class="side__count">{pane.count}</span>{/if}</a
        >
      </li>
    {/each}
  </ol>
  {#if shell.contact}
    <section class="side__block" aria-label={shell.t('systemContact')}>
      <p class="side__heading" aria-hidden="true">{shell.t('systemContact')}</p>
      <ul class="side__links">
        {#if shell.contact.email}
          <li><a href={`mailto:${shell.contact.email}`}><Icon name="envelope" />{shell.contact.email}</a></li>
        {/if}
        {#each links as link (link.url)}
          <li><a href={link.url}><NetworkIcon network={link.network} />{link.network}</a></li>
        {/each}
      </ul>
    </section>
  {/if}
</nav>
