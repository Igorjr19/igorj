import { assert, assertEquals, assertThrows } from '@std/assert';
import { contrastRatio } from '../../../tools/color/contrast.ts';
import { resolveColors } from '../../../tools/themes/resolve.ts';
import { defaults, palette } from './fixtures.ts';

Deno.test('resolveColors maps roles to palette colors', () => {
  const colors = resolveColors(palette, defaults, {});
  assertEquals(colors.text, palette.foreground);
  assertEquals(colors.accent, palette.blue);
});

Deno.test('resolveColors follows @role references, including chains', () => {
  const colors = resolveColors(palette, defaults, { accent: 'cyan' });
  assertEquals(colors.link, palette.cyan);
  assertEquals(colors['selection-text'], palette.background);
});

Deno.test('resolveColors lets a theme override a default role', () => {
  assertEquals(resolveColors(palette, defaults, { 'text-muted': 'white' })['text-muted'], palette.white);
});

Deno.test('resolveColors rejects role cycles instead of recursing forever', () => {
  assertThrows(() => resolveColors(palette, defaults, { accent: '@link' }), Error, 'Role cycle');
});

Deno.test('resolveColors derives surfaces that move steadily from the background towards the text', () => {
  const colors = resolveColors(palette, defaults, {});
  const distance = (surface: 'surface-1' | 'surface-2' | 'surface-3') =>
    contrastRatio(colors.background, colors[surface]);
  assert(distance('surface-1') > 1);
  assert(distance('surface-1') < distance('surface-2'));
  assert(distance('surface-2') < distance('surface-3'));
  assert(distance('surface-3') < contrastRatio(colors.background, colors.text));
});
