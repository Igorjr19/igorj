import { dirname } from '@std/path';
import { isCheckedContentFile } from '../content/example.ts';
import { readContent } from '../content/read.ts';
import type { ContentFile } from '../content/types.ts';
import { buildModel } from '../model/build.ts';
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
const raw = readContent(files, paths);

await removeIfExists(MODEL_DIR);
await removeIfExists(MEDIA_DIR);
await Deno.mkdir(MODEL_DIR, { recursive: true });
for (const language of raw.site.languages) {
  const model = buildModel(raw, language);
  await Deno.writeTextFile(`${MODEL_DIR}/${language}.json`, `${JSON.stringify(model, null, 2)}\n`);
}

// Pages refer to images and files by these paths, so the frontend never reads the content repository.
const media = [...raw.posts, ...raw.projects, ...raw.research].flatMap((item) => item.media);
for (const path of raw.photo ? [...media, raw.photo] : media) {
  await Deno.mkdir(dirname(`${MEDIA_DIR}/${path}`), { recursive: true });
  await Deno.copyFile(`${contentDir}/${path}`, `${MEDIA_DIR}/${path}`);
}
console.log(
  `Wrote ${MODEL_DIR}/ for ${raw.site.languages.join(', ')} and ${media.length + (raw.photo ? 1 : 0)} media files.`,
);
