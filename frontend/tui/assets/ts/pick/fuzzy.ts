/** Where a query matched a text: the score (higher is better) and the matched character positions. */
export interface FuzzyMatch {
  readonly score: number;
  readonly positions: readonly number[];
}

/** Folds case and accents, so "pesquisa" finds "Pesquisa" and "acoes" finds "ações". */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** What one matched character adds: one, more when it follows the previous match or starts a word. */
function charScore(haystack: string, at: number, previous: number | undefined): number {
  const consecutive = previous === at - 1 ? 3 : 0;
  const wordStart = at === 0 || /\W/.test(haystack[at - 1] ?? '') ? 2 : 0;
  return 1 + consecutive + wordStart;
}

/**
 * The query's characters in order inside the text, like fzf. Consecutive characters and
 * matches at the start of a word score more; a query that does not fit returns null.
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const wanted = fold(query.trim());
  if (!wanted) {
    return { score: 0, positions: [] };
  }
  const haystack = fold(text);
  const positions: number[] = [];
  let score = 0;
  let from = 0;
  for (const char of wanted) {
    const at = haystack.indexOf(char, from);
    if (at < 0) {
      return null;
    }
    score += charScore(haystack, at, positions.at(-1));
    positions.push(at);
    from = at + 1;
  }
  // A name that starts with what was typed is almost always the one meant.
  const prefix = haystack.startsWith(wanted) ? 10 : 0;
  return { score: score + prefix - haystack.length / 100, positions };
}

/** Splits a text into plain and matched runs, for highlighting. */
export function highlight(text: string, positions: readonly number[]): { text: string; matched: boolean }[] {
  const marked = new Set(positions);
  const runs: { text: string; matched: boolean }[] = [];
  for (const [index, char] of [...text].entries()) {
    const matched = marked.has(index);
    const last = runs.at(-1);
    if (last && last.matched === matched) {
      last.text += char;
    } else {
      runs.push({ text: char, matched });
    }
  }
  return runs;
}
