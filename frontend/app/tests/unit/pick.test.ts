import { assert, assertEquals } from '@std/assert';
import {
  categoryEntries,
  commandEntries,
  completion,
  type PickIndex,
  parseQuery,
  placeEntries,
  rank,
  themeEntries,
} from '../../src/lib/pick/entries.ts';
import { fold, fuzzyMatch, highlight } from '../../src/lib/pick/fuzzy.ts';

const index: PickIndex = {
  panes: [
    { key: 'home', label: 'Home', url: '/en/' },
    { key: 'posts', label: 'Writing', url: '/en/posts/' },
  ],
  items: {
    posts: [{ title: 'Fixture post', facts: 'Notes · 2026-01-01', url: '/en/posts/fixture-post/' }],
    projects: [{ title: 'Fixture project', facts: 'hugo', url: '/en/projects/fixture-project/' }],
  },
  categories: [{ slug: 'notes', name: 'Notes', url: '/en/categories/notes/', count: 2 }],
  tags: [
    {
      slug: 'machine-learning',
      name: 'machine learning',
      names: ['machine learning', 'aprendizado de máquina'],
      count: 1,
      url: '/en/tags/machine-learning/',
    },
  ],
  postsUrl: '/en/posts/',
  accents: ['mauve', 'peach'],
  themeIndex: {
    defaultFamily: 'c',
    families: [
      {
        name: 'c',
        label: 'C',
        system: { light: 'c-day', dark: 'c-night' },
        themes: [
          { id: 'c-day', name: 'C Day', variant: 'light', swatch: ['#fff'] },
          { id: 'c-night', name: 'C Night', variant: 'dark', swatch: ['#000'] },
        ],
      },
    ],
    accents: null,
  },
  strings: { cmdTheme: 'theme: choose the theme', cmdHelp: 'help: the keys', pickAll: 'all posts' },
};

Deno.test('fuzzyMatch finds the characters in order, ignoring case and accents', () => {
  assertEquals(fuzzyMatch('pesq', 'Pesquisa')?.positions, [0, 1, 2, 3]);
  assertEquals(fold('Ações'), 'acoes');
  assertEquals(fuzzyMatch('xyz', 'Pesquisa'), null);
});

Deno.test('a name that starts with what was typed wins over one that only contains it', () => {
  const start = fuzzyMatch('th', 'theme: choose the theme')?.score ?? 0;
  const inside = fuzzyMatch('th', 'help: the keys')?.score ?? 0;
  assert(start > inside);
});

Deno.test('highlight splits the text into matched and plain runs', () => {
  assertEquals(highlight('abc', [0, 2]), [
    { text: 'a', matched: true },
    { text: 'b', matched: false },
    { text: 'c', matched: true },
  ]);
});

Deno.test('the palette lists panes, items and categories, and ranks them by the query', () => {
  const labels = rank(placeEntries(index), 'fix pro').map((ranked) => ranked.entry.label);
  assertEquals(labels[0], 'Fixture project');
  assertEquals(placeEntries(index).length, 6);
});

Deno.test('commands start with >, show only what fits the page, and complete the best one', () => {
  assertEquals(parseQuery('> th'), { commands: true, text: 'th' });
  const commands = commandEntries(index, { hasList: false, isBlog: false, language: null });
  assert(!commands.some((entry) => entry.id === 'command:view'));
  const [best] = rank(commands, 'th');
  assertEquals(completion('th', best?.entry), 'eme: choose the theme');
});

Deno.test('the filter starts with all posts and marks the category open', () => {
  const entries = categoryEntries(index, '/en/categories/notes/', true);
  assertEquals(
    entries.map((entry) => [entry.label, entry.current]),
    [
      ['all posts', false],
      ['Notes', true],
    ],
  );
});

Deno.test('the theme list offers each family following the system, then its themes, with the choice marked', () => {
  const entries = themeEntries(index.themeIndex, 'follows the system', 'theme:c-night');
  assertEquals(
    entries.map((entry) => [entry.id, entry.current]),
    [
      ['family:c', false],
      ['theme:c-day', false],
      ['theme:c-night', true],
    ],
  );
});

Deno.test('a tag is found by its name in the other language too', () => {
  const [best] = rank(placeEntries(index), 'aprendizado');
  assertEquals(best?.entry.id, 'tag:machine-learning');
});
