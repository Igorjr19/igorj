import { assert, assertEquals } from '@std/assert';
import { editionNames, resolveEdition } from '../../../tools/content/editions.ts';
import { isCheckedContentFile } from '../../../tools/content/example.ts';
import { readContent } from '../../../tools/content/read.ts';
import type { ContentFile } from '../../../tools/content/types.ts';
import { buildModel } from '../../../tools/model/build.ts';
import { walkFiles } from '../../../tools/shared/fs.ts';

const ROOT = 'tests/fixtures/content';

/** The fixture content as the build reads it: every file of the content folders, and the paths of all of them. */
async function fixture(): Promise<{ files: ContentFile[]; paths: string[] }> {
  const paths: string[] = [];
  for await (const path of walkFiles(ROOT)) {
    paths.push(path.slice(ROOT.length + 1));
  }
  const files = await Promise.all(
    paths
      .filter(isCheckedContentFile)
      .map(async (path) => ({ path, text: await Deno.readTextFile(`${ROOT}/${path}`) })),
  );
  return { files, paths };
}

async function modelOf(edition: string, language: string) {
  const { files, paths } = await fixture();
  const raw = readContent(files, paths, edition);
  return { raw, model: buildModel(raw, language, resolveEdition(raw.site, edition)) };
}

Deno.test('the fixture site declares the complete edition and the professional one', async () => {
  const { files, paths } = await fixture();
  assertEquals(editionNames(readContent(files, paths).site), ['full', 'pro']);
});

Deno.test('the professional edition reads its own about file and the complete one the plain file', async () => {
  assertEquals((await modelOf('pro', 'en')).model.profile?.role, 'Professional developer');
  assertEquals((await modelOf('full', 'en')).model.profile?.role, 'Developer');
  assertEquals((await modelOf('pro', 'pt')).model.profile?.role, (await modelOf('full', 'pt')).model.profile?.role);
});

Deno.test('the professional edition carries only its categories and leaves the posts of the others out', async () => {
  const full = (await modelOf('full', 'en')).model;
  const pro = (await modelOf('pro', 'en')).model;
  assert(full.posts.some((post) => post.category.slug === 'entertainment'));
  assertEquals([...new Set(pro.posts.map((post) => post.category.slug))], ['professional']);
  assertEquals(
    pro.categories.map((category) => category.slug),
    ['academic', 'professional'],
  );
});

Deno.test('an item that names the editions it is in is not in the others', async () => {
  const full = (await modelOf('full', 'en')).model;
  const pro = (await modelOf('pro', 'en')).model;
  assert(full.projects.some((project) => project.id === 'second-project'));
  assert(!pro.projects.some((project) => project.id === 'second-project'));
});

Deno.test('the professional edition has no shelf, no personal networks and no boxes of listening or watching', async () => {
  const pro = (await modelOf('pro', 'en')).model;
  assertEquals(pro.sections.shelf, false);
  assertEquals([pro.music, pro.films, pro.reading], [null, null, []]);
  assertEquals(pro.contact?.personal, []);
  assertEquals(pro.edition, {
    name: 'pro',
    url: 'https://pro.igorj.dev/',
    index: false,
    boxes: ['recent', 'system', 'code'],
  });
  const full = (await modelOf('full', 'en')).model;
  assert(full.music !== null && (full.contact?.personal.length ?? 0) > 0);
  assertEquals(full.edition.index, true);
});
