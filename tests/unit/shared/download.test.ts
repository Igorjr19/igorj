import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import type { Downloader } from '../../../tools/shared/download.ts';
import { fetchVerified } from '../../../tools/shared/download.ts';
import { sha256Hex } from '../../../tools/shared/hash.ts';

const payload = new TextEncoder().encode('palette');
const checksum = await sha256Hex(payload);

function countingDownloader(data: Uint8Array<ArrayBuffer>): { download: Downloader; calls: () => number } {
  let calls = 0;
  return {
    download: () => {
      calls++;
      return Promise.resolve(data);
    },
    calls: () => calls,
  };
}

Deno.test('fetchVerified serves a valid cache without downloading', async () => {
  const dir = await Deno.makeTempDir();
  const cachePath = join(dir, 'file');
  await Deno.writeFile(cachePath, payload);
  const { download, calls } = countingDownloader(payload);

  await fetchVerified({ url: 'https://example.com/f', sha256: checksum, cachePath }, {}, download);
  assertEquals(calls(), 0);
});

Deno.test('fetchVerified replaces a corrupted cache instead of failing every build', async () => {
  const dir = await Deno.makeTempDir();
  const cachePath = join(dir, 'nested', 'file');
  await Deno.mkdir(join(dir, 'nested'));
  await Deno.writeTextFile(cachePath, 'corrupted');
  const { download, calls } = countingDownloader(payload);

  await fetchVerified({ url: 'https://example.com/f', sha256: checksum, cachePath }, {}, download);
  assertEquals(calls(), 1);
  assertEquals(await Deno.readFile(cachePath), payload);
});

Deno.test('fetchVerified rejects a download with the wrong checksum and does not cache it', async () => {
  const dir = await Deno.makeTempDir();
  const cachePath = join(dir, 'file');
  const { download } = countingDownloader(new TextEncoder().encode('tampered'));

  await assertRejects(
    () => fetchVerified({ url: 'https://example.com/f', sha256: checksum, cachePath }, {}, download),
    Error,
    'Checksum mismatch',
  );
  await assertRejects(() => Deno.stat(cachePath), Deno.errors.NotFound);
});
