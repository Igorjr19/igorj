<script lang="ts">
  import type { CvModel } from '../../../../../tools/model/types.ts';
  import { useShell } from '../shell.svelte.ts';

  const shell = useShell();
  let { cv, shownIn }: { cv: CvModel; shownIn: string | null } = $props();

  const period = (start: string | undefined, end: string | undefined, open: string): string =>
    start ? `${start} – ${end ?? open}` : (end ?? '');
</script>

<div class="cv">
  {#if shownIn}<p class="panel__meta">{shell.t('cvOtherLanguage', shownIn)}</p>{/if}

  <header class="cv__head">
    <p class="cv__headline">{cv.basics.label}{#if cv.basics.location}{' · '}{cv.basics.location}{/if}</p>
    <p class="cv__text">{cv.basics.summary}</p>
    <p class="cv__contact">
      <a href={`mailto:${cv.basics.email}`}>{cv.basics.email}</a>{#each cv.basics.profiles as profile (profile.url)}{' · '}<a href={profile.url}>{profile.network}</a>{/each}
    </p>
  </header>

  {#if cv.work.length > 0}
    <section class="cv__section" aria-labelledby="cv-work">
      <h2 class="label" id="cv-work">{shell.t('cvWork')}</h2>
      {#each cv.work as job (job.name + job.startDate)}
        <article class="cv__entry">
          <p class="cv__period">{period(job.startDate, job.endDate, shell.t('periodPresent'))}</p>
          <div class="cv__body">
            <h3 class="cv__title"><span class="cv__role">{job.position}</span>{' · '}<span class="cv__org">{job.name}</span></h3>
            {#if job.location}<p class="cv__place">{job.location}</p>{/if}
            {#if job.summary}<p class="cv__text">{job.summary}</p>{/if}
            {#if job.highlights.length > 0}
              <ul class="cv__highlights">
                {#each job.highlights as highlight (highlight)}<li>{highlight}</li>{/each}
              </ul>
            {/if}
          </div>
        </article>
      {/each}
    </section>
  {/if}

  {#if cv.education.length > 0}
    <section class="cv__section" aria-labelledby="cv-education">
      <h2 class="label" id="cv-education">{shell.t('cvEducation')}</h2>
      {#each cv.education as study (study.institution + study.area)}
        <article class="cv__entry">
          <p class="cv__period">{period(study.startDate, study.endDate, '')}</p>
          <div class="cv__body">
            <h3 class="cv__title"><span class="cv__role">{study.studyType}{' · '}{study.area}</span></h3>
            <p class="cv__place">{study.institution}</p>
          </div>
        </article>
      {/each}
    </section>
  {/if}

  {#if cv.academic.length > 0}
    <section class="cv__section" aria-labelledby="cv-academic">
      <h2 class="label" id="cv-academic">{shell.t('cvAcademic')}</h2>
      {#each cv.academic as entry (entry.title + entry.year)}
        <article class="cv__entry">
          <p class="cv__period">{entry.year}</p>
          <div class="cv__body">
            <h3 class="cv__title"><span class="cv__role">{entry.title}</span></h3>
            <p class="cv__place">{entry.institution}</p>
            {#if entry.summary}<p class="cv__text">{entry.summary}</p>{/if}
          </div>
        </article>
      {/each}
    </section>
  {/if}

  {#if cv.skills.length > 0}
    <section class="cv__section" aria-labelledby="cv-skills">
      <h2 class="label" id="cv-skills">{shell.t('cvSkills')}</h2>
      <dl class="cv__skills">
        {#each cv.skills as skill (skill.name)}
          <dt>{skill.name}</dt>
          <dd>
            {#each skill.keywords as keyword (keyword)}<span class="chip">{keyword}</span>{' '}{/each}
          </dd>
        {/each}
      </dl>
    </section>
  {/if}

  {#if cv.languages.length > 0}
    <section class="cv__section" aria-labelledby="cv-languages">
      <h2 class="label" id="cv-languages">{shell.t('cvLanguages')}</h2>
      <dl class="facts">
        {#each cv.languages as language (language.language)}
          <dt>{language.language}</dt>
          <dd>{language.fluency}</dd>
        {/each}
      </dl>
    </section>
  {/if}

  {#if cv.publications.length > 0}
    <section class="cv__section" aria-labelledby="cv-publications">
      <h2 class="label" id="cv-publications">{shell.t('cvPublications')}</h2>
      <ul>
        {#each cv.publications as publication (publication.id)}
          <li>
            <a href={`/${shell.language}/research/${publication.slug}/`}>{publication.title}</a>
            <span class="panel__meta">{publication.year}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <p class="cv__print"><button type="button" onclick={() => window.print()}>{shell.t('print')}</button></p>
</div>
