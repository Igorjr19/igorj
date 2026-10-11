import { assertEquals } from '@std/assert';
import { parseFeature } from '../../specs/support/gherkin.ts';

const source = `Feature: Language
  @wip
  Scenario Outline: Browser prefers <language>
    Given the browser prefers "<language>"
    Then they land on the "<site>" home page

    Examples:
      | language | site       |
      | pt-BR    | Portuguese |
      | de       | English    |
`;

Deno.test('parseFeature expands outlines into one scenario per example, keeping tags', () => {
  const feature = parseFeature(source, 'language.feature');
  assertEquals(feature.name, 'Language');
  assertEquals(
    feature.scenarios.map((scenario) => [scenario.name, scenario.tags, scenario.steps]),
    [
      ['Browser prefers pt-BR', ['@wip'], ['the browser prefers "pt-BR"', 'they land on the "Portuguese" home page']],
      ['Browser prefers de', ['@wip'], ['the browser prefers "de"', 'they land on the "English" home page']],
    ],
  );
});
