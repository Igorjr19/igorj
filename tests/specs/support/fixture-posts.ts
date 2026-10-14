import { parse } from '@std/yaml';

const POSTS_DIR = 'tests/fixtures/content/posts';

export interface FixturePost {
  readonly title: string;
  readonly categories: readonly string[];
  readonly draft: boolean;
  readonly body: string;
  /** Address of the English page, whether or not the build publishes it. */
  readonly path: string;
}

/** The English fixture posts, read from the sources the site is built from. */
export async function readEnglishPosts(): Promise<FixturePost[]> {
  const posts: FixturePost[] = [];
  for await (const entry of Deno.readDir(POSTS_DIR)) {
    const source = await Deno.readTextFile(`${POSTS_DIR}/${entry.name}/index.en.md`);
    const [, frontMatter = '', body = ''] = source.split(/^---$/m);
    const data = parse(frontMatter) as { title: string; categories: string[]; draft?: boolean };
    posts.push({
      title: data.title,
      categories: data.categories,
      draft: data.draft ?? false,
      body,
      path: `/en/posts/${entry.name}/`,
    });
  }
  return posts;
}
