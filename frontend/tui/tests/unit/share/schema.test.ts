import { assertEquals, assertThrows } from '@std/assert';
import { parse } from '@std/toml';
import { parseShareManifest } from '../../../tools/share/schema.ts';

const FONT = {
  file: 'FiraCode-Bold.ttf',
  url: 'https://example.com/FiraCode-Bold.ttf',
  sha256: 'a'.repeat(64),
};

Deno.test('the share manifest pins each font to an https address and a checksum', () => {
  assertEquals(parseShareManifest({ fonts: [FONT] }).fonts, [FONT]);
  for (const font of [
    { ...FONT, url: 'http://example.com/FiraCode-Bold.ttf' },
    { ...FONT, sha256: 'not a checksum' },
    { ...FONT, file: '../FiraCode-Bold.ttf' },
    { ...FONT, file: 'FiraCode-Bold.woff2' },
  ]) {
    assertThrows(() => parseShareManifest({ fonts: [font] }));
  }
  assertThrows(() => parseShareManifest({ fonts: [] }));
});

Deno.test('the site manifest names the bold and regular Fira Code the images are drawn with', async () => {
  const manifest = parseShareManifest(parse(await Deno.readTextFile('frontend/tui/data/share.toml')));
  assertEquals(
    manifest.fonts.map((font) => font.file),
    ['FiraCode-Bold.ttf', 'FiraCode-Regular.ttf'],
  );
});
