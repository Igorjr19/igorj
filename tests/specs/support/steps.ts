export type StepHandler<World> = (world: World, ...args: string[]) => Promise<void> | void;

export interface StepDefinition<World> {
  readonly pattern: RegExp;
  readonly handler: StepHandler<World>;
}

export interface StepMatch<World> {
  readonly handler: StepHandler<World>;
  readonly args: readonly string[];
}

export function defineStep<World>(pattern: RegExp, handler: StepHandler<World>): StepDefinition<World> {
  return { pattern: new RegExp(`^${pattern.source}$`, pattern.flags), handler };
}

/** Finds the single definition that matches a step; zero or several matches are errors in the spec suite. */
export function matchStep<World>(definitions: readonly StepDefinition<World>[], text: string): StepMatch<World> {
  const matches = definitions.flatMap((definition) => {
    const result = definition.pattern.exec(text);
    return result ? [{ handler: definition.handler, args: result.slice(1) }] : [];
  });
  const [match, ...others] = matches;
  if (!match) {
    throw new Error(`No step definition matches "${text}"`);
  }
  if (others.length > 0) {
    throw new Error(`${matches.length} step definitions match "${text}"`);
  }
  return match;
}
