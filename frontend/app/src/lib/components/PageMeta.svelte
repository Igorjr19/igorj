<script lang="ts">
  import { page } from '$app/state';
  import { sameEverywhere } from '../alternates.ts';
  import { languageInfo } from '../languages.ts';
  import { useShell } from '../shell.svelte.ts';

  const shell = useShell();
  let {
    title,
    description,
    image,
    type = 'website',
    published,
    alternates,
  }: {
    /** The name of the page; the home passes none and shows the name of the site alone. */
    title?: string;
    description?: string | undefined;
    /** The path of the picture a link preview shows; the default one of the language when none is given. */
    image?: string;
    type?: 'website' | 'article';
    published?: string | undefined;
    /** The same page in the other languages, by language; the ones the page does not have are left out. */
    alternates?: Readonly<Record<string, string>>;
  } = $props();

  const absolute = (path: string): string => new URL(path, shell.siteUrl).href;
  const full = $derived(title ? `${title} · ${shell.siteTitle}` : shell.siteTitle);
  const canonical = $derived(absolute(page.url.pathname));
  const picture = $derived(absolute(image ?? `/share/${shell.language}/default.jpg`));
  const others = $derived(alternates ?? sameEverywhere(page.url.pathname, shell.language, shell.languages));
  const twins = $derived(Object.entries({ ...others, [shell.language]: page.url.pathname }));
  const isHome = $derived(page.url.pathname === `/${shell.language}/`);
  const person = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: shell.author,
      jobTitle: shell.role,
      url: canonical,
      sameAs: (shell.contact?.professional ?? []).map((link) => link.url),
    }),
  );
</script>

<svelte:head>
  <title>{full}</title>
  {#if description}<meta name="description" content={description} />{/if}
  <link rel="canonical" href={canonical} />
  {#each twins as [language, path] (language)}
    <link rel="alternate" hreflang={languageInfo(language).locale} href={absolute(path)} />
  {/each}
  <link rel="alternate" type="application/rss+xml" title={shell.author} href={absolute(`/${shell.language}/index.xml`)} />
  <meta property="og:site_name" content={shell.author} />
  <meta property="og:title" content={title ? title : shell.siteTitle} />
  {#if description}<meta property="og:description" content={description} />{/if}
  <meta property="og:type" content={type} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={picture} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta property="og:locale" content={languageInfo(shell.language).locale.replace('-', '_')} />
  {#each Object.keys(others) as language (language)}
    <meta property="og:locale:alternate" content={languageInfo(language).locale.replace('-', '_')} />
  {/each}
  {#if published}<meta property="article:published_time" content={published} />{/if}
  {#if isHome}{@html `<script type="application/ld+json">${person.replace(/</g, '\\u003c')}</script>`}{/if}
  <link rel="icon" href="/icons/favicon-light.png" sizes="64x64" type="image/png" media="(prefers-color-scheme: dark)" />
  <link rel="icon" href="/icons/favicon-dark.png" sizes="64x64" type="image/png" media="(prefers-color-scheme: light)" />
  <link rel="apple-touch-icon" href="/icons/favicon-180.png" />
  {#each shell.fontPreloads as font (font)}
    <link rel="preload" href={font} as="font" type="font/woff2" crossorigin="anonymous" />
  {/each}
</svelte:head>
