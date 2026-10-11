import { parse } from '@std/yaml';
import { extractFrontMatter } from './front-matter.ts';
import { schemaForPath, summarizeIssues } from './schema.ts';

function readData(path: string, text: string): { data: unknown } | { problem: string } {
  const yaml = path.endsWith('.md') ? extractFrontMatter(text) : text;
  if (yaml === null) {
    return { problem: 'Missing front matter between --- lines' };
  }
  try {
    return { data: parse(yaml) };
  } catch (error) {
    return { problem: `Invalid YAML: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/** Validates one content file, given its path relative to the content root; returns null when it is valid. */
export function checkContentFile(path: string, text: string): string | null {
  const schema = schemaForPath(path);
  if (schema === null) {
    return 'No content type matches this path; check the folder, the file name and its language suffix';
  }
  const read = readData(path, text);
  return 'problem' in read ? read.problem : summarizeIssues(schema, read.data);
}
