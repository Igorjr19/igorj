import { readdir, readFile } from 'node:fs/promises';
import type { SiteModel } from '../../../../../tools/model/types.ts';

const MODEL_DIR = process.env['MODEL_DIR'] ?? '../../generated/model';

export async function modelLanguages(): Promise<string[]> {
  const files = await readdir(MODEL_DIR);
  return files.filter((file) => file.endsWith('.json')).map((file) => file.slice(0, -'.json'.length));
}

export async function readModel(language: string): Promise<SiteModel> {
  return JSON.parse(await readFile(`${MODEL_DIR}/${language}.json`, 'utf8')) as SiteModel;
}
