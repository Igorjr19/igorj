import { readFile } from 'node:fs/promises';
import { parse } from 'smol-toml';
import type { Dictionary } from '../i18n.ts';

const I18N_DIR = process.env['I18N_DIR'] ?? '../tui/i18n';

export async function readDictionary(language: string): Promise<Dictionary> {
  return parse(await readFile(`${I18N_DIR}/${language}.toml`, 'utf8')) as Dictionary;
}
