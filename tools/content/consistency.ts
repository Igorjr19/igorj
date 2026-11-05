/** A post's path and the categories its front matter names. */
export interface PostCategories {
  readonly path: string;
  readonly categories: readonly string[];
}

/** Files the site cannot be built without: who it is about, its languages, the category names and an about per language. */
export function requiredFiles(languages: readonly string[]): string[] {
  return [
    'site/site.yaml',
    'categories/categories.yaml',
    ...languages.map((language) => `about/about.${language}.yaml`),
  ];
}

export function missingFiles(required: readonly string[], present: ReadonlySet<string>): string[] {
  return required.filter((path) => !present.has(path));
}

/** A category a post uses but the categories file does not name would show its slug instead of a name. */
export function undeclaredCategories(posts: readonly PostCategories[], declared: ReadonlySet<string>): string[] {
  return posts.flatMap(({ path, categories }) =>
    categories
      .filter((slug) => !declared.has(slug))
      .map((slug) => `${path}: category "${slug}" is not in categories/categories.yaml`),
  );
}
