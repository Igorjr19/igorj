import { assert, assertEquals, assertThrows } from '@std/assert';
import { contrastRatio } from '../../../tools/color/contrast.ts';
import { type AccentFlavor, resolveAccents } from '../../../tools/themes/accents.ts';
import { groupFamilies } from '../../../tools/themes/families.ts';
import { renderThemeCss } from '../../../tools/themes/render.ts';
import { resolvedTheme } from './fixtures.ts';

const flavor = (pink: string, blue: string): AccentFlavor => ({
  colors: {
    blue: { hex: blue, accent: true, order: 1 },
    pink: { hex: pink, accent: true, order: 0 },
    base: { hex: '#808080', accent: false, order: 2 },
  },
});
const palette = { day: flavor('#ffc0e0', '#2050f0'), night: flavor('#ffc0e0', '#2050f0') };
const themes = [resolvedTheme('c-day', 'c', 'light', '#ffffff'), resolvedTheme('c-night', 'c', 'dark', '#000000')];
const source = { family: 'c', default: 'blue', flavors: { 'c-day': 'day', 'c-night': 'night' } };

Deno.test('resolveAccents lists the accents in palette order and makes each legible on every theme', () => {
  const accents = resolveAccents(source, palette, themes);
  assertEquals(accents.names, ['pink', 'blue']);
  const pinkOnDay = accents.colors['c-day']?.['pink'];
  assert(pinkOnDay && contrastRatio(pinkOnDay.link, '#ffffff') >= 4.5, 'text color passes 4.5:1');
  assert(pinkOnDay && contrastRatio(pinkOnDay.accent, '#ffffff') >= 3, 'border color passes 3:1');
  assertEquals(accents.colors['c-night']?.['pink']?.link, '#ffc0e0');
});

Deno.test('resolveAccents rejects a theme of the family that has no flavor', () => {
  assertThrows(
    () => resolveAccents({ ...source, flavors: { 'c-day': 'day' } }, palette, themes),
    Error,
    'has no flavor',
  );
});

Deno.test('renderThemeCss lets the default accent apply without the attribute and others only with it', () => {
  const accents = resolveAccents(source, palette, themes);
  const css = renderThemeCss(groupFamilies(themes), 'c', accents);
  assert(css.includes(":root:is(:not([data-accent]), [data-accent='blue']):not([data-theme-family], [data-theme])"));
  assert(css.includes("[data-theme='c-night'][data-accent='pink']"));
  assert(css.indexOf('[data-accent') > css.indexOf("[data-theme='c-night'] {"), 'accents come after the themes');
});
