import { assertEquals, assertThrows } from '@std/assert';
import {
  editionNames,
  editionProblems,
  inEdition,
  lineage,
  resolveEdition,
  sourcesFor,
  splitEdition,
  undeclaredEditions,
} from '../../../tools/content/editions.ts';
import type { Site } from '../../../tools/content/schema.ts';

const full = { url: 'https://igorj.dev/' };
const site = (editions: Site['editions']): Site => ({
  author: 'A',
  languages: ['pt', 'en'],
  ...(editions && { editions }),
});

Deno.test('a site that declares no editions is one edition called full, with everything on and no address', () => {
  const plain = site(undefined);
  assertEquals(editionNames(plain), ['full']);
  const edition = resolveEdition(plain, 'full');
  assertEquals(edition.url, null);
  assertEquals(edition.index, true);
  assertEquals(edition.personal, true);
  assertEquals(edition.categories, null);
  assertEquals(edition.boxes, ['recent', 'system', 'code', 'listening', 'watched']);
  assertEquals(Object.values(edition.sections), [true, true, true, true, true]);
});

Deno.test('an edition turns sections off, and the ones that extend it keep them off unless they say otherwise', () => {
  const declared = site({
    full: { ...full, sections: { research: false } },
    pro: { url: 'https://pro.igorj.dev/', extends: 'full', sections: { shelf: false } },
    open: { url: 'https://open.igorj.dev/', extends: 'pro', sections: { research: true } },
  });
  assertEquals(resolveEdition(declared, 'full').sections.research, false);
  assertEquals(resolveEdition(declared, 'full').sections.shelf, true);
  assertEquals(resolveEdition(declared, 'pro').sections.shelf, false);
  assertEquals(resolveEdition(declared, 'pro').sections.research, false);
  assertEquals(resolveEdition(declared, 'open').sections.research, true);
  assertEquals(resolveEdition(declared, 'open').sections.shelf, false);
});

Deno.test('an edition takes from the one it extends whatever it leaves out, and its own words win', () => {
  const declared = site({
    full: { ...full, boxes: ['recent', 'system'], categories: ['notes'] },
    pro: { url: 'https://pro.igorj.dev/', extends: 'full', index: false, personal: false, boxes: ['recent'] },
  });
  const pro = resolveEdition(declared, 'pro');
  assertEquals(pro.url, 'https://pro.igorj.dev/');
  assertEquals(pro.index, false);
  assertEquals(pro.personal, false);
  assertEquals(pro.boxes, ['recent']);
  assertEquals(pro.categories, ['notes']);
  assertEquals(lineage(declared, 'pro'), ['full', 'pro']);
});

Deno.test('an edition that does not exist, or that extends itself in a circle, is refused with the way it goes round', () => {
  const declared = site({
    full,
    a: { ...full, extends: 'b' },
    b: { ...full, extends: 'a' },
    c: { ...full, extends: 'missing' },
  });
  assertThrows(() => lineage(declared, 'a'), Error, 'a > b > a');
  assertThrows(() => lineage(declared, 'c'), Error, 'Edition "missing" is not declared');
  assertThrows(() => resolveEdition(declared, 'nope'), Error, 'Edition "nope" is not declared');
  assertEquals(editionProblems(declared).length, 3);
  assertEquals(editionProblems(site({ pro: full })).length, 1);
  assertEquals(editionProblems(site({ full })), []);
});

Deno.test('an item is in every edition unless it names the ones it is in, and a name that is not declared is reported', () => {
  assertEquals(inEdition({}, 'pro'), true);
  assertEquals(inEdition({ editions: ['full'] }, 'pro'), false);
  assertEquals(inEdition({ editions: ['full', 'pro'] }, 'pro'), true);
  assertEquals(
    undeclaredEditions(
      [
        { path: 'posts/a/index.pt.md', editions: ['full', 'oops'] },
        { path: 'x', editions: undefined },
      ],
      new Set(['full']),
    ),
    ['posts/a/index.pt.md: edition "oops" is not declared in site/site.yaml'],
  );
});

Deno.test('the edition in a file name is told from a language code and the file it lays over is found', () => {
  const names = new Set(['full', 'pro']);
  assertEquals(splitEdition('about/about.pro.pt.yaml', names), { base: 'about/about.pt.yaml', edition: 'pro' });
  assertEquals(splitEdition('posts/a/index.pro.en.md', names), { base: 'posts/a/index.en.md', edition: 'pro' });
  assertEquals(splitEdition('about/about.pt.yaml', names), { base: 'about/about.pt.yaml', edition: null });
  assertEquals(splitEdition('external/music.json', names), { base: 'external/music.json', edition: null });
  assertEquals(splitEdition('about/about.other.pt.yaml', names).edition, null);
});

Deno.test('building an edition reads its own file where it has one, the file of the edition it extends next, and the plain one last', () => {
  const names = new Set(['full', 'pro', 'mini']);
  const paths = [
    'about/about.pt.yaml',
    'about/about.pro.pt.yaml',
    'about/about.mini.pt.yaml',
    'cv/cv.pt.yaml',
    'cv/cv.full.pt.yaml',
  ];
  assertEquals(sourcesFor(paths, names, ['full', 'pro']).get('about/about.pt.yaml'), 'about/about.pro.pt.yaml');
  assertEquals(sourcesFor(paths, names, ['full']).get('about/about.pt.yaml'), 'about/about.pt.yaml');
  assertEquals(sourcesFor(paths, names, ['full', 'pro']).get('cv/cv.pt.yaml'), 'cv/cv.full.pt.yaml');
  assertEquals(sourcesFor(paths, names, ['mini']).get('cv/cv.pt.yaml'), 'cv/cv.pt.yaml');
  assertEquals([...sourcesFor(paths, names, ['mini']).keys()].sort(), ['about/about.pt.yaml', 'cv/cv.pt.yaml']);
});
