import { dirname } from '@std/path';
import { pathExists } from './fs.ts';
import { sha256Hex } from './hash.ts';

export interface DownloadOptions {
  readonly timeoutMs?: number;
  readonly attempts?: number;
}

export interface VerifiedDownload {
  readonly url: string;
  readonly sha256: string;
  readonly cachePath: string;
}

export type Downloader = (url: string, options?: DownloadOptions) => Promise<Uint8Array<ArrayBuffer>>;

export async function fetchBytes(
  url: string,
  { timeoutMs = 10_000, attempts = 2 }: DownloadOptions = {},
): Promise<Uint8Array<ArrayBuffer>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return new Uint8Array(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Failed to download ${url}: ${lastError}`);
}

/**
 * Returns the cached file when its checksum matches. Otherwise downloads it, verifies it and
 * replaces the cache, so a corrupted cache heals itself instead of failing every build.
 */
export async function fetchVerified(
  { url, sha256, cachePath }: VerifiedDownload,
  options: DownloadOptions = {},
  download: Downloader = fetchBytes,
): Promise<Uint8Array<ArrayBuffer>> {
  if (await pathExists(cachePath)) {
    const cached = await Deno.readFile(cachePath);
    if ((await sha256Hex(cached)) === sha256) {
      return cached;
    }
  }

  const data = await download(url, options);
  const actual = await sha256Hex(data);
  if (actual !== sha256) {
    throw new Error(`Checksum mismatch for ${url}: expected ${sha256}, got ${actual}`);
  }
  await Deno.mkdir(dirname(cachePath), { recursive: true });
  await Deno.writeFile(cachePath, data);
  return data;
}
