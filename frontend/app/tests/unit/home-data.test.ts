import { assertEquals } from '@std/assert';
import { formatDuration, isStale, listeningBars, recentRows, systemSources } from '../../src/lib/home/data.ts';

const post = (slug: string, language = 'en', category = 'academic') =>
  ({
    slug,
    language,
    title: `Post ${slug}`,
    summary: `About ${slug}`,
    date: '2026-01-01',
    category: { slug: category, name: category.toUpperCase() },
  }) as never;

const project = (slug: string, featured: boolean) =>
  ({ slug, language: 'en', title: slug, featured, tags: [{ name: 'Go' }, { name: 'Deno' }] }) as never;

Deno.test('recent rows are the three latest posts, then at most two featured projects', () => {
  const rows = recentRows(
    {
      posts: ['a', 'b', 'c', 'd'].map((slug) => post(slug)),
      projects: [project('p1', true), project('p2', false), project('p3', true), project('p4', true)],
    },
    'en',
  );
  assertEquals(
    rows.map((row) => row.href),
    ['/en/posts/a/', '/en/posts/b/', '/en/posts/c/', '/en/projects/p1/', '/en/projects/p3/'],
  );
});

Deno.test('a post written in the other language links to its page there and says so with lang', () => {
  const [row] = recentRows({ posts: [post('x', 'pt')], projects: [] }, 'en');
  assertEquals([row?.href, row?.lang], ['/pt/posts/x/', 'pt']);
});

Deno.test('a post takes the color of its category and a project the link color', () => {
  const rows = recentRows({ posts: [post('a', 'en', 'notes')], projects: [project('p', true)] }, 'en');
  assertEquals(
    rows.map((row) => row.color),
    ['var(--color-category-notes)', 'var(--color-link)'],
  );
  assertEquals(rows[1]?.sub, 'Go · Deno');
});

Deno.test('data is stale from exactly a week old, so a stalled daily job shows its date', () => {
  const now = new Date('2026-11-10T12:00:00Z');
  assertEquals(isStale('2026-11-03', now), true);
  assertEquals(isStale('2026-11-04', now), false);
});

Deno.test('minutes read as hours and minutes, or only minutes under an hour', () => {
  assertEquals(
    [formatDuration(750), formatDuration(59), formatDuration(60), formatDuration(125)],
    ['12h 30m', '59m', '1h 00m', '2h 05m'],
  );
});

Deno.test('the listening bars scale to the most played artist, over all artists, and show the top three', () => {
  const artists = [100, 50, 25, 25].map((plays, index) => ({ name: `A${index}`, plays }));
  const { total, bars } = listeningBars(artists);
  assertEquals(total, 200);
  assertEquals(
    bars.map((bar) => bar.percent),
    [100, 50, 25],
  );
});

Deno.test('the system box names only the services that have data and the freshest save date', () => {
  const sources = [
    { name: 'Last.fm', model: 'music', what: '' },
    { name: 'GitHub', model: 'github', what: '' },
    { name: 'CodeTime', model: 'codetime', what: '' },
  ] as const;
  const result = systemSources(
    { music: { updated: '2026-11-01' }, github: { updated: '2026-11-09' }, films: null, codetime: null } as never,
    sources,
  );
  assertEquals(result, { names: ['Last.fm', 'GitHub'], updated: '2026-11-09' });
});
