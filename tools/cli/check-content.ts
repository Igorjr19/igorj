import { checkContentFile } from '../content/check.ts';
import { containsExampleContent, isCheckedContentFile } from '../content/example.ts';
import { walkFiles } from '../shared/fs.ts';

const contentDir = Deno.args[0] ?? 'content';
const allowExample = Deno.env.get('ALLOW_EXAMPLE_CONTENT') === '1';

const exampleFiles: string[] = [];
const invalidFiles: string[] = [];
for await (const path of walkFiles(contentDir)) {
  if (!isCheckedContentFile(path)) {
    continue;
  }
  const text = await Deno.readTextFile(path);
  if (containsExampleContent(text)) {
    exampleFiles.push(path);
  }
  const problem = checkContentFile(path.slice(contentDir.length + 1), text);
  if (problem !== null) {
    invalidFiles.push(`${path}\n${problem.replace(/^/gm, '    ')}`);
  }
}

const bulletList = (items: string[]) =>
  items
    .sort()
    .map((item) => `  - ${item}`)
    .join('\n');

if (invalidFiles.length > 0) {
  console.error(`Invalid content:\n${bulletList(invalidFiles)}`);
  Deno.exit(1);
}
if (exampleFiles.length > 0) {
  if (!allowExample) {
    console.error(
      `Example content found:\n${bulletList(exampleFiles)}\nReplace it, or set ALLOW_EXAMPLE_CONTENT=1 for previews.`,
    );
    Deno.exit(1);
  }
  console.warn(
    `${exampleFiles.length} example file(s) allowed by ALLOW_EXAMPLE_CONTENT=1:\n${bulletList(exampleFiles)}`,
  );
}
console.log('Content check passed.');
