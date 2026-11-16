import { assertEquals } from '@std/assert';
import { bootLines } from '../../../src/lib/monitor/boot-lines.ts';

const system = {
  commit: '78d88501bb7296b01a3df6dc47816e9940a679d3',
  built: '2026-11-16',
  counts: { posts: 2, projects: 3, research: null },
  sources: ['Last.fm', 'GitHub'],
  updated: null,
};

/** Shows the key and what was passed, so the test sees which words are asked for with which values. */
const t = (key: string, argument?: unknown): string =>
  argument === undefined ? key : `${key}(${JSON.stringify(argument)})`;

Deno.test('the lines state the build with a short commit, the content that exists and the data sources', () => {
  assertEquals(bootLines(system, t), [
    'bootBios',
    'bootBuild({"Commit":"78d8850","Built":"2026-11-16"})',
    'bootContent("bootPosts(2) · bootProjects(3)")',
    'bootData("Last.fm · GitHub")',
    'bootMemory',
    'bootStart',
  ]);
});

Deno.test('a build without a commit says it is local, and no content or sources drops those lines', () => {
  const lines = bootLines(
    { ...system, commit: null, counts: { posts: null, projects: null, research: null }, sources: [] },
    t,
  );
  assertEquals(lines[1], 'bootBuild({"Commit":"bootLocal","Built":"2026-11-16"})');
  assertEquals(lines.length, 4);
});

async function wording(language: string, locale: string) {
  const { parse } = await import('smol-toml');
  const { translate } = await import('../../../src/lib/i18n.ts');
  const dictionary = parse(
    await Deno.readTextFile(new URL(`../../../i18n/${language}.toml`, import.meta.url)),
  ) as Parameters<typeof translate>[0];
  return (key: string, argument?: Parameters<typeof translate>[3]) => translate(dictionary, locale, key, argument);
}

Deno.test('the real strings give each language its own words and the right plural for a count', async () => {
  const en = bootLines({ ...system, counts: { posts: 1, projects: 3, research: 2 } }, await wording('en', 'en-US'));
  assertEquals(en[1], 'build 78d8850 2026-11-16');
  assertEquals(en[2], 'content 1 post · 3 projects · 2 papers');
  const pt = bootLines({ ...system, counts: { posts: 1, projects: 3, research: 1 } }, await wording('pt', 'pt-BR'));
  assertEquals(pt[1], 'versão 78d8850 2026-11-16');
  assertEquals(pt[2], 'conteúdo 1 texto · 3 projetos · 1 pesquisa');
});
