import { assert, assertEquals } from '@std/assert';
import {
  commonPrefix,
  complete,
  format,
  type Line,
  resolve,
  run,
  type TerminalData,
} from '../../../assets/ts/terminal/commands.ts';

const data: TerminalData = {
  profile: {
    author: 'Fixture Author',
    role: 'Developer',
    lines: ['Line one.'],
    location: 'Fixture city',
    now: { work: 'Fixture job' },
  },
  contact: { email: 'a@example.com', professional: [{ network: 'GitHub', url: 'https://github.com/example' }] },
  items: {
    posts: [
      {
        name: 'first.md',
        title: 'First',
        facts: 'Notes · 2026-01-01',
        summary: 'S',
        url: '/en/posts/first/',
        text: 'Body.',
      },
    ],
    projects: [],
    research: [],
  },
  music: { artists: [{ name: 'Artist', plays: 3 }] },
  films: { films: [{ title: 'Film', year: 2020, rating: 3.5 }] },
  reading: [],
  panes: [
    { key: 'home', label: 'Home', url: '/en/' },
    { key: 'posts', label: 'Writing', url: '/en/posts/' },
  ],
  themes: [
    { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', family: 'catppuccin' },
    { id: 'one-dark', name: 'One Dark', family: 'one' },
  ],
  accents: ['mauve', 'peach'],
  build: { commit: 'abc1234', date: '2026-11-06' },
  host: 'igorj.dev',
  strings: { termUnknown: '%s: command not found', termNotFound: '%s: missing', termOpening: 'opening %s' },
};

const context = { data, cwd: '', history: [], themeName: 'Catppuccin Mocha · mauve' };
const text = (lines: readonly Line[]) => lines.map((line) => line.map(([, part]) => part).join(''));

Deno.test('format fills each %s in turn', () => {
  assertEquals(format('%s and %s', 'a', 1), 'a and 1');
});

Deno.test('resolve follows folders, the home and .., and names the file at the end', () => {
  assertEquals(resolve('', 'posts/first.md'), { dir: 'posts', file: 'first.md', valid: true });
  assertEquals(resolve('posts', '..'), { dir: '', file: null, valid: true });
  assertEquals(resolve('posts', '~/projects'), { dir: 'projects', file: null, valid: true });
  assertEquals(resolve('', 'nowhere/first.md').valid, false);
});

Deno.test('ls at the root shows the folders and the files; in a folder, its items with their facts', () => {
  assertEquals(text(run('ls', context).lines)[0]?.includes('posts/'), true);
  assertEquals(text(run('ls', context).lines)[0]?.includes('about.txt'), true);
  assertEquals(text(run('ls posts', context).lines), [`${'first.md'.padEnd(34)}Notes · 2026-01-01`]);
});

Deno.test('cd changes the folder, and cat reads an item from it', () => {
  const cd = run('cd posts', context);
  assertEquals(cd.cwd, 'posts');
  assertEquals(text(run('cat first.md', { ...context, cwd: 'posts' }).lines), [
    '# First',
    'Notes · 2026-01-01',
    '',
    'Body.',
  ]);
});

Deno.test('open asks the page to go to the item, or to the pane of a folder', () => {
  assertEquals(run('open posts/first', context).open, '/en/posts/first/');
  assertEquals(run('open posts', context).open, '/en/posts/');
  assertEquals(run('open', context).open, '/en/');
});

Deno.test('theme switches by short name and accent, and refuses an unknown one', () => {
  assertEquals(run('theme mocha peach', context).theme, { id: 'catppuccin-mocha', accent: 'peach' });
  assertEquals(run('theme one-dark', context).theme, { id: 'one-dark' });
  assertEquals(run('theme nope', context).theme, undefined);
});

Deno.test('an unknown command says so, and the ones that act on the page say what to do', () => {
  assertEquals(text(run('frobnicate', context).lines), ['frobnicate: command not found']);
  assertEquals([run('clear', context).clear, run('exit', context).exit], [true, true]);
});

Deno.test('tree and fetch draw their lines in the script, with the build and the theme in effect', () => {
  assert(text(run('tree', context).lines).includes('│   └── first.md'));
  const fetched = text(run('fetch', context).lines).join('\n');
  assert(fetched.includes('abc1234 · 2026-11-06') && fetched.includes('Catppuccin Mocha · mauve'));
});

Deno.test('complete offers commands, then folders and files, then themes and accents', () => {
  assertEquals(complete('th', '', data), ['theme']);
  assertEquals(complete('cat po', '', data), ['posts/']);
  assertEquals(complete('cat posts/f', '', data), ['posts/first.md']);
  assertEquals(complete('cd ', '', data), ['projects/', 'posts/', 'research/']);
  assertEquals(complete('theme mocha p', '', data), ['peach']);
});

Deno.test('commonPrefix is what every candidate starts with', () => {
  assertEquals(commonPrefix(['projects/', 'posts/']), 'p');
  assertEquals(commonPrefix([]), '');
});

Deno.test('a few commands stay out of help and tab, for the curious', () => {
  const secrets = {
    ...context,
    data: { ...data, strings: { ...data.strings, termSudo: '%s is not in the sudoers file.', termRm: 'nice try' } },
  };
  assertEquals(text(run('sudo ls', secrets).lines), ['igor is not in the sudoers file.']);
  assertEquals(text(run('rm -rf /', secrets).lines), ['nice try']);
  assertEquals(text(run('cowsay hi', secrets).lines).slice(0, 3), [' ____', '< hi >', ' ----']);
  assertEquals(complete('su', '', data), []);
});
