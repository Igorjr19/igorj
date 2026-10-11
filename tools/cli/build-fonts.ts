import { dirname } from '@std/path';
import { parse } from '@std/toml';
import { planFontFaces, selectPreloads } from '../fonts/plan.ts';
import { renderFontFaceCss } from '../fonts/render.ts';
import { parseFontPackage, parseFontsManifest } from '../fonts/schema.ts';
import type { FontPackage } from '../fonts/types.ts';
import { removeIfExists } from '../shared/fs.ts';

const MANIFEST_PATH = 'data/fonts.toml';
const PUBLIC_DIR = '/fonts';
const FONT_OUTPUT_DIR = 'generated/static/fonts';
const CSS_OUTPUT_PATH = 'generated/css/fonts.css';
const DATA_OUTPUT_PATH = 'generated/data/fonts.json';

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await Deno.readTextFile(path));
}

async function writeText(path: string, text: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, text);
}

const manifest = parseFontsManifest(parse(await Deno.readTextFile(MANIFEST_PATH)));

const packages = new Map<string, FontPackage>();
for (const { package: name } of manifest.families) {
  const dir = `node_modules/${name}`;
  packages.set(
    name,
    parseFontPackage(await readJson(`${dir}/metadata.json`), await readJson(`${dir}/unicode.json`), name),
  );
}

const faces = planFontFaces(manifest, packages);
const preloads = selectPreloads(faces, manifest.preload);

await removeIfExists(FONT_OUTPUT_DIR);
for (const face of faces) {
  const target = `${FONT_OUTPUT_DIR}/${face.relativePath}`;
  await Deno.mkdir(dirname(target), { recursive: true });
  await Deno.copyFile(`node_modules/${face.packageName}/files/${face.fileName}`, target);
}

await writeText(CSS_OUTPUT_PATH, renderFontFaceCss(faces, PUBLIC_DIR));
await writeText(
  DATA_OUTPUT_PATH,
  JSON.stringify({ preload: preloads.map((face) => `${PUBLIC_DIR}/${face.relativePath}`) }, null, 2),
);
console.log(`Wrote ${CSS_OUTPUT_PATH}, ${DATA_OUTPUT_PATH} and ${faces.length} font files.`);
