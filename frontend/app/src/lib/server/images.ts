import { readFile } from 'node:fs/promises';
import type { ImagesManifest } from '../../../tools/image/manifest.ts';

const IMAGES = process.env['IMAGES_MANIFEST'] ?? '../../generated/data/images.json';

/** The dithered pictures the build tools made, by the media path the content uses; none when they have not run. */
export async function readImages(): Promise<ImagesManifest> {
  try {
    return JSON.parse(await readFile(IMAGES, 'utf8')) as ImagesManifest;
  } catch {
    return { portraits: {}, figures: {} };
  }
}
