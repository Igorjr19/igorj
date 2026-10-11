import { assertEquals } from '@std/assert';
import { parseGitDiff } from '../../../tools/quality/git-diff.ts';

Deno.test('parseGitDiff joins status and line counts, using the new path for renames', () => {
  const files = parseGitDiff(
    'M\ttools/a.ts\nR100\told.ts\ttools/b.ts\nA\timage.png\n',
    '3\t2\ttools/a.ts\n0\t0\ttools/b.ts\n-\t-\timage.png\n',
  );
  assertEquals(files, [
    { path: 'tools/a.ts', status: 'modified', linesChanged: 5 },
    { path: 'tools/b.ts', status: 'renamed', linesChanged: 0 },
    { path: 'image.png', status: 'added', linesChanged: 0 },
  ]);
});
