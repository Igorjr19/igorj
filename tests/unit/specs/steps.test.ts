import { assertEquals, assertThrows } from '@std/assert';
import { defineStep, matchStep } from '../../specs/support/steps.ts';

const handler = () => undefined;
const definitions = [
  defineStep<null>(/the browser prefers "([^"]+)"/, handler),
  defineStep<null>(/they land on the "([^"]+)" home page/, handler),
];

Deno.test('matchStep returns the captured arguments of the matching definition', () => {
  assertEquals(matchStep(definitions, 'the browser prefers "pt-BR"').args, ['pt-BR']);
});

Deno.test('matchStep anchors patterns so a step cannot match by substring', () => {
  assertThrows(() => matchStep(definitions, 'and the browser prefers "pt-BR" today'), Error, 'No step definition');
});

Deno.test('matchStep rejects ambiguous steps instead of picking one silently', () => {
  const ambiguous = [...definitions, defineStep<null>(/the browser prefers "(.+)"/, handler)];
  assertThrows(() => matchStep(ambiguous, 'the browser prefers "de"'), Error, '2 step definitions');
});
