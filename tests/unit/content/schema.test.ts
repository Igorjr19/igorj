import { assert, assertEquals, assertNotEquals, assertStringIncludes } from '@std/assert';
import { schemaForPath, summarizeIssues } from '../../../tools/content/schema.ts';

function issuesFor(path: string, data: unknown): string | null {
  const schema = schemaForPath(path);
  assertNotEquals(schema, null, `no schema for ${path}`);
  return schema === null ? null : summarizeIssues(schema, data);
}

function assertRejected(path: string, data: unknown, expected: string): void {
  const issues = issuesFor(path, data);
  assert(issues !== null, `${path} should be rejected`);
  assertStringIncludes(issues, expected);
}

const POST = {
  title: 'A post',
  summary: 'One sentence.',
  date: new Date('2026-10-05'),
  categories: ['devops'],
};

const PROJECT = {
  title: 'A project',
  summary: 'One sentence.',
  period: { start: '2025-03', end: '2025-09' },
  status: 'completed',
  stack: ['go'],
};

const ABOUT = {
  lines: ['one', 'two', 'three'],
  photoAlt: 'Photo',
  location: 'Somewhere',
  now: { work: 'work', masters: 'masters', studying: 'studying' },
  lastmod: new Date('2026-10-10'),
};

Deno.test('schemaForPath requires the folder, file name and a supported language suffix', () => {
  assertNotEquals(schemaForPath('posts/a-post/index.pt.md'), null);
  assertNotEquals(schemaForPath('about/about.en.yaml'), null);
  assertNotEquals(schemaForPath('contact/contact.yaml'), null);
  assertEquals(schemaForPath('posts/a-post/index.md'), null);
  assertEquals(schemaForPath('posts/a-post/index.es.md'), null);
  assertEquals(schemaForPath('posts/index.pt.md'), null);
  assertEquals(schemaForPath('about/conversation.pt.yaml'), null);
});

Deno.test('a post with the standard Hugo keys is valid, with or without the optional ones', () => {
  assertEquals(issuesFor('posts/a/index.pt.md', POST), null);
  assertEquals(
    issuesFor('posts/a/index.en.md', { ...POST, lastmod: '2026-10-12', draft: true, slug: 'a-post', example: true }),
    null,
  );
});

Deno.test('a post rejects the old Portuguese keys so a half-migrated file cannot pass', () => {
  const { title, ...withoutTitle } = POST;
  assertRejected('posts/a/index.pt.md', { ...withoutTitle, titulo: title }, '"titulo"');
  assertRejected('posts/a/index.pt.md', { ...POST, idioma: 'pt' }, '"idioma"');
});

Deno.test('a post has exactly one category, written as a slug shared by both languages', () => {
  assertRejected('posts/a/index.pt.md', { ...POST, categories: ['devops', 'ci'] }, 'exactly one category');
  assertRejected('posts/a/index.pt.md', { ...POST, categories: [] }, 'exactly one category');
  assertRejected('posts/a/index.pt.md', { ...POST, categories: ['Notas Curtas'] }, 'lowercase slug');
});

Deno.test('a post date must be a real ISO date', () => {
  assertRejected('posts/a/index.pt.md', { ...POST, date: '05/10/2026' }, 'YYYY-MM-DD');
});

Deno.test('a project status is one of the English identifiers the interface translates', () => {
  assertEquals(issuesFor('projects/a/index.pt.md', { ...PROJECT, status: 'in-progress' }), null);
  assertRejected('projects/a/index.pt.md', { ...PROJECT, status: 'concluido' }, '"completed"');
});

Deno.test('a project period uses months and cannot end before it starts', () => {
  assertEquals(issuesFor('projects/a/index.pt.md', { ...PROJECT, period: { start: '2026-02' } }), null);
  assertRejected('projects/a/index.pt.md', { ...PROJECT, period: { start: '2025-03-01' } }, 'YYYY-MM');
  assertRejected('projects/a/index.pt.md', { ...PROJECT, period: { start: '2025-09', end: '2025-03' } }, 'ends before');
});

Deno.test('a project rejects unknown link names to catch typos', () => {
  assertRejected(
    'projects/a/index.pt.md',
    { ...PROJECT, links: { repositorio: 'https://example.com' } },
    'repositorio',
  );
});

Deno.test('a research item uses kind, because type would select a Hugo layout', () => {
  const research = { title: 'A thesis', kind: 'thesis', year: 2026, authors: ['Someone'], venue: 'A university' };
  assertEquals(issuesFor('research/a/index.pt.md', research), null);
  assertRejected('research/a/index.pt.md', { ...research, type: 'thesis' }, '"type"');
  assertRejected('research/a/index.pt.md', { ...research, kind: 'monografia' }, '"thesis"');
});

Deno.test('the about text has exactly three lines and the now block', () => {
  assertEquals(issuesFor('about/about.pt.yaml', ABOUT), null);
  assertRejected('about/about.pt.yaml', { ...ABOUT, lines: ['one', 'two'] }, 'exactly three lines');
  const { now: _now, ...withoutNow } = ABOUT;
  assertRejected('about/about.pt.yaml', withoutNow, 'now');
});

Deno.test('the contact file requires valid e-mail addresses for both languages', () => {
  const contact = {
    email: { pt: 'a@example.com', en: 'b@example.com' },
    professional: [{ network: 'GitHub', url: 'https://github.com/example' }],
    personal: [],
  };
  assertEquals(issuesFor('contact/contact.yaml', contact), null);
  assertRejected('contact/contact.yaml', { ...contact, email: { pt: 'not an e-mail', en: 'b@example.com' } }, 'email');
});

Deno.test('music and film summaries reject any field that would reveal when something was consumed', () => {
  const music = { updated: '2026-10-10', period: 'week', artists: [{ name: 'An artist', plays: 3 }] };
  assertEquals(issuesFor('external/music.json', music), null);
  assertRejected(
    'external/music.json',
    { ...music, artists: [{ name: 'An artist', plays: 3, playedAt: '22:10' }] },
    'playedAt',
  );
  const films = { updated: '2026-10-10', films: [{ title: 'A film', year: 2024, rating: 4.5 }] };
  assertEquals(issuesFor('external/films.json', films), null);
  assertRejected(
    'external/films.json',
    { ...films, films: [{ title: 'A film', year: 2024, watched: '2026-10-01' }] },
    'watched',
  );
});

Deno.test('the reading list accepts books and papers only', () => {
  const reading = { items: [{ title: 'A book', authors: ['Someone'], kind: 'book' }] };
  assertEquals(issuesFor('reading/reading.yaml', reading), null);
  assertRejected('reading/reading.yaml', { items: [{ title: 'A', authors: ['B'], kind: 'podcast' }] }, '"paper"');
});
