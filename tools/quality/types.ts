export type ChangeStatus = 'added' | 'modified' | 'deleted' | 'renamed';

export interface ChangedFile {
  readonly path: string;
  readonly status: ChangeStatus;
  readonly linesChanged: number;
}

export type RiskCategory =
  | 'specs'
  | 'quality-gates'
  | 'dependencies'
  | 'tests-changed-with-code'
  | 'external-data'
  | 'deployment'
  | 'large-change';

export interface RiskFinding {
  readonly category: RiskCategory;
  readonly reason: string;
  readonly files: readonly string[];
}

export interface RiskReport {
  readonly findings: readonly RiskFinding[];
  readonly linesChanged: number;
}
