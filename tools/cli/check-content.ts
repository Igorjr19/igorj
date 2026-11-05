import { checkContentFile, readData } from '../content/check.ts';
import { missingFiles, type PostCategories, requiredFiles, undeclaredCategories } from '../content/consistency.ts';
import { containsExampleContent, isCheckedContentFile } from '../content/example.ts';
import { walkFiles } from '../shared/fs.ts';

const contentDir = Deno.args[0] ?? 'content';
const allowExample = Deno.env.get('ALLOW_EXAMPLE_CONTENT') === '1';

const exampleFiles: string[] = [];
const invalidFiles: string[] = [];
const present = new Set<string>();
const posts: PostCategories[] = [];
let languages: string[] = [];
let declaredCategories = new Set<string>();
for await (const path of walkFiles(contentDir)) {
  const relativePath = path.slice(contentDir.length + 1);
  if (!isCheckedContentFile(relativePath)) {
    continue;
  }
  const text = await Deno.readTextFile(path);
  if (containsExampleContent(text)) {
    exampleFiles.push(path);
  }
  present.add(relativePath);
  const problem = checkContentFile(relativePath, text);
  const read = problem === null ? readData(relativePath, text) : null;
  const data = read && 'data' in read ? (read.data as Record<string, unknown>) : null;
  if (data && relativePath === 'site/site.yaml') {
    languages = data['languages'] as string[];
  } else if (data && relativePath === 'categories/categories.yaml') {
    declaredCategories = new Set((data['categories'] as { slug: string }[]).map(({ slug }) => slug));
  } else if (data && relativePath.startsWith('posts/')) {
    posts.push({ path: relativePath, categories: data['categories'] as string[] });
  }
  if (problem !== null) {
    invalidFiles.push(`${path}\n${problem.replace(/^/gm, '    ')}`);
  }
}

invalidFiles.push(
  ...missingFiles(requiredFiles(languages), present).map(
    (path) => `${contentDir}/${path}\n    Required file is missing`,
  ),
  ...undeclaredCategories(posts, declaredCategories).map((problem) => `${contentDir}/${problem}`),
);

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
