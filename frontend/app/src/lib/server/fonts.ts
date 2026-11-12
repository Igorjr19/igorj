import { readFile } from 'node:fs/promises';

const FONTS = process.env['FONTS_MANIFEST'] ?? '../../generated/data/fonts.json';

/** The font files worth fetching before the page asks for them: the regular and bold weights of the mono face. */
export async function readFontPreloads(): Promise<string[]> {
  const { preload } = JSON.parse(await readFile(FONTS, 'utf8')) as { preload?: unknown };
  return Array.isArray(preload) ? preload.filter((path): path is string => typeof path === 'string') : [];
}
