import { assertEquals, assertThrows } from '@std/assert';
import { parseThirdPartyEntries } from '../../../tools/licenses/schema.ts';

const fromPackage = {
  name: 'Font',
  license: 'OFL-1.1',
  homepage: 'https://example.com',
  text: { package: '@fontsource/font', file: 'LICENSE' },
};

Deno.test('parseThirdPartyEntries accepts package files and pinned remote files', () => {
  const remote = { ...fromPackage, text: { url: 'https://example.com/LICENSE', sha256: 'a'.repeat(64) } };
  assertEquals(parseThirdPartyEntries({ entries: [fromPackage, remote] }).length, 2);
});

Deno.test('parseThirdPartyEntries rejects remote license files without a checksum', () => {
  const unpinned = { ...fromPackage, text: { url: 'https://example.com/LICENSE' } };
  assertThrows(() => parseThirdPartyEntries({ entries: [unpinned] }));
});
