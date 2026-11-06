import { parse } from '@std/toml';
import { fetchVerified } from '../../../../tools/shared/download.ts';
import { parseShareManifest } from '../share/schema.ts';

const MANIFEST_PATH = 'frontend/tui/data/share.toml';
const CACHE_DIR = '.cache/share-fonts';
const OUTPUT_DIR = 'generated/share';

/** A single transparent pixel: Hugo stretches it to the size of a share image and fills it with the theme. */
const CANVAS = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=';

const manifest = parseShareManifest(parse(await Deno.readTextFile(MANIFEST_PATH)));

await Deno.mkdir(`${OUTPUT_DIR}/fonts`, { recursive: true });
await Deno.writeFile(
  `${OUTPUT_DIR}/canvas.png`,
  Uint8Array.from(atob(CANVAS), (char) => char.charCodeAt(0)),
);
for (const font of manifest.fonts) {
  const data = await fetchVerified({
    url: font.url,
    sha256: font.sha256,
    cachePath: `${CACHE_DIR}/${font.sha256}.ttf`,
  });
  await Deno.writeFile(`${OUTPUT_DIR}/fonts/${font.file}`, data);
}
console.log(`Wrote the share canvas and ${manifest.fonts.length} fonts to ${OUTPUT_DIR}.`);
