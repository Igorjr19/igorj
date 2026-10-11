export interface ConventionViolation {
  readonly path: string;
  readonly line: number;
  readonly rule: string;
  readonly text: string;
}

interface ConventionRule {
  readonly name: string;
  readonly pattern: RegExp;
}

/** Planning documents live outside the repository, so references to them mean nothing to a reader of the code. */
const RULES: readonly ConventionRule[] = [
  { name: 'decision reference', pattern: /(?<![#\w-])(?:H-)?D\d{2}\b/ },
  { name: 'planning docs reference', pattern: /(?<![\w./-])docs\// },
];

const SKIPPED = [
  /^deno\.lock$/,
  /^LICENSE$/,
  /\.(png|jpe?g|webp|woff2?)$/,
  // Its examples are the very strings the rules reject.
  /^tests\/unit\/quality\/conventions\.test\.ts$/,
];

export function shouldCheck(path: string): boolean {
  return !SKIPPED.some((pattern) => pattern.test(path));
}

export function findConventionViolations(path: string, text: string): ConventionViolation[] {
  return text.split('\n').flatMap((content, index) =>
    RULES.filter((rule) => rule.pattern.test(content)).map((rule) => ({
      path,
      line: index + 1,
      rule: rule.name,
      text: content.trim(),
    })),
  );
}
