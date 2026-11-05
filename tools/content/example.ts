const EXAMPLE_FLAG = /^\s*"?example"?\s*:\s*true\s*,?\s*$/m;
const EXAMPLE_MARKER = '[EXAMPLE]';
const CHECKED_FILE = /\.(md|ya?ml|json)$/;

/** Example content is fake data for development and must never reach production. */
export function containsExampleContent(text: string): boolean {
  return EXAMPLE_FLAG.test(text) || text.includes(EXAMPLE_MARKER);
}

/** The folders that hold content; the repository's README, tooling and workflows sit beside them and are never read. */
export const CONTENT_SECTIONS = [
  'about',
  'categories',
  'contact',
  'cv',
  'external',
  'posts',
  'projects',
  'reading',
  'research',
  'site',
];

/** Takes a path relative to the content root. */
export function isCheckedContentFile(path: string): boolean {
  const [section = ''] = path.split('/');
  return CHECKED_FILE.test(path) && CONTENT_SECTIONS.includes(section);
}
