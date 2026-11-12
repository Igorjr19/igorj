import { assertEquals } from '@std/assert';
import { translate } from '../../src/lib/i18n.ts';

const dictionary = {
  plain: 'Languages',
  value: 'Accent for {{ . }}',
  named: 'data from {{ .Date }}',
  items: { one: '{{ .Count }} item', other: '{{ .Count }} items' },
} as const;

Deno.test('a string fills its value and its named placeholders', () => {
  assertEquals(translate(dictionary, 'en', 'plain'), 'Languages');
  assertEquals(translate(dictionary, 'en', 'value', 'Mocha'), 'Accent for Mocha');
  // biome-ignore lint/style/useNamingConvention: the strings files name the placeholder Date
  assertEquals(translate(dictionary, 'en', 'named', { Date: '2026-11-10' }), 'data from 2026-11-10');
});

Deno.test('a count picks the singular or the plural form of the language', () => {
  assertEquals(translate(dictionary, 'en', 'items', 1), '1 item');
  assertEquals(translate(dictionary, 'en', 'items', 3), '3 items');
});

Deno.test('Portuguese counts zero as singular, as the strings files expect', () => {
  assertEquals(translate(dictionary, 'pt-BR', 'items', 0), '0 item');
});

Deno.test('an unknown key shows the key itself, so a missing string is visible instead of blank', () => {
  assertEquals(translate(dictionary, 'en', 'missing'), 'missing');
});
