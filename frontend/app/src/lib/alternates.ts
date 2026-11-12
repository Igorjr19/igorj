/** The pages that exist in every language under the same address, apart from the language. */
const SAME_EVERYWHERE = /^\/[^/]+\/(?:|projects\/|posts\/|research\/|cv\/|shelf\/|credits\/|tags\/|categories\/)$/;

/** The same page in the other languages: the pages every language has move to its address there; others tell it themselves. */
export function sameEverywhere(
  pathname: string,
  language: string,
  languages: readonly string[],
): Record<string, string> {
  if (!SAME_EVERYWHERE.test(pathname)) {
    return {};
  }
  return Object.fromEntries(
    languages
      .filter((other) => other !== language)
      .map((other) => [other, pathname.replace(`/${language}/`, `/${other}/`)]),
  );
}
