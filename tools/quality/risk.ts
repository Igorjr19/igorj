import { MAX_LINES_CHANGED, PATH_RULES, type PathRule, PRODUCTION_CODE, SIZE_EXCLUDED, TEST_FILE } from './rules.ts';
import type { ChangedFile, RiskFinding, RiskReport } from './types.ts';

function matchRule(rule: PathRule, files: readonly ChangedFile[]): RiskFinding | null {
  const matched = files.filter((file) => rule.patterns.some((pattern) => pattern.test(file.path)));
  return matched.length > 0
    ? { category: rule.category, reason: rule.reason, files: matched.map((file) => file.path) }
    : null;
}

/** Existing tests edited or removed in the same change as production code. New tests are fine. */
function testsChangedWithCode(files: readonly ChangedFile[]): RiskFinding | null {
  const alteredTests = files.filter((file) => TEST_FILE.test(file.path) && file.status !== 'added');
  const touchesCode = files.some((file) => PRODUCTION_CODE.test(file.path));
  return alteredTests.length > 0 && touchesCode
    ? {
        category: 'tests-changed-with-code',
        reason: 'Existing tests changed together with the code they verify; check that no assertion was weakened.',
        files: alteredTests.map((file) => file.path),
      }
    : null;
}

export function assessRisk(files: readonly ChangedFile[]): RiskReport {
  const linesChanged = files
    .filter((file) => !SIZE_EXCLUDED.some((pattern) => pattern.test(file.path)))
    .reduce((total, file) => total + file.linesChanged, 0);

  const findings = [...PATH_RULES.map((rule) => matchRule(rule, files)), testsChangedWithCode(files)].filter(
    (finding): finding is RiskFinding => finding !== null,
  );

  if (linesChanged > MAX_LINES_CHANGED) {
    findings.push({
      category: 'large-change',
      reason: `More than ${MAX_LINES_CHANGED} changed lines; smaller changes keep the other signals meaningful.`,
      files: [],
    });
  }
  return { findings, linesChanged };
}

export function renderRiskReport({ findings, linesChanged }: RiskReport): string {
  if (findings.length === 0) {
    return `## Risk report\n\nNo risk signals (${linesChanged} lines changed). Safe to merge once all checks pass.\n`;
  }
  const sections = findings.map(({ category, reason, files }) => {
    const list = files.map((file) => `- \`${file}\``).join('\n');
    return [`### ${category}`, reason, list].filter(Boolean).join('\n\n');
  });
  return [`## Risk report`, `Needs human review (${linesChanged} lines changed).`, ...sections, ''].join('\n\n');
}
