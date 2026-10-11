import { AstBuilder, compile, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';

export interface Scenario {
  readonly name: string;
  readonly tags: readonly string[];
  readonly steps: readonly string[];
}

export interface Feature {
  readonly name: string;
  readonly scenarios: readonly Scenario[];
}

/** Parses a .feature file and expands outlines into one scenario per example row. */
export function parseFeature(source: string, uri: string): Feature {
  const newId = IdGenerator.incrementing();
  const document = new Parser(new AstBuilder(newId), new GherkinClassicTokenMatcher()).parse(source);
  const scenarios = compile({ ...document, uri }, uri, newId).map((pickle) => ({
    name: pickle.name,
    tags: pickle.tags.map((tag) => tag.name),
    steps: pickle.steps.map((step) => step.text),
  }));
  return { name: document.feature?.name ?? uri, scenarios };
}
