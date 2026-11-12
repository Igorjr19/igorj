<script lang="ts">
  import { SITE_LANGUAGES } from '#lib/language-choice.ts';
  import { languageInfo } from '#lib/languages.ts';
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<article class="zoom not-found" aria-labelledby="page-title">
  <h1 class="sr-only" id="page-title">{page.status}</h1>
  <pre class="not-found__art" aria-hidden="true">
      +@@@#     =#@@@@#=          +@@@#
     +@@@@#    *@@*==*@@*        +@@@@#
    +@@*@@#   =@@#    #@@=      +@@*@@#
   +@@* @@#   #@@=   *@@@#     +@@* @@#
  +@@*  @@#   #@@=  *@*@@#    +@@*  @@#
 +@@*   @@#   #@@= *@* @@#   +@@*   @@#
=@@@@@@@@@@=  #@@@*@*  @@#  =@@@@@@@@@@=
        @@#   =@@#    #@@=          @@#
        @@#    *@@*==*@@*           @@#
        @@#     =#@@@@#=            @@#</pre>
  <p>igorj: {page.url.pathname}: command not found</p>
  <p>
    {#each SITE_LANGUAGES as language (language)}<a href={`/${language}/`}>~ {languageInfo(language).label}</a>{' '}{/each}
  </p>
</article>
