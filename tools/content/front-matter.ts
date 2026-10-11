const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/** Returns the YAML between the opening and closing `---` lines, or null when the file has none. */
export function extractFrontMatter(markdown: string): string | null {
  return FRONT_MATTER.exec(markdown)?.[1] ?? null;
}
