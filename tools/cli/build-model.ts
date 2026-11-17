import { dirname } from '@std/path';
import { editionNames, resolveEdition } from '../content/editions.ts';
import { isCheckedContentFile } from '../content/example.ts';
import { readContent } from '../content/read.ts';
import type { ContentFile } from '../content/types.ts';
import { buildModel, forEditionOf } from '../model/build.ts';
import { removeIfExists, walkFiles } from '../shared/fs.ts';

const contentDir = Deno.args[0] ?? 'content';
const MODEL_DIR = 'generated/model';
const MEDIA_DIR = 'generated/media';

const paths: string[] = [];
for await (const path of walkFiles(contentDir)) {
  paths.push(path.slice(contentDir.length + 1));
}
const files: ContentFile[] = await Promise.all(
  paths
    .filter(isCheckedContentFile)
    .map(async (path) => ({ path, text: await Deno.readTextFile(`${contentDir}/${path}`) })),
);
const names = editionNames(readContent(files, paths).site);

await removeIfExists(MODEL_DIR);
await removeIfExists(MEDIA_DIR);
const written: string[] = [];
for (const name of names) {
  const raw = readContent(files, paths, name);
  const edition = resolveEdition(raw.site, name);
  await Deno.mkdir(`${MODEL_DIR}/${name}`, { recursive: true });
  for (const language of raw.site.languages) {
    const model = buildModel(raw, language, edition);
    await Deno.writeTextFile(`${MODEL_DIR}/${name}/${language}.json`, `${JSON.stringify(model, null, 2)}\n`);
  }
  // Pages refer to images and files by these paths, so the frontend never reads the content repository.
  // Each edition has its own, since a file made for an edition lays over the plain one under the same path.
  const kept = forEditionOf(raw, edition);
  const media = [...kept.posts, ...kept.projects, ...kept.research].flatMap((item) => item.media);
  for (const path of raw.photo ? [...media, raw.photo] : media) {
    await Deno.mkdir(dirname(`${MEDIA_DIR}/${name}/${path}`), { recursive: true });
    await Deno.copyFile(`${contentDir}/${raw.origin.get(path) ?? path}`, `${MEDIA_DIR}/${name}/${path}`);
  }
  written.push(`${name} (${raw.site.languages.join(', ')}; ${media.length + (raw.photo ? 1 : 0)} media files)`);
}
console.log(`Wrote ${MODEL_DIR}/ for ${written.join('; ')}.`);
