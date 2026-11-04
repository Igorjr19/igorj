const EXAMPLE_FLAG = /^\s*"?example"?\s*:\s*true\s*,?\s*$/m;
const EXAMPLE_MARKER = '[EXAMPLE]';
const CHECKED_FILE = /\.(md|ya?ml|json)$/;

/** Example content is fake data for development and must never reach production. */
export function containsExampleContent(text: string): boolean {
  return EXAMPLE_FLAG.test(text) || text.includes(EXAMPLE_MARKER);
}

// Hidden folders such as .github hold the content repository's own tooling, not content.
const HIDDEN_SEGMENT = /(^|\/)\.[^/]/;

export function isCheckedContentFile(path: string): boolean {
  return CHECKED_FILE.test(path) && !path.endsWith('README.md') && !HIDDEN_SEGMENT.test(path);
}
