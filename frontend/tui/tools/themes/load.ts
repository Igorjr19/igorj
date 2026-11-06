import { parse } from '@std/toml';
import { fetchVerified } from '../../../../tools/shared/download.ts';
import type { AccentFlavor } from './accents.ts';
import {
  type AccentSourceFile,
  parseAccentPalette,
  parseAccentSource,
  parsePalette,
  parseThemeDefaults,
  parseThemeManifest,
} from './schema.ts';
import type { Palette, ThemeDefaults, ThemeManifest } from './types.ts';

export async function loadThemeDefaults(path: string): Promise<ThemeDefaults> {
  return parseThemeDefaults(parse(await Deno.readTextFile(path)));
}

export async function loadThemeManifests(dir: string): Promise<ThemeManifest[]> {
  const manifests: ThemeManifest[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith('.toml')) {
      const id = entry.name.slice(0, -'.toml'.length);
      manifests.push(parseThemeManifest(id, parse(await Deno.readTextFile(`${dir}/${entry.name}`))));
    }
  }
  return manifests.sort((a, b) => a.id.localeCompare(b.id));
}

export async function loadPalette(manifest: ThemeManifest, cacheDir: string): Promise<Palette> {
  const data = await fetchVerified({
    url: manifest.palette.url,
    sha256: manifest.palette.sha256,
    cachePath: `${cacheDir}/${manifest.palette.sha256}.json`,
  });
  return parsePalette(JSON.parse(new TextDecoder().decode(data)), `Palette of "${manifest.id}"`);
}

/** The accent source and its palette, downloaded once and verified by its checksum. */
export async function loadAccents(
  path: string,
  cacheDir: string,
): Promise<{ source: AccentSourceFile; palette: Record<string, AccentFlavor> }> {
  const source = parseAccentSource(parse(await Deno.readTextFile(path)));
  const data = await fetchVerified({
    url: source.palette.url,
    sha256: source.palette.sha256,
    cachePath: `${cacheDir}/${source.palette.sha256}.json`,
  });
  const palette = parseAccentPalette(JSON.parse(new TextDecoder().decode(data)));
  return { source, palette: palette as Record<string, AccentFlavor> };
}
