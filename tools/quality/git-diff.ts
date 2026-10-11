import type { ChangedFile, ChangeStatus } from './types.ts';

const STATUS: ReadonlyMap<string, ChangeStatus> = new Map([
  ['A', 'added'],
  ['M', 'modified'],
  ['D', 'deleted'],
  ['R', 'renamed'],
]);

/**
 * Combines `git diff --name-status` and `git diff --numstat` output into one list.
 * Renames report the new path; binary files count as zero changed lines.
 */
export function parseGitDiff(nameStatus: string, numstat: string): ChangedFile[] {
  const lines = new Map<string, number>();
  for (const row of numstat.split('\n').filter(Boolean)) {
    const [added = '0', removed = '0', ...pathParts] = row.split('\t');
    const path = pathParts.at(-1) ?? '';
    lines.set(path, (Number.parseInt(added, 10) || 0) + (Number.parseInt(removed, 10) || 0));
  }

  return nameStatus
    .split('\n')
    .filter(Boolean)
    .map((row) => {
      const [code = '', ...paths] = row.split('\t');
      const path = paths.at(-1) ?? '';
      return { path, status: STATUS.get(code.charAt(0)) ?? 'modified', linesChanged: lines.get(path) ?? 0 };
    });
}
