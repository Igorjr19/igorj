import { assert, assertEquals } from '@std/assert';
import { contrastRatio } from '../../../tools/color/contrast.ts';
import { ensureLegible, legibleColor } from '../../../tools/themes/legible.ts';
import { resolvedTheme } from './fixtures.ts';

Deno.test('legibleColor keeps a color that already reaches the minimum', () => {
  assertEquals(legibleColor('#0000aa', '#ffffff', '#000000', 4.5), '#0000aa');
});

Deno.test('legibleColor pulls a faint color towards the text just far enough to pass', () => {
  const yellow = legibleColor('#df8e1d', '#eff1f5', '#4c4f69', 4.5);
  const ratio = contrastRatio(yellow, '#eff1f5');
  assert(ratio >= 4.5 && ratio < 4.6, `${ratio.toFixed(3)}:1 is the smallest change that passes`);
});

Deno.test('ensureLegible adjusts the roles that miss their requirement and leaves the text alone', () => {
  const colors = { ...resolvedTheme('a', 'a', 'light', '#ffffff').colors, link: '#aaaaff' };
  const adjusted = ensureLegible(colors, [
    { foreground: 'link', background: 'background', minimum: 4.5 },
    { foreground: 'text', background: 'background', minimum: 21 },
  ]);
  assert(contrastRatio(adjusted.link, adjusted.background) >= 4.5);
  assertEquals(adjusted.text, '#000000');
});
