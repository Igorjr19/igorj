import { assertEquals } from '@std/assert';
import { relative } from '@std/path';

async function* files(directory: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(directory)) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory) {
      yield* files(path);
    } else if (/\.(ts|svelte)$/.test(entry.name)) {
      yield path;
    }
  }
}

const SRC = new URL('../../../src', import.meta.url).pathname;
/** The only places that may reach for the 3D library or the scene: the scene itself, and the one that loads it. */
const ALLOWED = ['lib/scene/', 'lib/presentation/', 'lib/scene/'];
/** The contract of the room, `scene/input.ts`, is public: the server builds it, the room only reads it. */
const REACHES = /(?:from|import)\s*\(?\s*['"](?:three(?:\/[^'"]*)?|[^'"]*\/scene\/(?!input\.ts['"])[^'"]*)['"]/;
/from\s+['"](?:three(?:\/[^'"]*)?|[^'"]*\/scene\/[^'"]*)['"]|import\(\s*['"](?:three(?:\/[^'"]*)?|[^'"]*\/scene\/[^'"]*)['"]\s*\)/;

Deno.test('nothing but the scene and its loader imports the 3D library or the scene, so the scene can be dropped by deleting its folder', async () => {
  const offenders: string[] = [];
  for await (const file of files(SRC)) {
    const path = relative(SRC, file);
    if (ALLOWED.some((prefix) => path.startsWith(prefix))) {
      continue;
    }
    if (REACHES.test(await Deno.readTextFile(file))) {
      offenders.push(path);
    }
  }
  assertEquals(offenders, []);
});
