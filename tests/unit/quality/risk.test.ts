import { assertEquals } from '@std/assert';
import { assessRisk, renderRiskReport } from '../../../tools/quality/risk.ts';
import type { ChangedFile } from '../../../tools/quality/types.ts';

const file = (path: string, status: ChangedFile['status'] = 'modified', linesChanged = 10): ChangedFile => ({
  path,
  status,
  linesChanged,
});

const categories = (files: ChangedFile[]) => assessRisk(files).findings.map((finding) => finding.category);

Deno.test('assessRisk lets a plain code change with new tests through without review', () => {
  assertEquals(categories([file('tools/fonts/plan.ts'), file('tests/unit/fonts/new.test.ts', 'added')]), []);
});

Deno.test('assessRisk flags specs, quality gates and dependencies, which only a human may change', () => {
  assertEquals(categories([file('specs/home.feature')]), ['specs']);
  assertEquals(categories([file('biome.json')]), ['quality-gates']);
  assertEquals(categories([file('.dependency-cruiser.json')]), ['quality-gates']);
  assertEquals(categories([file('codecov.yml')]), ['quality-gates']);
  assertEquals(categories([file('deno.lock')]), ['dependencies']);
});

Deno.test('assessRisk flags existing tests edited together with production code', () => {
  assertEquals(categories([file('tools/fonts/plan.ts'), file('tests/unit/fonts/plan.test.ts')]), [
    'tests-changed-with-code',
  ]);
});

Deno.test('assessRisk does not flag test-only refactors', () => {
  assertEquals(categories([file('tests/unit/fonts/plan.test.ts')]), []);
});

Deno.test('assessRisk flags workflows both as a gate and as deployment', () => {
  assertEquals(categories([file('.github/workflows/ci.yml')]), ['quality-gates', 'deployment']);
});

Deno.test('assessRisk flags large changes but ignores the lockfile and fixtures when counting', () => {
  assertEquals(categories([file('tools/a.ts', 'modified', 401)]), ['large-change']);
  assertEquals(categories([file('tests/fixtures/content/x.md', 'added', 900), file('tools/a.ts', 'modified', 5)]), []);
});

Deno.test('renderRiskReport says when a change is safe to merge', () => {
  assertEquals(renderRiskReport({ findings: [], linesChanged: 3 }).includes('No risk signals'), true);
});
