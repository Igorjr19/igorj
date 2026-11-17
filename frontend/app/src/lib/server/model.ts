import { readdir, readFile } from 'node:fs/promises';
import type { SiteModel } from '../../../../../tools/model/types.ts';

/** The edition this build is for: the one the build is asked for, or the complete one. */
export const EDITION = process.env['EDITION'] ?? 'full';
const MODEL_ROOT = process.env['MODEL_DIR'] ?? '../../generated/model';
const MODEL_DIR = `${MODEL_ROOT}/${EDITION}`;

export async function modelLanguages(): Promise<string[]> {
  const files = await readdir(MODEL_DIR);
  return files.filter((file) => file.endsWith('.json')).map((file) => file.slice(0, -'.json'.length));
}

export async function readModel(language: string): Promise<SiteModel> {
  return JSON.parse(await readFile(`${MODEL_DIR}/${language}.json`, 'utf8')) as SiteModel;
}
