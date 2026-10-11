import { assertEquals } from '@std/assert';
import { parse } from '@std/toml';

interface Mount {
  readonly source: string;
  readonly target: string;
}

async function mounts(path: string): Promise<Mount[]> {
  const config = parse(await Deno.readTextFile(path)) as { module: { mounts: Mount[] } };
  return config.module.mounts.map(({ source, target }) => ({ source, target }));
}

const isContentMount = ({ source }: Mount) => source === 'content' || source.startsWith('tests/fixtures/content');

Deno.test('the fixture Hugo config mirrors every non-content mount of the main config', async () => {
  const main = (await mounts('hugo.toml')).filter((mount) => !isContentMount(mount));
  const fixtures = (await mounts('tests/fixtures/hugo.toml')).filter((mount) => !isContentMount(mount));
  assertEquals(fixtures, main);
});
