import { checkContentFile, readData } from '../content/check.ts';
import { missingFiles, type PostCategories, requiredFiles, undeclaredCategories } from '../content/consistency.ts';
import { editionNames, editionProblems, splitEdition, undeclaredEditions } from '../content/editions.ts';
import { containsExampleContent, isCheckedContentFile } from '../content/example.ts';
import type { Site } from '../content/schema.ts';
import { walkFiles } from '../shared/fs.ts';

const contentDir = Deno.args[0] ?? 'content';

/** The editions the site declares, read first, since the name of a file may carry one. */
async function declaredSite(): Promise<Site | null> {
  try {
    const read = readData('site/site.yaml', await Deno.readTextFile(`${contentDir}/site/site.yaml`));
    return 'data' in read ? (read.data as Site) : null;
  } catch {
    return null;
  }
}

const site = await declaredSite();
const editions = new Set(site ? editionNames(site) : []);
const exampleFiles: string[] = [];
const itemEditions: { path: string; editions: string[] | undefined }[] = [];
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
  const { edition } = splitEdition(relativePath, editions);
  if (edition === null) {
    present.add(relativePath);
  }
  const problem = checkContentFile(relativePath, text, editions);
  const read = problem === null ? readData(relativePath, text) : null;
  const data = read && 'data' in read ? (read.data as Record<string, unknown>) : null;
  if (data && relativePath === 'site/site.yaml') {
    languages = data['languages'] as string[];
  } else if (data && relativePath === 'categories/categories.yaml') {
    declaredCategories = new Set((data['categories'] as { slug: string }[]).map(({ slug }) => slug));
  } else if (data && relativePath.startsWith('posts/')) {
    posts.push({ path: relativePath, categories: data['categories'] as string[] });
  }
  if (data && /^(posts|projects|research)\//.test(relativePath)) {
    itemEditions.push({ path: relativePath, editions: data['editions'] as string[] | undefined });
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
  ...undeclaredEditions(itemEditions, editions).map((problem) => `${contentDir}/${problem}`),
  ...(site ? editionProblems(site) : []).map((problem) => `${contentDir}/site/site.yaml: ${problem}`),
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
  console.error(
    `Example content found:\n${bulletList(exampleFiles)}\nReplace it with real content or a [TODO] placeholder.`,
  );
  Deno.exit(1);
}
console.log('Content check passed.');
