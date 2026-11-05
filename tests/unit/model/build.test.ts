import { assertEquals } from '@std/assert';
import type { ContentItem, RawContent } from '../../../tools/content/types.ts';
import { buildModel, cvFor, postsFor, projectsFor, researchFor } from '../../../tools/model/build.ts';

function item<T>(folder: string, language: string, data: T, media: string[] = []): ContentItem<T> {
  return { folder, language, data, body: `Body of ${folder}.`, media };
}

const post = (title: string, date: string | Date, extra: object = {}) => ({
  title,
  summary: `${title}.`,
  date,
  categories: ['notes'],
  ...extra,
});

const cv = (label: string) => ({
  basics: {
    name: 'N',
    label,
    summary: 'S',
    email: 'e@example.com',
    url: 'https://example.com',
    location: 'L',
    profiles: [],
  },
  work: [{ name: 'Company', position: 'Role', startDate: '2024-01' }],
  education: [],
  skills: [],
  languages: [],
  publications: [{ research: 'thesis' }],
});

const RAW: RawContent = {
  site: { author: 'Author', languages: ['pt', 'en'] },
  categories: { categories: [{ slug: 'notes', name: { pt: 'Notas', en: 'Notes' } }] },
  about: {
    en: {
      role: 'Developer',
      lines: ['One.', 'Two.', 'Three.'],
      photoAlt: 'Photo',
      location: 'City',
      now: { work: 'W', masters: 'M', studying: 'S' },
      lastmod: new Date('2026-10-10'),
    },
  },
  cv: { en: cv('English CV') },
  contact: {
    email: { pt: 'contato@example.com', en: 'contact@example.com' },
    professional: [{ network: 'GitHub', url: 'https://github.com/example' }],
    personal: [],
  },
  reading: null,
  music: { updated: new Date('2026-01-01'), period: 'week', artists: [] },
  films: null,
  photo: 'about/photo.png',
  posts: [
    item('both', 'pt', post('Ambos', '2026-01-10')),
    item('both', 'en', post('Both', '2026-01-10')),
    item('pt-only', 'pt', post('Só português', '2026-03-01')),
    item('en-only', 'en', post('English only', new Date('2026-02-01'))),
    item('draft', 'en', post('Draft', '2026-04-01', { draft: true })),
  ],
  projects: [
    item('zeta', 'en', { title: 'Zeta', summary: 'Z.', stack: ['go'] }),
    item('alpha', 'en', { title: 'Alpha', summary: 'A.', stack: ['go'] }),
    item('heavy', 'en', { title: 'Heavy', summary: 'H.', stack: ['go'], weight: 1, featured: true }),
    item('portuguese', 'pt', { title: 'Português', summary: 'P.', stack: ['go'] }),
  ],
  research: [
    item('old', 'en', { title: 'Old', kind: 'article', year: 2020, authors: ['A'], venue: 'V' }),
    item(
      'thesis',
      'en',
      { title: 'Thesis', kind: 'thesis', year: 2025, authors: ['A'], venue: 'V', file: 'thesis.pdf' },
      ['research/thesis/thesis.pdf'],
    ),
    item('wip', 'en', { title: 'Draft', kind: 'article', year: 2026, authors: ['A'], venue: 'V', draft: true }),
  ],
};

Deno.test('postsFor lists the language posts and the ones written only in another, newest first, without drafts', () => {
  assertEquals(
    postsFor(RAW, 'en').map(({ title, language }) => [title, language]),
    [
      ['Só português', 'pt'],
      ['English only', 'en'],
      ['Both', 'en'],
    ],
  );
});

Deno.test('postsFor never lists a post twice when it exists in the language, and names its category there', () => {
  const posts = postsFor(RAW, 'pt');
  assertEquals(
    posts.map(({ id, translations }) => [id, translations]),
    [
      ['pt-only', ['pt']],
      ['en-only', ['en']],
      ['both', ['en', 'pt']],
    ],
  );
  assertEquals(posts[0]?.category, { slug: 'notes', name: 'Notas' });
});

Deno.test('postsFor carries dates as YYYY-MM-DD even when YAML read them as dates', () => {
  assertEquals(postsFor(RAW, 'en')[1]?.date, '2026-02-01');
});

Deno.test('projectsFor puts a lower weight first and the rest by title, only in their own language', () => {
  assertEquals(
    projectsFor(RAW, 'en').map(({ title, featured }) => [title, featured]),
    [
      ['Heavy', true],
      ['Alpha', false],
      ['Zeta', false],
    ],
  );
  assertEquals(
    projectsFor(RAW, 'pt').map(({ title }) => title),
    ['Português'],
  );
});

Deno.test('researchFor lists the newest year first, leaves drafts out and points the file at its media path', () => {
  const research = researchFor(RAW, 'en');
  assertEquals(
    research.map(({ title }) => title),
    ['Thesis', 'Old'],
  );
  assertEquals(research[0]?.file, 'research/thesis/thesis.pdf');
});

Deno.test('cvFor falls back to another language in the declared order and says so', () => {
  assertEquals(cvFor(RAW, 'en', researchFor(RAW, 'en'))?.fallback, false);
  const fallback = cvFor(RAW, 'pt', researchFor(RAW, 'pt'));
  assertEquals([fallback?.language, fallback?.fallback, fallback?.basics.label], ['en', true, 'English CV']);
});

Deno.test('cvFor lists only the publications that exist in the language shown', () => {
  assertEquals(cvFor(RAW, 'en', researchFor(RAW, 'en'))?.publications, [
    { id: 'thesis', slug: 'thesis', title: 'Thesis', year: 2025 },
  ]);
  assertEquals(cvFor(RAW, 'pt', researchFor(RAW, 'pt'))?.publications, []);
});

Deno.test('buildModel builds the title and description from the content, and keeps the original data dates', () => {
  const model = buildModel(RAW, 'en');
  assertEquals(
    [model.profile?.title, model.profile?.description, model.music?.updated],
    ['Author — Developer', 'One. Two. Three.', '2026-01-01'],
  );
  assertEquals(model.contact?.email, 'contact@example.com');
});

Deno.test('buildModel leaves out what the language does not have instead of inventing it', () => {
  const model = buildModel(RAW, 'pt');
  assertEquals([model.profile, model.reading, model.films], [null, [], null]);
  assertEquals(model.categories, [{ slug: 'notes', name: 'Notas' }]);
});
